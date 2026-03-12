import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-bootstrap';
import { isSameDay, parseISO, format, subDays } from 'date-fns';
import { getDatepickerLocale } from '../i18n/datepicker-locales';
import CheckCircleFill from 'react-bootstrap-icons/dist/icons/check-circle-fill';
import ArrowClockwise from 'react-bootstrap-icons/dist/icons/arrow-clockwise';
import ClipboardCheck from 'react-bootstrap-icons/dist/icons/clipboard-check';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import ChevronUp from 'react-bootstrap-icons/dist/icons/chevron-up';
import XLg from 'react-bootstrap-icons/dist/icons/x-lg';
import AlarmFill from 'react-bootstrap-icons/dist/icons/alarm-fill';
import PlayFill from 'react-bootstrap-icons/dist/icons/play-fill';

function getGreeting(date, t) {
  const hour = date.getHours();
  if (hour < 12) return t('summary.goodMorning');
  if (hour < 18) return t('summary.goodAfternoon');
  return t('summary.goodEvening');
}

const TASK_LIMIT = 5;

function TaskItem({ task, projects }) {
  const project = projects.find(p => p.id === task.projectId);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.45rem 0.75rem',
      borderRadius: 'var(--radius-sm)',
      transition: 'background-color var(--transition)',
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* Project color bar */}
      <div style={{
        width: '3px',
        height: '18px',
        borderRadius: '2px',
        backgroundColor: project?.color || 'var(--border-default)',
        flexShrink: 0,
      }} />
      <span style={{
        flex: 1,
        fontSize: '0.875rem',
        color: 'var(--text-primary)',
        lineHeight: 1.4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {task.title}
      </span>
      {project && (
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          color: project.color,
          backgroundColor: `${project.color}18`,
          border: `1px solid ${project.color}30`,
          padding: '0.15rem 0.5rem',
          borderRadius: '100px',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {project.name}
        </span>
      )}
    </div>
  );
}

function SummarySection({ icon, label, tasks, projects, color, accentBg, defaultExpanded = true }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const visibleTasks = showAll ? tasks : tasks.slice(0, TASK_LIMIT);
  const hiddenCount = tasks.length - TASK_LIMIT;

  if (tasks.length === 0) return null;

  return (
    <div style={{
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-elevated)',
    }}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.65rem 0.75rem',
          backgroundColor: accentBg,
          border: 'none',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none',
          transition: 'background-color var(--transition)',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{
          flex: 1,
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)',
          textAlign: 'left',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color,
          backgroundColor: `${color}18`,
          border: `1px solid ${color}30`,
          padding: '0.1rem 0.55rem',
          borderRadius: '100px',
          minWidth: '24px',
          textAlign: 'center',
        }}>
          {tasks.length}
        </span>
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {/* Task list */}
      {expanded && (
        <div style={{ padding: '0.35rem 0' }}>
          {visibleTasks.map(task => (
            <TaskItem key={task.id} task={task} projects={projects} />
          ))}
          {!showAll && hiddenCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.4rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'var(--accent)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                opacity: 0.85,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
            >
              + {t('summary.showMore', { count: hiddenCount })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function DailySummaryModal({ show, onClose, onSnooze, tasks, currentUser, projects }) {
  const { t, i18n } = useTranslation();
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [doneDay, setDoneDay] = useState('yesterday'); // 'yesterday' | 'today'

  const today = new Date();
  const yesterday = subDays(today, 1);
  const locale = getDatepickerLocale(i18n.language);

  const greeting = getGreeting(today, t);
  const firstName = currentUser?.name?.split(' ')[0] || '';

  const formattedDate = format(today, "EEEE',' dd 'de' MMMM 'de' yyyy", { locale });

  // Apply project filter
  const filteredTasks = useMemo(() => {
    if (selectedProjectIds.length === 0) return tasks;
    return tasks.filter(t => selectedProjectIds.includes(t.projectId));
  }, [tasks, selectedProjectIds]);

  // Section data
  const doneTasks = useMemo(() =>
    filteredTasks.filter(task =>
      task.status === 'DONE' &&
      isSameDay(parseISO(task.createdAt), doneDay === 'today' ? today : yesterday)
    ), [filteredTasks, today, yesterday, doneDay]);

  const doingTasks = useMemo(() =>
    filteredTasks.filter(task => task.status === 'DOING'),
    [filteredTasks]);

  const plannedTasks = useMemo(() =>
    filteredTasks.filter(task => task.status === 'PLANNED'),
    [filteredTasks]);

  const totalRelevant = doneTasks.length + doingTasks.length + plannedTasks.length;
  const completionRate = totalRelevant > 0
    ? Math.round((doneTasks.length / totalRelevant) * 100)
    : 0;

  const noTasksAtAll = tasks.length === 0;

  const handleProjectToggle = (id) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleClearProjects = () => setSelectedProjectIds([]);

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="md"
      backdrop
      keyboard
    >
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '0.35rem',
                fontFamily: 'var(--font-display)',
              }}>
                {t('summary.title')}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}>
                {greeting}{firstName ? `, ${firstName}` : ''}
              </h2>
              <p style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                margin: '0.25rem 0 0',
                textTransform: 'capitalize',
              }}>
                {formattedDate}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition)',
                flexShrink: 0,
                outline: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              aria-label="Fechar"
            >
              <XLg size={13} />
            </button>
          </div>
        </div>

        {/* ── PROJECT FILTER ── */}
        {projects.length > 0 && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
          }}>
            <div style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-display)',
            }}>
              {t('summary.filterByProject')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {/* "All" chip */}
              <button
                onClick={handleClearProjects}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: selectedProjectIds.length === 0 ? 'var(--accent)' : 'var(--text-muted)',
                  backgroundColor: selectedProjectIds.length === 0 ? 'var(--accent-subtle)' : 'transparent',
                  border: `1px solid ${selectedProjectIds.length === 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  borderRadius: '100px',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('summary.allProjects')}
              </button>

              {projects.map(project => {
                const isActive = selectedProjectIds.includes(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => handleProjectToggle(project.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isActive ? project.color : 'var(--text-muted)',
                      backgroundColor: isActive ? `${project.color}18` : 'transparent',
                      border: `1px solid ${isActive ? `${project.color}50` : 'var(--border-default)'}`,
                      borderRadius: '100px',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: project.color,
                      flexShrink: 0,
                    }} />
                    {project.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DATE FILTER ── */}
        <div style={{
          padding: '0.6rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
          }}>
            {t('summary.doneFilter')}
          </span>
          <div style={{
            display: 'flex',
            gap: '0.3rem',
            backgroundColor: 'var(--bg-active)',
            borderRadius: '100px',
            padding: '2px',
          }}>
            {['yesterday', 'today'].map(day => (
              <button
                key={day}
                onClick={() => setDoneDay(day)}
                style={{
                  padding: '0.2rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: doneDay === day ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: doneDay === day ? 'var(--bg-surface)' : 'transparent',
                  boxShadow: doneDay === day ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                }}
              >
                {t(`summary.day_${day}`)}
              </button>
            ))}
          </div>
        </div>

        {/* ── TASK SECTIONS ── */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}>
          {noTasksAtAll ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: 'var(--text-muted)',
            }}>
              <ClipboardCheck size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.875rem', margin: 0 }}>{t('summary.noTasks')}</p>
            </div>
          ) : (
            <>
              <SummarySection
                icon={<CheckCircleFill size={14} />}
                label={doneDay === 'today' ? t('summary.completedToday') : t('summary.completedYesterday')}
                tasks={doneTasks}
                projects={projects}
                color="#10b981"
                accentBg="rgba(16,185,129,0.06)"
                defaultExpanded={true}
              />
              <SummarySection
                icon={<ArrowClockwise size={14} />}
                label={t('summary.inProgress')}
                tasks={doingTasks}
                projects={projects}
                color="#f59e0b"
                accentBg="rgba(245,158,11,0.06)"
                defaultExpanded={true}
              />
              <SummarySection
                icon={<ClipboardCheck size={14} />}
                label={t('summary.plannedToday')}
                tasks={plannedTasks}
                projects={projects}
                color="var(--text-muted)"
                accentBg="var(--bg-hover)"
                defaultExpanded={true}
              />
              {doneTasks.length === 0 && doingTasks.length === 0 && plannedTasks.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  color: 'var(--text-muted)',
                }}>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>{t('summary.emptySection')}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── PROGRESS BAR ── */}
        {!noTasksAtAll && totalRelevant > 0 && (
          <div style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.45rem',
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
              }}>
                {t('summary.completionRate')}
              </span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: completionRate >= 50 ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
              }}>
                {completionRate}%
              </span>
            </div>
            <div style={{
              height: '5px',
              backgroundColor: 'var(--bg-active)',
              borderRadius: '100px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                height: '100%',
                width: `${completionRate}%`,
                backgroundColor: completionRate >= 50 ? 'var(--accent)' : '#f59e0b',
                borderRadius: '100px',
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.3rem',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}>
              <span>{t('summary.doneCount', { count: doneTasks.length })}</span>
              <span>{t('summary.totalCount', { count: totalRelevant })}</span>
            </div>
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{
          padding: '0.9rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.6rem',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onSnooze}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <AlarmFill size={13} />
            {t('summary.remindLater')}
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#fff',
              backgroundColor: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
          >
            <PlayFill size={13} />
            {t('summary.startDay')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
