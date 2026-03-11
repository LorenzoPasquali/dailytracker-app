import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import LanguageSelector from './LanguageSelector';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import api from '../services/api';
import { toast } from 'sonner';
import List from 'react-bootstrap-icons/dist/icons/list';
import PersonCircle from 'react-bootstrap-icons/dist/icons/person-circle';
import BoxArrowRight from 'react-bootstrap-icons/dist/icons/box-arrow-right';
import ArrowLeftSquare from 'react-bootstrap-icons/dist/icons/arrow-left-square';
import ArrowRightSquare from 'react-bootstrap-icons/dist/icons/arrow-right-square';
import MoonFill from 'react-bootstrap-icons/dist/icons/moon-fill';
import SunFill from 'react-bootstrap-icons/dist/icons/sun-fill';
import CircleHalf from 'react-bootstrap-icons/dist/icons/circle-half';
import PencilFill from 'react-bootstrap-icons/dist/icons/pencil-fill';
import CheckLg from 'react-bootstrap-icons/dist/icons/check-lg';
import XLg from 'react-bootstrap-icons/dist/icons/x-lg';

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
  onUserNameChange,
  onLogoutClick,
  onLanguageChange,
  theme,
  onThemeChange,
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  onWorkspaceManage,
  onCreateWorkspace,
}) {
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const handleStartEdit = () => {
    setNameValue(currentUser?.name || '');
    setEditingName(true);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
  };

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    if (trimmed === currentUser?.name) { setEditingName(false); return; }
    try {
      await api.put('/api/user/name', { name: trimmed });
      onUserNameChange?.(trimmed);
      setEditingName(false);
    } catch {
      toast.error(t('header.nameUpdateError'));
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  };
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
        {workspaces && workspaces.length > 0 && (
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={onWorkspaceChange}
            onWorkspaceManage={onWorkspaceManage}
            onCreateWorkspace={onCreateWorkspace}
          />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Button
          onClick={onNewTaskClick}
          size="sm"
          data-tutorial-id="tutorial-new-task-btn"
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
            variant={theme === 'light' ? undefined : 'dark'}
            className="p-2"
            style={{
              minWidth: '200px',
              marginTop: '8px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              boxShadow: theme === 'light' ? '0 8px 24px rgba(0, 0, 0, 0.12)' : '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}
          >
            <div style={{ padding: '0.5rem 0.6rem' }}>
              {editingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    maxLength={20}
                    style={{
                      flex: 1,
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.88rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                  <button onClick={handleSaveName} title={t('common.save')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                    <CheckLg size={14} />
                  </button>
                  <button onClick={handleCancelEdit} title={t('common.cancel')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
                    <XLg size={13} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser?.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser?.email}
                    </div>
                  </div>
                  <button
                    onClick={handleStartEdit}
                    title={t('header.editName')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <PencilFill size={12} />
                  </button>
                </div>
              )}
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

            {/* Theme toggle */}
            <div style={{ padding: '0.25rem 0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', paddingLeft: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                {t('header.appearance')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem' }}>
                {[
                  { value: 'dark', icon: <MoonFill size={12} />, label: t('header.darkMode') },
                  { value: 'light', icon: <SunFill size={12} />, label: t('header.lightMode') },
                  { value: 'system', icon: <CircleHalf size={12} />, label: t('header.systemMode') },
                ].map(({ value, icon, label }) => {
                  const isActive = theme === value;
                  return (
                    <button
                      key={value}
                      onClick={() => !isActive && onThemeChange(value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: 'var(--radius-sm)',
                        cursor: isActive ? 'default' : 'pointer',
                        background: isActive ? 'var(--bg-active)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                        outline: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {icon}
                      {label}
                    </button>
                  );
                })}
              </div>
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
