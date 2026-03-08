import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Nav, Accordion, useAccordionButton, AccordionContext, Tooltip, OverlayTrigger } from 'react-bootstrap';
import HouseDoorFill from 'react-bootstrap-icons/dist/icons/house-door-fill';
import CollectionFill from 'react-bootstrap-icons/dist/icons/collection-fill';
import BarChartFill from 'react-bootstrap-icons/dist/icons/bar-chart-fill';
import Folder from 'react-bootstrap-icons/dist/icons/folder';
import TagFill from 'react-bootstrap-icons/dist/icons/tag-fill';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import ChevronUp from 'react-bootstrap-icons/dist/icons/chevron-up';
import ChatDotsFill from 'react-bootstrap-icons/dist/icons/chat-dots-fill';

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

export default function Sidebar({ onProjectsClick, onTaskTypesClick, onAiClick, isCollapsed, onToggleCollapse, isMobile }) {
  const { t } = useTranslation();
  const sidebarStyle = {
    width: isCollapsed ? '56px' : '240px',
    backgroundColor: 'var(--bg-surface)',
    zIndex: 2,
    transition: 'width 0.2s ease',
    overflowX: 'hidden',
    borderRight: '1px solid var(--border-subtle)',
    flexShrink: 0
  };

  const activeLinkStyle = {
    borderLeft: '2px solid var(--accent)',
    background: 'var(--accent-subtle)',
    color: 'var(--text-primary)',
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

  return (
    <div style={sidebarStyle} className="h-100 d-flex flex-column">
      <Nav className="flex-column flex-grow-1" style={{ paddingTop: '0.5rem' }}>
        <Nav.Link
          href="#"
          style={{ ...linkStyle, ...activeLinkStyle }}
          onClick={isCollapsed ? onToggleCollapse : null}
          onMouseEnter={e => {
            if (!activeLinkStyle.color) e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            if (!activeLinkStyle.color) e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <HouseDoorFill size={16} className="flex-shrink-0" />
          {!isCollapsed && t('sidebar.monitor')}
        </Nav.Link>

        <Accordion>
          <CustomToggle eventKey="0" isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse}>
            <CollectionFill size={16} className="flex-shrink-0" />
            {!isCollapsed && t('sidebar.registrations')}
          </CustomToggle>
          {!isCollapsed && (
            <Accordion.Collapse eventKey="0">
              <div>
                <Nav.Link
                  onClick={onProjectsClick}
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

        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={<Tooltip id="tooltip-reports">{t('sidebar.reportsTooltip')}</Tooltip>}
        >
          <div style={{ ...linkStyle, cursor: 'not-allowed', opacity: 0.5 }}>
            <BarChartFill size={16} className="flex-shrink-0" />
            {!isCollapsed && t('sidebar.reports')}
          </div>
        </OverlayTrigger>

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
      </Nav>
    </div>
  );
}
