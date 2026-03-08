import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import LanguageSelector from './LanguageSelector';
import List from 'react-bootstrap-icons/dist/icons/list';
import PersonCircle from 'react-bootstrap-icons/dist/icons/person-circle';
import BoxArrowRight from 'react-bootstrap-icons/dist/icons/box-arrow-right';
import ArrowLeftSquare from 'react-bootstrap-icons/dist/icons/arrow-left-square';
import ArrowRightSquare from 'react-bootstrap-icons/dist/icons/arrow-right-square';

const CustomToggle = React.forwardRef(({ onClick }, ref) => (
  <a
    href=""
    ref={ref}
    onClick={(e) => { e.preventDefault(); onClick(e); }}
    className="p-0 user-menu-btn"
    aria-label="Menu do usuário"
    style={{ color: 'var(--text-muted)', transition: 'color var(--transition)' }}
    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
  >
    <PersonCircle size={26} />
  </a>
));

export default function AppHeader({
  isMobile,
  isSidebarCollapsed,
  onToggleCollapse,
  onToggleMobileSidebar,
  onNewTaskClick,
  currentUser,
  onLogoutClick,
  onLanguageChange
}) {
  const { t } = useTranslation();
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1.25rem',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      height: '54px',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isMobile ? (
          <Button
            variant="link"
            onClick={onToggleMobileSidebar}
            className="sidebar-toggle-btn no-focus-override"
            aria-label="Abrir menu lateral"
            style={{ color: 'var(--text-muted)', padding: '0.25rem' }}
          >
            <List size={20} />
          </Button>
        ) : (
          <OverlayTrigger
            placement="right"
            delay={{ show: 250, hide: 400 }}
            overlay={
              <Tooltip id="tooltip-collapse">
                {isSidebarCollapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}
              </Tooltip>
            }
          >
            <Button
              variant="link"
              onClick={onToggleCollapse}
              className="sidebar-toggle-btn no-focus-override"
              aria-label={isSidebarCollapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}
              style={{ color: 'var(--text-muted)', padding: '0.25rem' }}
            >
              {isSidebarCollapsed ? <ArrowRightSquare size={15} /> : <ArrowLeftSquare size={15} />}
            </Button>
          </OverlayTrigger>
        )}
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px'
        }}>
          DailyTracker
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Button
          onClick={onNewTaskClick}
          size="sm"
          style={{
            backgroundColor: 'var(--accent)',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--bg-base)',
            letterSpacing: '-0.01em'
          }}
        >
          {isMobile ? t('header.newTaskMobile') : t('header.newTask')}
        </Button>

        <Dropdown align="end">
          <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components" />
          <Dropdown.Menu
            variant="dark"
            className="p-2"
            style={{
              minWidth: '200px',
              marginTop: '8px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ padding: '0.5rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                {currentUser?.email}
              </div>
              <Badge style={{
                marginTop: '0.35rem',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
                fontWeight: 500,
                fontSize: '0.7rem'
              }}>
                {t('header.basicPlan')}
              </Badge>
            </div>
            <Dropdown.Divider style={{ borderColor: 'var(--border-subtle)' }} />
            
            {/* Language Selection inside Dropdown */}
            <div style={{ padding: '0.25rem 0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingLeft: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                {t('common.languageLabel')}
              </div>
              <LanguageSelector variant="dropdown" onSaveToServer={onLanguageChange} />
            </div>

            <Dropdown.Divider style={{ borderColor: 'var(--border-subtle)' }} />
            <Dropdown.Item as="div" className="p-0">
              <Button
                size="sm"
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={onLogoutClick}
                style={{
                  backgroundColor: 'var(--danger-subtle)',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <BoxArrowRight className="me-2" size={14} /> {t('header.logout')}
              </Button>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}
