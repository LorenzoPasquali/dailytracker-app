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
import CalendarEvent from 'react-bootstrap-icons/dist/icons/calendar-event';

const PRIORITY_CONFIG = {
  HIGH:   { icon: ExclamationTriangleFill, color: '#ef4444' },
  MEDIUM: { icon: DashCircleFill,           color: '#f59e0b' },
  LOW:    { icon: ArrowDownCircleFill,       color: '#6b7280' },
};

function TaskCard({ task, projects = [], onEdit, isPersonalWorkspace, isOverlay = false, noMargin = false }) {
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

  // When dragging, the floating DragOverlay represents the card, so the
  // original slot stays pinned (no transform) and is shown as a clean dashed
  // placeholder via CSS — avoids the duplicated "ghost" card effect and keeps
  // the placeholder anchored when the list uses a no-shift sort strategy.
  // noMargin: the virtualized column controls vertical spacing via the row
  // wrapper's padding, so the card must not add its own marginBottom (margins
  // are excluded from offsetHeight and would desync the virtualizer measure).
  const style = {
    transform: (isOverlay || isDragging) ? undefined : CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    width: '100%',
    marginBottom: noMargin ? 0 : '0.5rem',
  };

  const wrapperClass = [
    'task-card-wrapper',
    isDragging ? 'task-card-wrapper--dragging' : '',
    isOverlay ? 'task-card--overlay' : '',
  ].filter(Boolean).join(' ');

  const cardStyle = {
    backgroundColor: isHovered && !isOverlay ? 'var(--bg-hover)' : 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderLeft: `3px solid ${projectColor}`,
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition), border-color var(--transition), box-shadow var(--transition), transform var(--transition)',
    boxShadow: isHovered && !isOverlay ? '0 4px 14px -6px rgba(0, 0, 0, 0.4)' : 'none',
    transform: isHovered && !isOverlay ? 'translateY(-1px)' : 'translateY(0)',
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
      className={wrapperClass}
      {...attributes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card style={cardStyle}>
        <div {...listeners} onClick={() => onEdit(task)} style={{ cursor: isOverlay ? 'grabbing' : 'grab' }}>
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

            {(() => {
              const now = new Date();
              const due = task.dueDate ? new Date(task.dueDate) : null;
              const isFinal = !!task.stage?.isFinal;
              const isOverdue = due && due < now && !isFinal;
              const isDueSoon = due && !isOverdue && (due - now) < 24 * 60 * 60 * 1000;
              const dueDateColor = isOverdue ? 'var(--danger)' : isDueSoon ? '#f59e0b' : 'var(--text-muted)';
              return due ? (
                <span style={{
                  fontSize: '0.73rem',
                  color: isFinal ? 'var(--text-muted)' : dueDateColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  marginTop: '0.3rem',
                }}>
                  <CalendarEvent size={11} style={{ flexShrink: 0 }} />
                  {due.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                  {', '}
                  {String(due.getHours()).padStart(2, '0')}:{String(due.getMinutes()).padStart(2, '0')}
                  {isOverdue && ` · ${t('task.overdue')}`}
                </span>
              ) : null;
            })()}

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

// Memoized: during drag, the board re-renders on every pointer move. Without
// this, every card re-renders each frame; with stable props only moved cards do.
export default React.memo(TaskCard);
