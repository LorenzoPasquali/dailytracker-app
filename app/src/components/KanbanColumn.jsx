import React from 'react';
import { Badge } from 'react-bootstrap';
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';

export default function KanbanColumn({ title, status, tasks = [], projects = [], onEdit, isMobile }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const columnStyle = {
    backgroundColor: 'rgba(13, 17, 23, 0.7)',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: isMobile ? '0.375rem' : '0.25rem',
    overflow: 'hidden',
  };

  const desktopStyle = {
    ...columnStyle,
    transition: 'background-color 0.2s ease-in-out',
    ...(isOver && { backgroundColor: 'rgba(167, 139, 250, 0.1)' }),
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
      <div className="p-2 border-bottom border-secondary d-flex justify-content-between align-items-center flex-shrink-0">
        <h6 className="mb-0 text-light fw-normal">{title}</h6>
        <Badge pill bg="dark" className="text-secondary">{tasks.length}</Badge>
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