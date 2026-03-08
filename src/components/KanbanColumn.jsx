import React from 'react';
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

const statusColors = {
  PLANNED: 'var(--text-muted)',
  DOING: '#f59e0b',
  DONE: 'var(--accent)'
};

export default function KanbanColumn({ title, status, tasks = [], projects = [], onEdit, isMobile }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const columnStyle = {
    backgroundColor: 'var(--bg-elevated)',
    border: `1px solid ${isOver ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    outline: 'none',
    transition: 'border-color var(--transition), background-color var(--transition)',
    ...(isOver && { backgroundColor: 'var(--accent-subtle)' })
  };

  const tasksContainerStyle = {
    overflowY: isMobile ? 'hidden' : 'auto',
    overflowX: isMobile ? 'auto' : 'hidden',
    flexGrow: 1,
    display: isMobile ? 'flex' : 'block',
    flexDirection: isMobile ? 'row' : 'column',
    gap: isMobile ? '0.75rem' : '0',
    paddingBottom: isMobile ? '0.75rem' : '0',
    minHeight: isMobile ? '160px' : 'auto',
    alignItems: isMobile ? 'center' : 'stretch',
  };

  const taskIds = tasks.map(task => task.id);
  const dotColor = statusColors[status] || 'var(--text-muted)';

  return (
    <div ref={setNodeRef} style={columnStyle} className={`d-flex flex-column ${isMobile ? '' : 'h-100'}`}>
      <div style={{
        padding: '0.85rem 1.1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0
          }} />
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            textTransform: 'uppercase'
          }}>
            {title}
          </span>
        </div>
        <span style={{
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

      <div style={{ padding: '0.6rem', ...tasksContainerStyle }}>
        <SortableContext items={taskIds}>
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task.id} style={isMobile ? { minWidth: '75vw' } : {}}>
                <TaskCard task={task} projects={projects} onEdit={onEdit} />
              </div>
            ))
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
              padding: '2rem 0'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, opacity: 0.6 }}>
                Nenhuma tarefa
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
