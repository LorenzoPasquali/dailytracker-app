import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TaskCard({ task, projects = [], onEdit }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const descriptionRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  useEffect(() => {
    const element = descriptionRef.current;
    if (element) {
      const isContentTruncated = element.scrollHeight > element.clientHeight;
      setIsTruncated(isContentTruncated);
    }
  }, [task.description]);

  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const taskType = project && task.taskTypeId ? project.taskTypes.find(tt => tt.id === task.taskTypeId) : null;

  const projectColor = project ? project.color : 'transparent';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
    opacity: isDragging ? 0.9 : 1,
    cursor: 'grab',
    borderLeft: `3px solid ${projectColor}`,
    borderRadius: '8px',
    boxShadow: isDragging
      ? '0 12px 24px rgba(0,0,0,0.5), 0 8px 8px rgba(0,0,0,0.3)'
      : (isHovered ? '0 6px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0, 0, 0, 0.2)'),
    width: '100%',
    margin: '0 auto',
    scale: isDragging ? '1.03' : '1',
    zIndex: isDragging ? 999 : 1,
    position: 'relative'
  };

  const cardStyle = {
    backgroundColor: isHovered ? '#1c2128' : '#161b22',
    border: '1px solid #30363d',
    borderRadius: '8px',
    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
    transform: isHovered && !isDragging ? 'translateY(-2px)' : 'translateY(0)',
  };

  const handleCardClick = () => {
    onEdit(task);
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        style={cardStyle}
        className="mb-2 text-light"
      >
        <div {...listeners} onClick={handleCardClick} style={{ cursor: 'grab' }}>
          <Card.Body className="p-2">
            <div className="d-flex justify-content-between">
              <div className="d-flex align-items-center" style={{ minWidth: 0 }}>
                {project && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: projectColor,
                      boxShadow: `0 0 8px ${projectColor}`,
                      marginRight: '8px',
                      flexShrink: 0
                    }}
                  />
                )}
                <span className="mb-0 small text-truncate fw-semibold" style={{ letterSpacing: '0.2px' }}>{task.title}</span>
              </div>
            </div>

            <div
              ref={descriptionRef}
              className="task-description-container"
              style={{
                fontSize: '0.85em',
                color: task.description ? '#8b949e' : 'transparent',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                marginTop: '0.5rem',
                lineHeight: '1.5',
                minHeight: '1.275em', // 0.85em * 1.5 line-height
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                WebkitLineClamp: isHovered && isTruncated ? 'unset' : 1,
                userSelect: task.description ? 'text' : 'none',
              }}
            >
              {task.description || '\u00A0'}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-white-50">
                {formatDate(task.updatedAt)}
              </small>
              <div>
                {taskType && (
                  <Badge pill bg="dark" className="fw-normal text-secondary">{taskType.name}</Badge>
                )}
              </div>
            </div>
          </Card.Body>
        </div>
      </Card>
    </div>
  );
}