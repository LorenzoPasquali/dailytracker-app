import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Nav, Accordion, useAccordionButton, AccordionContext, Tooltip, OverlayTrigger } from 'react-bootstrap';
import HouseDoorFill from 'react-bootstrap-icons/dist/icons/house-door-fill';
import CollectionFill from 'react-bootstrap-icons/dist/icons/collection-fill';
import BarChartFill from 'react-bootstrap-icons/dist/icons/bar-chart-fill';
import Folder from 'react-bootstrap-icons/dist/icons/folder';
import TagFill from 'react-bootstrap-icons/dist/icons/tag-fill';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import ChevronUp from 'react-bootstrap-icons/dist/icons/chevron-up';
import ChevronRight from 'react-bootstrap-icons/dist/icons/chevron-right';
import ChatDotsFill from 'react-bootstrap-icons/dist/icons/chat-dots-fill';
import ClipboardCheck from 'react-bootstrap-icons/dist/icons/clipboard-check';

function CustomToggle({ children, eventKey, isCollapsed, onToggleCollapse }) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey);
  const isCurrentEventKey = activeEventKey === eventKey;

  const handleClick = (e) => {
    e.preventDefault();
    if (isCollapsed) onToggleCollapse();
    decoratedOnClick();
  };

  if (isCollapsed) {
    return (
      <div
        onClick={handleClick}
        role="button"
        style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1.1rem',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        transition: 'all var(--transition)'
      }}
      onClick={handleClick}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      role="button"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
        {children}
      </div>
      {isCurrentEventKey ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
    </div>
  );
}

export default function Sidebar({
  onProjectsClick,
  onTaskTypesClick,
  onAiClick,
  onReportsClick,
  onDailySummaryClick,
  isCollapsed,
  onToggleCollapse,
  isMobile,
  monitorView,
  onMonitorViewChange,
  forceOpenRegistrations,
  isPersonalWorkspace,
}) {
  const { t } = useTranslation();
  const [monitorExpanded, setMonitorExpanded] = useState(true);
  const [accordionKey, setAccordionKey] = useState(undefined);

  useEffect(() => {
    if (forceOpenRegistrations) setAccordionKey('0');
  }, [forceOpenRegistrations]);

  const sidebarStyle = {
    width: isCollapsed ? '56px' : '240px',
    backgroundColor: 'var(--bg-surface)',
    zIndex: 2,
    transition: 'width 0.2s ease',
    overflowX: 'hidden',
    borderRight: '1px solid var(--border-subtle)',
    flexShrink: 0
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: isCollapsed ? '0.75rem' : '0.75rem 1.1rem',
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textDecoration: 'none',
    borderRadius: 0,
    transition: 'all var(--transition)',
    whiteSpace: 'nowrap',
    borderLeft: '2px solid transparent'
  };

  const handleMonitorHeaderClick = (e) => {
    e.preventDefault();
    if (isCollapsed) {
      onToggleCollapse();
      return;
    }
    setMonitorExpanded(prev => !prev);
  };

  const handleMonitorViewSelect = (view) => {
    onMonitorViewChange(view);
  };

  return (
    <div style={sidebarStyle} className="h-100 d-flex flex-column" data-tutorial-id="tutorial-sidebar">
      <Nav className="flex-column flex-grow-1" style={{ paddingTop: '0.5rem' }}>

        {/* Monitor Section - Expandable */}
        <div>
          {/* Monitor Header */}
          <div
            role="button"
            onClick={handleMonitorHeaderClick}
            style={{
              display: 'flex',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              alignItems: 'center',
              padding: isCollapsed ? '0.75rem' : '0.75rem 1.1rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderLeft: '2px solid var(--accent)',
              background: 'var(--accent-subtle)',
              transition: 'all var(--transition)',
              userSelect: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
              <HouseDoorFill size={16} className="flex-shrink-0" />
              {!isCollapsed && t('sidebar.monitor')}
            </div>
            {!isCollapsed && (
              monitorExpanded
                ? <ChevronDown size={13} style={{ flexShrink: 0 }} />
                : <ChevronRight size={13} style={{ flexShrink: 0 }} />
            )}
          </div>

          {/* Monitor Sub-items */}
          {!isCollapsed && monitorExpanded && (
            <div>
              {/* Classic View */}
              <div
                role="button"
                onClick={() => handleMonitorViewSelect('classic')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem 0.55rem 2.35rem',
                  fontSize: '0.85rem',
                  color: monitorView === 'classic' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderLeft: `2px solid ${monitorView === 'classic' ? 'var(--accent)' : 'transparent'}`,
                  backgroundColor: monitorView === 'classic' ? 'var(--bg-active)' : 'transparent',
                  transition: 'all var(--transition)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (monitorView !== 'classic') {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (monitorView !== 'classic') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: monitorView === 'classic' ? 'var(--accent)' : 'var(--text-muted)',
                  flexShrink: 0,
                  transition: 'background-color var(--transition)',
                }} />
                {t('sidebar.monitorClassic')}
              </div>

              {/* Modern View */}
              <div
                role="button"
                onClick={() => handleMonitorViewSelect('modern')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem 0.55rem 2.35rem',
                  fontSize: '0.85rem',
                  color: monitorView === 'modern' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderLeft: `2px solid ${monitorView === 'modern' ? 'var(--accent)' : 'transparent'}`,
                  backgroundColor: monitorView === 'modern' ? 'var(--bg-active)' : 'transparent',
                  transition: 'all var(--transition)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (monitorView !== 'modern') {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (monitorView !== 'modern') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: monitorView === 'modern' ? 'var(--accent)' : 'var(--text-muted)',
                  flexShrink: 0,
                  transition: 'background-color var(--transition)',
                }} />
                {t('sidebar.monitorModern')}
              </div>
            </div>
          )}
        </div>

        {/* Records Accordion */}
        <Accordion activeKey={accordionKey} onSelect={(k) => setAccordionKey(k)}>
          <CustomToggle eventKey="0" isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse}>
            <CollectionFill size={16} className="flex-shrink-0" />
            {!isCollapsed && t('sidebar.registrations')}
          </CustomToggle>
          {!isCollapsed && (
            <Accordion.Collapse eventKey="0">
              <div>
                <Nav.Link
                  onClick={onProjectsClick}
                  data-tutorial-id="tutorial-sidebar-projects"
                  style={{ ...linkStyle, paddingLeft: '2.25rem', borderLeft: 'none' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  role="button"
                >
                  <Folder size={14} /> {t('sidebar.projects')}
                </Nav.Link>
                <Nav.Link
                  onClick={onTaskTypesClick}
                  style={{ ...linkStyle, paddingLeft: '2.25rem', borderLeft: 'none' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  role="button"
                >
                  <TagFill size={14} /> {t('sidebar.taskTypes')}
                </Nav.Link>
              </div>
            </Accordion.Collapse>
          )}
        </Accordion>

        <Nav.Link
          onClick={isCollapsed ? () => { onToggleCollapse(); onReportsClick(); } : onReportsClick}
          style={{
            ...linkStyle,
            color: monitorView === 'reports' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderLeft: `2px solid ${monitorView === 'reports' ? 'var(--accent)' : 'transparent'}`,
            backgroundColor: monitorView === 'reports' ? 'var(--bg-active)' : 'transparent',
          }}
          onMouseEnter={e => {
            if (monitorView !== 'reports') {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={e => {
            if (monitorView !== 'reports') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          role="button"
        >
          <BarChartFill size={16} className="flex-shrink-0" />
          {!isCollapsed && t('sidebar.reports')}
        </Nav.Link>

        <Nav.Link
          onClick={isCollapsed ? () => { onToggleCollapse(); onDailySummaryClick?.(); } : onDailySummaryClick}
          style={linkStyle}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          role="button"
        >
          <ClipboardCheck size={16} className="flex-shrink-0" />
          {!isCollapsed && t('summary.title')}
        </Nav.Link>

        {isPersonalWorkspace !== false && (
          <Nav.Link
            onClick={isCollapsed ? () => { onToggleCollapse(); onAiClick(); } : onAiClick}
            style={linkStyle}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            role="button"
          >
            <ChatDotsFill size={16} className="flex-shrink-0" />
            {!isCollapsed && t('sidebar.aiAssistant')}
          </Nav.Link>
        )}
      </Nav>
    </div>
  );
}
