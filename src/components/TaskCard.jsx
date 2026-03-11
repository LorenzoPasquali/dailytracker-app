import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Badge } from 'react-bootstrap';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExclamationTriangleFill from 'react-bootstrap-icons/dist/icons/exclamation-triangle-fill';
import DashCircleFill from 'react-bootstrap-icons/dist/icons/dash-circle-fill';
import ArrowDownCircleFill from 'react-bootstrap-icons/dist/icons/arrow-down-circle-fill';
import PersonFill from 'react-bootstrap-icons/dist/icons/person-fill';
import SlashCircle from 'react-bootstrap-icons/dist/icons/slash-circle';

const PRIORITY_CONFIG = {
  HIGH:   { icon: ExclamationTriangleFill, color: '#ef4444' },
  MEDIUM: { icon: DashCircleFill,           color: '#f59e0b' },
  LOW:    { icon: ArrowDownCircleFill,       color: '#6b7280' },
};

export default function TaskCard({ task, projects = [], onEdit, isPersonalWorkspace }) {
  const { i18n, t } = useTranslation();
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
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [task.description]);

  const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
  const taskType = project && task.taskTypeId ? project.taskTypes.find(tt => tt.id === task.taskTypeId) : null;
  const projectColor = project ? project.color : 'transparent';

  const priorityKey = task.priority || 'MEDIUM';
  const priorityConfig = PRIORITY_CONFIG[priorityKey] || PRIORITY_CONFIG.MEDIUM;
  const PriorityIcon = priorityConfig.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 150ms ease',
    opacity: isDragging ? 0.85 : 1,
    cursor: 'grab',
    width: '100%',
    margin: '0 auto',
    scale: isDragging ? '1.02' : '1',
    zIndex: isDragging ? 999 : 1,
    position: 'relative'
  };

  const cardStyle = {
    backgroundColor: isHovered ? 'var(--bg-hover)' : 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderLeft: `3px solid ${projectColor}`,
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition)',
    boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.4)' : 'none',
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card style={cardStyle} className="mb-2">
        <div {...listeners} onClick={() => onEdit(task)} style={{ cursor: 'grab' }}>
          <Card.Body style={{ padding: '0.75rem 0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}>
                {task.title}
              </span>
            </div>

            <div
              ref={descriptionRef}
              className="task-description-container"
              style={{
                fontSize: '0.84rem',
                color: task.description ? 'var(--text-muted)' : 'transparent',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                marginTop: '0.4rem',
                lineHeight: 1.5,
                minHeight: '1.26em',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                WebkitLineClamp: isHovered && isTruncated ? 'unset' : 1,
                userSelect: task.description ? 'text' : 'none',
              }}
            >
              {task.description || '\u00A0'}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
              gap: '0.25rem',
              minWidth: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                overflow: 'hidden',
                minWidth: 0,
                flex: 1,
              }}>
                <PriorityIcon
                  size={11}
                  style={{ color: priorityConfig.color, flexShrink: 0 }}
                  title={t(`taskForm.priority${priorityKey.charAt(0) + priorityKey.slice(1).toLowerCase()}`)}
                />
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  opacity: 0.7,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {formatDate(task.createdAt)}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  opacity: 0.45,
                  flexShrink: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  minWidth: 0,
                }}>
                  {formatTime(task.createdAt)}
                </span>
              </div>
              {!isPersonalWorkspace && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.68rem',
                  color: task.assigneeName ? 'var(--accent)' : 'var(--text-muted)',
                  backgroundColor: task.assigneeName 
                    ? 'color-mix(in srgb, var(--accent) 10%, transparent)' 
                    : 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '100px',
                  fontWeight: 500,
                  flexShrink: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  maxWidth: '7.5rem',
                  opacity: task.assigneeName ? 1 : 0.65,
                }}>
                  {task.assigneeName ? (
                    <>
                      <PersonFill size={9} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.assigneeName}
                      </span>
                    </>
                  ) : (
                    <>
                      <PersonFill size={9} style={{ flexShrink: 0, opacity: 0.8 }} />
                      <SlashCircle size={7.5} style={{ flexShrink: 0, marginLeft: '-0.32rem', marginTop: '0.05rem', opacity: 0.8 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85, fontSize: '0.62rem' }}>
                        {t('taskForm.noAssignee')}
                      </span>
                    </>
                  )}
                </span>
              )}
              {taskType && (
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-hover)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '100px',
                  fontWeight: 500,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {taskType.name}
                </span>
              )}
            </div>
          </Card.Body>
        </div>
      </Card>
    </div>
  );
}
