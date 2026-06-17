import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import ChevronRight from 'react-bootstrap-icons/dist/icons/chevron-right';

const COL_MIN_WIDTH = 150;

function SwimlaneCell({ stageId, laneId, tasks, projects, onEdit, isPersonalWorkspace }) {
  const droppableId = `${stageId}::${laneId}`;
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
        transition: 'border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease',
        minHeight: '72px',
        padding: '0.3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
      }}
    >
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        {tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} projects={projects} onEdit={onEdit} isPersonalWorkspace={isPersonalWorkspace} />
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

function SwimlaneRow({ project, laneId, tasks, stages, projects, onEdit, isExpanded, onToggle, isLast, isPersonalWorkspace, gridTemplate }) {
  const { t } = useTranslation();

  const tasksByStage = {};
  stages.forEach(s => { tasksByStage[s.id] = []; });
  tasks.forEach(task => {
    if (tasksByStage[task.stageId]) tasksByStage[task.stageId].push(task);
  });

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
          position: 'sticky',
          left: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = isExpanded ? 'rgba(255,255,255,0.015)' : 'transparent'; }}
      >
        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <ChevronRight
            size={11}
            className={`sidebar-chevron${isExpanded ? ' sidebar-chevron--open' : ''}`}
          />
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
          {stages.map(stage => {
            const count = tasksByStage[stage.id].length;
            return count > 0 ? (
              <span
                key={stage.id}
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: stage.color,
                  backgroundColor: `${stage.color}22`,
                  border: `1px solid ${stage.color}44`,
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
        <div className="sidebar-submenu" style={{
          display: 'grid',
          gridTemplateColumns: gridTemplate,
          gap: '0.4rem',
          padding: '0.3rem 0.75rem 0.6rem',
        }}>
          {stages.map(stage => (
            <SwimlaneCell
              key={stage.id}
              stageId={stage.id}
              laneId={laneId}
              tasks={tasksByStage[stage.id]}
              projects={projects}
              onEdit={onEdit}
              isPersonalWorkspace={isPersonalWorkspace}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KanbanSwimlane({ filteredTasks, swimLaneProjects, projects, stages = [], onEdit, isPersonalWorkspace }) {
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

  const gridTemplate = `repeat(${stages.length}, minmax(${COL_MIN_WIDTH}px, 1fr))`;
  const innerMinWidth = stages.length * COL_MIN_WIDTH;

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
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <div style={{ minWidth: innerMinWidth }}>
          {/* Column Label Header (sticks to top while scrolling) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            gap: '0.4rem',
            padding: '0.45rem 0.75rem',
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-elevated)',
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.025) 0%, transparent 100%)',
          }}>
            {stages.map(stage => (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: stage.color,
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {stage.name}
                </span>
              </div>
            ))}
          </div>

          {/* Swimlane Rows */}
          {lanes.map((lane, idx) => (
            <SwimlaneRow
              key={lane.id}
              project={lane.project}
              laneId={lane.id}
              tasks={lane.tasks}
              stages={stages}
              projects={projects}
              onEdit={onEdit}
              isExpanded={expanded[lane.id] !== false}
              onToggle={() => toggleLane(lane.id)}
              isLast={idx === lanes.length - 1}
              isPersonalWorkspace={isPersonalWorkspace}
              gridTemplate={gridTemplate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
