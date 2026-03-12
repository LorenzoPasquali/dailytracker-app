import React, { useState, useRef, useEffect } from 'react';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill';
import PlusLg from 'react-bootstrap-icons/dist/icons/plus-lg';
import PersonFill from 'react-bootstrap-icons/dist/icons/person-fill';
import PeopleFill from 'react-bootstrap-icons/dist/icons/people-fill';

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  onWorkspaceManage,
  onCreateWorkspace,
  isMobile,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  const personal = workspaces.filter(w => w.isPersonal);
  const shared = workspaces.filter(w => !w.isPersonal);

  return (
    <div ref={ref} style={{ position: 'relative' }} data-tutorial-id="tutorial-workspace-switcher">
      <button
        onClick={() => setOpen(prev => !prev)}
        title={isMobile ? (activeWorkspace?.name ?? '…') : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: isMobile ? '0.3rem 0.4rem' : '0.3rem 0.6rem',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          maxWidth: isMobile ? '36px' : '180px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {activeWorkspace?.isPersonal
          ? <PersonFill size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
          : <PeopleFill size={13} style={{ flexShrink: 0, color: 'var(--accent)' }} />
        }
        {!isMobile && (
          <>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeWorkspace?.name ?? '…'}
            </span>
            <ChevronDown size={11} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          minWidth: '220px',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          zIndex: 1000,
          padding: '0.4rem 0',
        }}>
          {/* Personal workspace */}
          {personal.map(w => (
            <WorkspaceItem
              key={w.id}
              workspace={w}
              isActive={activeWorkspace?.id === w.id}
              onSelect={() => { onWorkspaceChange(w.id); setOpen(false); }}
              onManage={activeWorkspace?.id === w.id ? () => { onWorkspaceManage(w); setOpen(false); } : null}
            />
          ))}

          {/* Shared workspaces */}
          {shared.length > 0 && (
            <>
              <div style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '0.2rem',
                paddingTop: '0.5rem'
              }}>
                Compartilhados
              </div>
              {shared.map(w => (
                <WorkspaceItem
                  key={w.id}
                  workspace={w}
                  isActive={activeWorkspace?.id === w.id}
                  onSelect={() => { onWorkspaceChange(w.id); setOpen(false); }}
                  onManage={activeWorkspace?.id === w.id ? () => { onWorkspaceManage(w); setOpen(false); } : null}
                />
              ))}
            </>
          )}

          {/* Create new workspace */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.2rem', paddingTop: '0.2rem' }}>
            <button
              onClick={() => { onCreateWorkspace(); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 500,
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <PlusLg size={13} /> Novo workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkspaceItem({ workspace, isActive, onSelect, onManage }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.75rem',
        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
        cursor: 'pointer',
        gap: '0.5rem',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
        {workspace.isPersonal
          ? <PersonFill size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
          : <PeopleFill size={13} style={{ flexShrink: 0, color: 'var(--accent)' }} />
        }
        <span style={{
          fontSize: '0.85rem',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: isActive ? 500 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {workspace.name}
        </span>
      </div>
      {onManage && (
        <button
          onClick={(e) => { e.stopPropagation(); onManage(); }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.1rem',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          title="Gerenciar workspace"
        >
          <GearFill size={13} />
        </button>
      )}
    </div>
  );
}
