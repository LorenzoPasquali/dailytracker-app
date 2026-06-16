import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Search from 'react-bootstrap-icons/dist/icons/search';
import XLg from 'react-bootstrap-icons/dist/icons/x-lg';
import Folder from 'react-bootstrap-icons/dist/icons/folder';
import CardText from 'react-bootstrap-icons/dist/icons/card-text';
import { normalizeText, taskMatches, buildProjectIndex } from '../utils/search';

const MAX_PROJECTS = 5;
const MAX_TASKS = 7;
const STATUS_KEY = { PLANNED: 'kanban.planned', DOING: 'kanban.doing', DONE: 'kanban.done' };

export default function GlobalSearch({
  query,
  onQueryChange,
  tasks = [],
  projects = [],
  onSelectTask,
  onSelectProject,
  isMobile,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);        // dropdown visibility
  const [expanded, setExpanded] = useState(false); // mobile input expansion
  const [focused, setFocused] = useState(false);   // drives the focus ring
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const normalized = normalizeText(query);
  const projectIndex = useMemo(() => buildProjectIndex(projects), [projects]);

  const matchedProjects = useMemo(() => {
    if (!normalized) return [];
    return projects.filter((p) => normalizeText(p.name).includes(normalized)).slice(0, MAX_PROJECTS);
  }, [projects, normalized]);

  const allTaskMatches = useMemo(() => {
    if (!normalized) return [];
    return tasks.filter((tk) => taskMatches(tk, normalized, projectIndex));
  }, [tasks, normalized, projectIndex]);

  const matchedTasks = allTaskMatches.slice(0, MAX_TASKS);

  // Flat list of selectable rows for keyboard navigation (projects first).
  const flatItems = useMemo(
    () => [
      ...matchedProjects.map((p) => ({ kind: 'project', data: p })),
      ...matchedTasks.map((tk) => ({ kind: 'task', data: tk })),
    ],
    [matchedProjects, matchedTasks]
  );

  // Reset the keyboard highlight whenever the result set changes.
  useEffect(() => { setActiveIndex(-1); }, [normalized]);

  // Close on outside click; collapse the mobile bar when the query is empty.
  useEffect(() => {
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        if (isMobile && !normalizeText(query)) setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [isMobile, query]);

  // Cmd/Ctrl+K focuses the search from anywhere.
  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isMobile) setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isMobile]);

  const handleChange = (e) => {
    onQueryChange(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleFocus = () => { if (normalized) setOpen(true); };

  const clear = () => {
    onQueryChange('');
    setActiveIndex(-1);
    setOpen(false);
    inputRef.current?.focus();
  };

  const collapseMobile = () => {
    onQueryChange('');
    setOpen(false);
    setExpanded(false);
  };

  const selectItem = (item) => {
    if (!item) return;
    if (item.kind === 'project') {
      // Selecting a project hands control back to the project pill filter, so
      // the global search query must be cleared (otherwise it keeps dominating).
      onQueryChange('');
      setExpanded(false);
      onSelectProject?.(item.data.id);
    } else {
      onSelectTask?.(item.data);
    }
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        e.preventDefault();
        selectItem(flatItems[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (normalized) clear();
      else if (isMobile) collapseMobile();
      else inputRef.current?.blur();
    }
  };

  // Mobile collapsed: just an icon that expands into the search bar.
  if (isMobile && !expanded) {
    return (
      <button
        ref={rootRef}
        onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        aria-label={t('search.placeholder')}
        className="no-focus-override"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', padding: '0.25rem',
        }}
      >
        <Search size={18} />
      </button>
    );
  }

  const rootStyle = isMobile
    ? {
        position: 'absolute', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0 0.75rem', backgroundColor: 'var(--bg-surface)',
      }
    : {
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: '440px', padding: '0 1rem', zIndex: 40,
      };

  const showPanel = open && normalized.length > 0;
  const active = focused || showPanel; // accent state: focused or results open
  let flatCursor = -1; // running index aligned with flatItems for highlight

  return (
    <div ref={rootRef} style={rootStyle}>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <Search
          size={16}
          style={{
            position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--accent)', pointerEvents: 'none',
            transition: 'color var(--transition)',
          }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => { setFocused(true); handleFocus(); }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          style={{
            width: '100%',
            padding: '0.5rem 2.1rem 0.5rem 2.6rem',
            fontSize: '0.88rem',
            fontFamily: 'inherit',
            backgroundColor: active ? 'var(--bg-elevated)' : 'var(--bg-hover)',
            border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
            borderRadius: '999px',
            color: 'var(--text-primary)',
            outline: 'none',
            boxShadow: active ? '0 0 0 3px var(--accent-subtle)' : 'none',
            transition: 'border-color var(--transition), box-shadow var(--transition), background-color var(--transition)',
          }}
        />
        {query && (
          <button
            onClick={clear}
            aria-label={t('common.cancel')}
            style={{
              position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: '0.25rem', display: 'flex',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <XLg size={13} />
          </button>
        )}

        {showPanel && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
              zIndex: 1000,
              maxHeight: '60vh', overflowY: 'auto',
              padding: '0.35rem 0',
            }}
          >
            {flatItems.length === 0 ? (
              <div style={{ padding: '0.75rem 0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {t('search.noResults', { query })}
              </div>
            ) : (
              <>
                {matchedProjects.length > 0 && (
                  <GroupHeader label={t('search.projects')} />
                )}
                {matchedProjects.map((project) => {
                  flatCursor += 1;
                  const idx = flatCursor;
                  return (
                    <Row
                      key={`p-${project.id}`}
                      active={idx === activeIndex}
                      onSelect={() => selectItem({ kind: 'project', data: project })}
                      onHover={() => setActiveIndex(idx)}
                      icon={<Folder size={13} style={{ color: project.color || 'var(--text-muted)', flexShrink: 0 }} />}
                      title={project.name}
                    />
                  );
                })}

                {matchedTasks.length > 0 && (
                  <GroupHeader
                    label={t('search.tasks')}
                    count={allTaskMatches.length}
                    withBorder={matchedProjects.length > 0}
                  />
                )}
                {matchedTasks.map((task) => {
                  flatCursor += 1;
                  const idx = flatCursor;
                  const project = task.projectId != null ? projectIndex.get(task.projectId) : null;
                  const meta = [project?.name, t(STATUS_KEY[task.status] || '')].filter(Boolean).join(' · ');
                  return (
                    <Row
                      key={`t-${task.id}`}
                      active={idx === activeIndex}
                      onSelect={() => selectItem({ kind: 'task', data: task })}
                      onHover={() => setActiveIndex(idx)}
                      icon={
                        <CardText
                          size={13}
                          style={{ color: project?.color || 'var(--text-muted)', flexShrink: 0 }}
                        />
                      }
                      title={task.title}
                      meta={meta}
                    />
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {isMobile && (
        <button
          onClick={collapseMobile}
          aria-label={t('common.cancel')}
          className="no-focus-override"
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: '0.25rem', display: 'flex', flexShrink: 0,
          }}
        >
          <XLg size={18} />
        </button>
      )}
    </div>
  );
}

function GroupHeader({ label, count, withBorder }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.35rem 0.85rem 0.3rem',
        fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        borderTop: withBorder ? '1px solid var(--border-subtle)' : 'none',
        marginTop: withBorder ? '0.25rem' : 0,
        paddingTop: withBorder ? '0.5rem' : '0.35rem',
      }}
    >
      <span>{label}</span>
      {count != null && <span style={{ opacity: 0.8 }}>{count}</span>}
    </div>
  );
}

function Row({ active, onSelect, onHover, icon, title, meta }) {
  return (
    <div
      // onMouseDown (not onClick) so selection runs before the input blurs.
      onMouseDown={(e) => { e.preventDefault(); onSelect(); }}
      onMouseEnter={onHover}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.55rem',
        padding: '0.45rem 0.85rem',
        cursor: 'pointer',
        backgroundColor: active ? 'var(--bg-active)' : 'transparent',
      }}
    >
      {icon}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {meta && (
          <div
            style={{
              fontSize: '0.72rem', color: 'var(--text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}
