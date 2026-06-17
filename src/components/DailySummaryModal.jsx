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
      gap: '0.5rem',
      padding: '0.35rem 0.6rem',
      borderRadius: 'var(--radius-sm)',
      transition: 'background-color var(--transition)',
      marginBottom: '2px',
    }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{
        width: '3px',
        height: '14px',
        borderRadius: '2px',
        backgroundColor: project?.color || 'var(--border-default)',
        flexShrink: 0,
      }} />
      <span style={{
        flex: 1,
        fontSize: '0.8rem',
        color: 'var(--text-primary)',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {task.title}
      </span>
    </div>
  );
}

function SummarySection({ icon, label, tasks, projects, color, accentBg }) {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-elevated)',
      height: '100%',
      minHeight: '200px',
    }}>
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.65rem 0.75rem',
          backgroundColor: accentBg,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{
          flex: 1,
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)',
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color,
          backgroundColor: `${color}18`,
          border: `1px solid ${color}30`,
          padding: '0.1rem 0.45rem',
          borderRadius: '100px',
          minWidth: '22px',
          textAlign: 'center',
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Task list with internal scroll */}
      <div style={{ 
        padding: '0.35rem 0.2rem', 
        overflowY: 'auto', 
        flex: 1,
        maxHeight: '400px'
      }}>
        {tasks.length === 0 ? (
          <div style={{ 
            padding: '2rem 1rem', 
            textAlign: 'center', 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            opacity: 0.5 
          }}>
            {t('summary.emptySection')}
          </div>
        ) : (
          tasks.map(task => (
            <TaskItem key={task.id} task={task} projects={projects} />
          ))
        )}
      </div>
    </div>
  );
}

export default function DailySummaryModal({ show, onClose, tasks, currentUser, projects, stages = [] }) {
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

  // Stage semantics: final stages = completed; first stage = planned;
  // everything else (non-final, non-first) = in progress.
  const firstStageId = stages[0]?.id ?? null;

  // Section data
  const doneTasks = useMemo(() =>
    filteredTasks.filter(task =>
      !!task.stage?.isFinal &&
      isSameDay(parseISO(task.createdAt), doneDay === 'today' ? today : yesterday)
    ), [filteredTasks, today, yesterday, doneDay]);

  const doingTasks = useMemo(() =>
    filteredTasks.filter(task => !task.stage?.isFinal && task.stageId !== firstStageId),
    [filteredTasks, firstStageId]);

  const plannedTasks = useMemo(() =>
    filteredTasks.filter(task => !task.stage?.isFinal && task.stageId === firstStageId),
    [filteredTasks, firstStageId]);

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
      size="xl"
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
        maxHeight: '95vh',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          padding: '1.25rem 1.5rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
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
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}>
                {greeting}{firstName ? `, ${firstName}` : ''}
              </h2>
              <p style={{
                fontSize: '0.85rem',
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
                width: '32px',
                height: '32px',
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
            >
              <XLg size={14} />
            </button>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
          alignItems: 'center',
        }}>
          {/* Projects */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              <button
                onClick={handleClearProjects}
                style={{
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: selectedProjectIds.length === 0 ? 'var(--accent)' : 'var(--text-muted)',
                  backgroundColor: selectedProjectIds.length === 0 ? 'var(--accent-subtle)' : 'transparent',
                  border: `1px solid ${selectedProjectIds.length === 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  borderRadius: '100px',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  outline: 'none',
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
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isActive ? project.color : 'var(--text-muted)',
                      backgroundColor: isActive ? `${project.color}18` : 'transparent',
                      border: `1px solid ${isActive ? `${project.color}50` : 'var(--border-default)'}`,
                      borderRadius: '100px',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                      outline: 'none',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: project.color }} />
                    {project.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Selector */}
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
                  padding: '0.25rem 0.85rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '100px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  outline: 'none',
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

        {/* ── TASK GRID ── */}
        <div style={{
          padding: '1.5rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}>
          {noTasksAtAll ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <ClipboardCheck size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '1rem', margin: 0 }}>{t('summary.noTasks')}</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              alignItems: 'start',
            }}>
              <SummarySection
                icon={<CheckCircleFill size={14} />}
                label={doneDay === 'today' ? t('summary.completedToday') : t('summary.completedYesterday')}
                tasks={doneTasks}
                projects={projects}
                color="#10b981"
                accentBg="rgba(16,185,129,0.06)"
              />
              <SummarySection
                icon={<ArrowClockwise size={14} />}
                label={t('summary.inProgress')}
                tasks={doingTasks}
                projects={projects}
                color="#f59e0b"
                accentBg="rgba(245,158,11,0.06)"
              />
              <SummarySection
                icon={<ClipboardCheck size={14} />}
                label={t('summary.plannedToday')}
                tasks={plannedTasks}
                projects={projects}
                color="var(--text-muted)"
                accentBg="var(--bg-hover)"
              />
            </div>
          )}
        </div>

        {/* ── FOOTER WITH PROGRESS ── */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
        }}>
          {!noTasksAtAll && totalRelevant > 0 && (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  {t('summary.completionRate')}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {completionRate}%
                </span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-active)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${completionRate}%`, backgroundColor: 'var(--accent)', transition: 'width 0.8s ease' }} />
              </div>
            </div>
          )}
          
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: '#fff',
              backgroundColor: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              outline: 'none',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
          >
            <PlayFill size={16} />
            {t('summary.startDay')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
