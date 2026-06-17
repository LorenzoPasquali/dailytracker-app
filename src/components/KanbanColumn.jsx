import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import TaskCard from './TaskCard';

// No-shift strategy: cards never slide to "make room" during a drag. The drop
// position is shown by a single insertion line (JIRA-style) instead, which is
// far cheaper and is required for the column to stay correct under windowing
// (the virtualizer already owns each row's translateY).
const noShiftStrategy = () => null;

const ROW_ESTIMATE = 104; // approx card height incl. the row's paddingBottom gap

function InsertionLine({ top }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '0.1rem',
        right: '0.1rem',
        height: '2px',
        transform: `translateY(${top}px)`,
        background: 'var(--accent)',
        borderRadius: '2px',
        zIndex: 3,
        boxShadow: '0 0 0 1px var(--accent), 0 0 6px var(--accent-subtle)',
        pointerEvents: 'none',
      }}
    />
  );
}

function KanbanColumn({ title, status, color, tasks = [], projects = [], onEdit, isMobile, isPersonalWorkspace, dropIndex = null }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const scrollRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 8,
    getItemKey: (index) => tasks[index].id,
  });

  const columnStyle = {
    backgroundColor: isOver ? 'var(--bg-active)' : 'var(--bg-elevated)',
    backgroundImage: 'linear-gradient(to bottom, var(--bg-hover) 0%, var(--bg-elevated) 100%)',
    border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border-subtle)'}`,
    boxShadow: isOver
      ? '0 0 0 1px var(--accent-border), inset 0 0 24px var(--accent-subtle)'
      : 'none',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease',
  };

  const taskIds = tasks.map(task => task.id);
  const dotColor = color || 'var(--text-muted)';

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Resolve the insertion line's y-offset. dropIndex === tasks.length means
  // "after the last card" → bottom of the sizing area; otherwise it sits at the
  // top edge of the card currently at that index (inside the gap above it).
  let lineTop = null;
  if (dropIndex != null && tasks.length > 0) {
    if (dropIndex >= tasks.length) {
      lineTop = Math.max(0, totalSize - 4);
    } else {
      const target = virtualItems.find(vi => vi.index === dropIndex);
      if (target) lineTop = target.start;
    }
  }

  return (
    <div ref={setNodeRef} style={columnStyle} className="d-flex flex-column h-100">
      {!isMobile && (
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              flexShrink: 0
            }} />
            <h3 style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
              margin: 0
            }}>
              {title}
            </h3>
          </div>
          <span
            aria-label={t('kanban.tasksCount', { count: tasks.length })}
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-hover)',
              padding: '0.15rem 0.55rem',
              borderRadius: '100px',
              fontWeight: 500
            }}>
            {tasks.length}
          </span>
        </div>
      )}

      <div ref={scrollRef} className="kanban-virtual-col" style={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, padding: '0.6rem' }}>
        <SortableContext items={taskIds} strategy={noShiftStrategy}>
          {tasks.length > 0 ? (
            <div style={{ position: 'relative', width: '100%', height: `${totalSize}px` }}>
              {lineTop != null && <InsertionLine top={lineTop} />}
              {virtualItems.map(virtualItem => {
                const task = tasks[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                      paddingBottom: '0.5rem',
                    }}
                  >
                    <TaskCard task={task} projects={projects} onEdit={onEdit} isPersonalWorkspace={isPersonalWorkspace} noMargin />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: isMobile ? '60vh' : '100%',
              width: '100%',
              padding: '2rem 0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                minHeight: '64px',
                margin: '0 0.2rem',
                border: `1.5px dashed ${isOver ? 'var(--accent-border)' : 'transparent'}`,
                borderRadius: 'var(--radius-md)',
                backgroundColor: isOver ? 'var(--accent-subtle)' : 'transparent',
                transition: 'all 200ms ease',
              }}>
                <p style={{
                  color: isOver ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  margin: 0,
                  opacity: isOver ? 0.9 : 0.6,
                  transition: 'color 200ms ease, opacity 200ms ease',
                }}>
                  {t('kanban.noTasks')}
                </p>
              </div>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default React.memo(KanbanColumn);
