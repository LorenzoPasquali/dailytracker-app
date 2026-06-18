import React, { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Nav, Accordion, useAccordionButton, AccordionContext, Collapse } from 'react-bootstrap';
import ChevronRight from 'react-bootstrap-icons/dist/icons/chevron-right';
import {
  HomeIcon,
  LayersIcon,
  TrendingUpIcon,
  PlugZapIcon,
  ChartColumnIcon,
  ClipboardCheckIcon,
  BellIcon,
  BotIcon,
  FoldersIcon,
  LayoutGridIcon,
  TagIcon,
} from './icons/animated-icons';

// Shared row geometry. Padding-left is fixed so the icon sits at the same x
// whether the rail is open or collapsed — only the label fades around it.
const ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.7rem',
  padding: '0.7rem 1.1rem 0.7rem 1.25rem',
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  textDecoration: 'none',
  borderRadius: 0,
  whiteSpace: 'nowrap',
  borderLeft: '2px solid transparent',
};

const SUBITEM_STYLE = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.55rem 1.1rem 0.55rem 2.35rem',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  textDecoration: 'none',
  borderLeft: '2px solid transparent',
  whiteSpace: 'nowrap',
};

const applyHover = (e) => {
  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
  e.currentTarget.style.color = 'var(--text-primary)';
};
const clearHover = (e) => {
  e.currentTarget.style.backgroundColor = 'transparent';
  e.currentTarget.style.color = 'var(--text-secondary)';
};

// Expandable group header (Cadastros, Análise, Integrações). Hovering the
// whole row drives the icon's animation via its imperative handle.
function CustomToggle({ Icon, label, eventKey, isCollapsed, onToggleCollapse }) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey);
  const isOpen = activeEventKey === eventKey;
  const iconRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    if (isCollapsed) onToggleCollapse();
    decoratedOnClick();
  };

  return (
    <div
      role="button"
      className="sidebar-row sidebar-nav-link"
      onClick={handleClick}
      style={ROW_STYLE}
      onMouseEnter={(e) => { applyHover(e); iconRef.current?.startAnimation(); }}
      onMouseLeave={(e) => { clearHover(e); iconRef.current?.stopAnimation(); }}
    >
      <Icon ref={iconRef} size={16} className="sidebar-ico" />
      <span className="sidebar-label">{label}</span>
      <ChevronRight
        size={13}
        className={`sidebar-chevron${isOpen ? ' sidebar-chevron--open' : ''}`}
        style={{ flexShrink: 0 }}
      />
    </div>
  );
}

// Indented entry inside an expandable group. `active` paints the
// persistent-view highlight; modal triggers leave it false.
function SubItem({ Icon, label, onClick, active = false, dataTutorialId }) {
  const iconRef = useRef(null);
  return (
    <Nav.Link
      onClick={onClick}
      data-tutorial-id={dataTutorialId}
      className="sidebar-submenu-item"
      role="button"
      style={{
        ...SUBITEM_STYLE,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
        backgroundColor: active ? 'var(--bg-active)' : 'transparent',
      }}
      onMouseEnter={(e) => { if (!active) applyHover(e); iconRef.current?.startAnimation(); }}
      onMouseLeave={(e) => { if (!active) clearHover(e); iconRef.current?.stopAnimation(); }}
    >
      <Icon ref={iconRef} size={14} className="sidebar-ico sidebar-ico--sm" />
      {label}
    </Nav.Link>
  );
}

// Monitor sub-view row (Clássico / Moderno) — a tinted dot, not an icon.
function MonitorItem({ label, isActive, onClick }) {
  return (
    <div
      role="button"
      className="sidebar-submenu-item"
      onClick={onClick}
      style={{
        ...SUBITEM_STYLE,
        gap: '0.5rem',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
      }}
      onMouseEnter={(e) => { if (!isActive) applyHover(e); }}
      onMouseLeave={(e) => { if (!isActive) clearHover(e); }}
    >
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: isActive ? 'var(--accent)' : 'var(--text-muted)',
        flexShrink: 0,
        transition: 'background-color var(--transition)',
      }} />
      {label}
    </div>
  );
}

export default function Sidebar({
  onProjectsClick,
  onTaskTypesClick,
  onStagesClick,
  onReportsClick,
  onDailySummaryClick,
  onNotificationsClick,
  onMcpClick,
  isCollapsed,
  onToggleCollapse,
  monitorView,
  onMonitorViewChange,
  forceOpenRegistrations,
}) {
  const { t } = useTranslation();
  const [monitorExpanded, setMonitorExpanded] = useState(true);
  const [accordionKey, setAccordionKey] = useState(undefined);
  const [analysisKey, setAnalysisKey] = useState(undefined);
  const [integrationsKey, setIntegrationsKey] = useState(undefined);
  const monitorIconRef = useRef(null);

  useEffect(() => {
    if (forceOpenRegistrations) setAccordionKey('0');
  }, [forceOpenRegistrations]);

  // Keep a group open whenever its persistent view is active, so the
  // highlight isn't hidden behind a collapsed header.
  useEffect(() => {
    if (monitorView === 'reports') setAnalysisKey('analysis');
    if (monitorView === 'mcp') setIntegrationsKey('integrations');
  }, [monitorView]);

  const handleMonitorHeaderClick = (e) => {
    e.preventDefault();
    if (isCollapsed) {
      onToggleCollapse();
      return;
    }
    setMonitorExpanded(prev => !prev);
  };

  return (
    <div
      className={`app-sidebar h-100 d-flex flex-column${isCollapsed ? ' is-collapsed' : ''}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        zIndex: 2,
        overflowX: 'hidden',
        borderRight: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}
      data-tutorial-id="tutorial-sidebar"
    >
      <Nav className="flex-column flex-grow-1" style={{ paddingTop: '0.5rem' }}>

        {/* Monitor — expandable group with two views */}
        <div>
          <div
            role="button"
            className="sidebar-row sidebar-nav-link"
            onClick={handleMonitorHeaderClick}
            style={{ ...ROW_STYLE, userSelect: 'none' }}
            onMouseEnter={(e) => { applyHover(e); monitorIconRef.current?.startAnimation(); }}
            onMouseLeave={(e) => { clearHover(e); monitorIconRef.current?.stopAnimation(); }}
          >
            <HomeIcon ref={monitorIconRef} size={16} className="sidebar-ico" />
            <span className="sidebar-label">{t('sidebar.monitor')}</span>
            <ChevronRight
              size={13}
              className={`sidebar-chevron${monitorExpanded ? ' sidebar-chevron--open' : ''}`}
              style={{ flexShrink: 0 }}
            />
          </div>

          <Collapse in={!isCollapsed && monitorExpanded}>
            <div>
              <MonitorItem
                label={t('sidebar.monitorClassic')}
                isActive={monitorView === 'classic'}
                onClick={() => onMonitorViewChange('classic')}
              />
              <MonitorItem
                label={t('sidebar.monitorModern')}
                isActive={monitorView === 'modern'}
                onClick={() => onMonitorViewChange('modern')}
              />
            </div>
          </Collapse>
        </div>

        {/* Cadastros */}
        <Accordion activeKey={accordionKey} onSelect={(k) => setAccordionKey(k)}>
          <CustomToggle
            eventKey="0"
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            Icon={LayersIcon}
            label={t('sidebar.registrations')}
          />
          {!isCollapsed && (
            <Accordion.Collapse eventKey="0">
              <div>
                <SubItem
                  Icon={FoldersIcon}
                  label={t('sidebar.projects')}
                  onClick={onProjectsClick}
                  dataTutorialId="tutorial-sidebar-projects"
                />
                <SubItem
                  Icon={TagIcon}
                  label={t('sidebar.taskTypes')}
                  onClick={onTaskTypesClick}
                />
                <SubItem
                  Icon={LayoutGridIcon}
                  label={t('sidebar.stages')}
                  onClick={onStagesClick}
                  dataTutorialId="tutorial-sidebar-stages"
                />
              </div>
            </Accordion.Collapse>
          )}
        </Accordion>

        {/* Análise — relatórios + resumo diário */}
        <Accordion activeKey={analysisKey} onSelect={(k) => setAnalysisKey(k)}>
          <CustomToggle
            eventKey="analysis"
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            Icon={TrendingUpIcon}
            label={t('sidebar.analysis')}
          />
          {!isCollapsed && (
            <Accordion.Collapse eventKey="analysis">
              <div>
                <SubItem
                  Icon={ChartColumnIcon}
                  label={t('sidebar.reports')}
                  onClick={onReportsClick}
                  active={monitorView === 'reports'}
                />
                <SubItem
                  Icon={ClipboardCheckIcon}
                  label={t('summary.title')}
                  onClick={onDailySummaryClick}
                />
              </div>
            </Accordion.Collapse>
          )}
        </Accordion>

        {/* Integrações — notificações + MCP */}
        <Accordion activeKey={integrationsKey} onSelect={(k) => setIntegrationsKey(k)}>
          <CustomToggle
            eventKey="integrations"
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            Icon={PlugZapIcon}
            label={t('sidebar.integrations')}
          />
          {!isCollapsed && (
            <Accordion.Collapse eventKey="integrations">
              <div>
                <SubItem
                  Icon={BellIcon}
                  label={t('sidebar.notifications')}
                  onClick={onNotificationsClick}
                />
                <SubItem
                  Icon={BotIcon}
                  label={t('sidebar.mcp')}
                  onClick={onMcpClick}
                  active={monitorView === 'mcp'}
                />
              </div>
            </Accordion.Collapse>
          )}
        </Accordion>

      </Nav>
    </div>
  );
}
