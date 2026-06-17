import React from 'react';
import { useTranslation } from 'react-i18next';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

function KanbanColumn({ title, status, color, tasks = [], projects = [], onEdit, isMobile, isPersonalWorkspace }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });

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

  const tasksContainerStyle = {
    overflowY: 'auto',
    overflowX: 'hidden',
    flexGrow: 1,
  };

  const taskIds = tasks.map(task => task.id);
  const dotColor = color || 'var(--text-muted)';

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

      <div style={{ padding: '0.6rem', ...tasksContainerStyle }}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskCard key={task.id} task={task} projects={projects} onEdit={onEdit} isPersonalWorkspace={isPersonalWorkspace} />
            ))
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
