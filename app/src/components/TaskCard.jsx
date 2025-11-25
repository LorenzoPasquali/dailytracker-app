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
    transition: transition || 'all 0.2s ease',
    opacity: isDragging ? 0.8 : 1,
    cursor: 'grab',
    borderLeft: `4px solid ${projectColor}`,
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    width: '100%',
    margin: '0 auto',
  };

  const cardStyle = {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: '7px',
    transition: 'all 0.2s ease-in-out',
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
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: projectColor,
                      marginRight: '8px',
                      flexShrink: 0
                    }}
                  />
                )}
                <span className="mb-0 small text-truncate">{task.title}</span>
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