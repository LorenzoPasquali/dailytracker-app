import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableContext } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import ChevronRight from 'react-bootstrap-icons/dist/icons/chevron-right';

const STATUS_COLORS = {
  PLANNED: 'var(--text-muted)',
  DOING: '#f59e0b',
  DONE: 'var(--accent)',
};

const STATUSES = ['PLANNED', 'DOING', 'DONE'];

function SwimlaneCell({ status, laneId, tasks, projects, onEdit }) {
  const droppableId = `${status}::${laneId}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const taskIds = tasks.map(t => t.id);

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 0,
        border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-md)',
        backgroundColor: isOver ? 'rgba(16,185,129,0.06)' : 'var(--bg-elevated)',
        boxShadow: isOver ? '0 0 0 1px var(--accent), inset 0 0 12px var(--accent-subtle)' : 'none',
        transition: 'all 200ms ease',
        minHeight: '72px',
        padding: '0.3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
      }}
    >
      <SortableContext items={taskIds}>
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} projects={projects} onEdit={onEdit} />
          ))
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '56px',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.35 }}>—</span>
          </div>
        )}
      </SortableContext>
    </div>
  );
}

function SwimlaneRow({ project, laneId, tasks, projects, onEdit, isExpanded, onToggle, isLast }) {
  const { t } = useTranslation();

  const tasksByStatus = {
    PLANNED: tasks.filter(t => t.status === 'PLANNED'),
    DOING: tasks.filter(t => t.status === 'DOING'),
    DONE: tasks.filter(t => t.status === 'DONE'),
  };

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)' }}>
      {/* Swimlane Header */}
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.5rem 0.75rem',
          cursor: 'pointer',
          backgroundColor: isExpanded ? 'rgba(255,255,255,0.015)' : 'transparent',
          transition: 'background-color var(--transition)',
          userSelect: 'none',
          outline: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = isExpanded ? 'rgba(255,255,255,0.015)' : 'transparent'; }}
      >
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </span>

        <span style={{
          width: '9px',
          height: '9px',
          borderRadius: '2px',
          backgroundColor: project ? project.color : '#6b7280',
          flexShrink: 0,
        }} />

        <span style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.01em',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {project ? project.name : t('kanban.noProject')}
        </span>

        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
          {STATUSES.map(status => {
            const count = tasksByStatus[status].length;
            return count > 0 ? (
              <span
                key={status}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: STATUS_COLORS[status],
                  backgroundColor: `${STATUS_COLORS[status]}22`,
                  border: `1px solid ${STATUS_COLORS[status]}44`,
                  padding: '0.08rem 0.4rem',
                  borderRadius: '100px',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}
              >
                {count}
              </span>
            ) : null;
          })}
          {tasks.length === 0 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.4 }}>0</span>
          )}
        </div>
      </div>

      {/* Swimlane Body */}
      {isExpanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.4rem',
          padding: '0.3rem 0.75rem 0.6rem',
        }}>
          {STATUSES.map(status => (
            <SwimlaneCell
              key={status}
              status={status}
              laneId={laneId}
              tasks={tasksByStatus[status]}
              projects={projects}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KanbanSwimlane({ filteredTasks, swimLaneProjects, projects, onEdit }) {
  const { t } = useTranslation();

  const tasksWithoutProject = filteredTasks.filter(
    task => !task.projectId || !projects.find(p => p.id === task.projectId)
  );

  const lanes = [
    ...swimLaneProjects.map(p => ({
      id: `project_${p.id}`,
      project: p,
      tasks: filteredTasks.filter(task => task.projectId === p.id),
    })),
    ...(tasksWithoutProject.length > 0
      ? [{ id: 'no_project', project: null, tasks: tasksWithoutProject }]
      : []
    ),
  ];

  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(lanes.map(l => [l.id, true]))
  );

  useEffect(() => {
    setExpanded(prev => {
      const next = { ...prev };
      lanes.forEach(lane => {
        if (!(lane.id in next)) next[lane.id] = true;
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes.length]);

  const toggleLane = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (lanes.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-surface)',
      }}>
        {t('kanban.noTasks')}
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-surface)',
    }}>
      {/* Column Label Header (doesn't scroll) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.4rem',
        padding: '0.45rem 0.75rem',
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-elevated)',
        flexShrink: 0,
        backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.025) 0%, transparent 100%)',
      }}>
        {STATUSES.map(status => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: STATUS_COLORS[status],
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}>
              {status === 'PLANNED'
                ? t('kanban.planned')
                : status === 'DOING'
                  ? t('kanban.doing')
                  : t('kanban.done')}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable Swimlane Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {lanes.map((lane, idx) => (
          <SwimlaneRow
            key={lane.id}
            project={lane.project}
            laneId={lane.id}
            tasks={lane.tasks}
            projects={projects}
            onEdit={onEdit}
            isExpanded={expanded[lane.id] !== false}
            onToggle={() => toggleLane(lane.id)}
            isLast={idx === lanes.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
