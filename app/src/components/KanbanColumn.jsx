import React from 'react';
import { Badge } from 'react-bootstrap';
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

export default function KanbanColumn({ title, status, tasks = [], projects = [], onEdit, isMobile }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const columnStyle = {
    backgroundColor: 'rgba(22, 27, 34, 0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(48, 54, 61, 0.5)',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: isMobile ? '0.375rem' : '0.5rem',
    overflow: 'hidden',
    outline: 'none', // Prevent focus outlines after drop
  };

  const desktopStyle = {
    ...columnStyle,
    transition: 'all 0.3s ease-in-out',
    // Explicitly define the base border color when not over so it resets
    borderColor: isOver ? 'rgba(59, 130, 246, 0.4)' : 'rgba(48, 54, 61, 0.5)',
    ...(isOver && {
      backgroundColor: 'rgba(59, 130, 246, 0.10)',
      boxShadow: '0 0 15px rgba(59, 130, 246, 0.15), inset 0 0 10px rgba(59, 130, 246, 0.1)',
    }),
  };

  const tasksContainerStyle = {
    overflowY: isMobile ? 'hidden' : 'auto',
    overflowX: isMobile ? 'auto' : 'hidden',
    flexGrow: 1,
    display: isMobile ? 'flex' : 'block',
    flexDirection: isMobile ? 'row' : 'column',
    gap: isMobile ? '1rem' : '0',
    paddingBottom: isMobile ? '1rem' : '0',
    minHeight: isMobile ? '170px' : 'auto',
    alignItems: isMobile ? 'center' : 'stretch',
  };

  const taskIds = tasks.map(task => task.id);

  return (
    <div ref={setNodeRef} style={isMobile ? columnStyle : desktopStyle} className={`d-flex flex-column ${isMobile ? '' : 'h-100'}`}>
      <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-shrink-0" style={{ borderColor: 'rgba(48, 54, 61, 0.5)' }}>
        <h6 className="mb-0 text-light fw-semibold" style={{ letterSpacing: '0.5px' }}>{title}</h6>
        <Badge pill bg="transparent" className="text-secondary border border-secondary fw-normal">{tasks.length}</Badge>
      </div>

      <div className="p-2" style={tasksContainerStyle}>
        <SortableContext items={taskIds}>
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task.id} style={isMobile ? { minWidth: '75vw' } : {}}>
                <TaskCard task={task} projects={projects} onEdit={onEdit} />
              </div>
            ))
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 w-100">
              <p className="text-secondary text-center small">Nenhuma tarefa</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}