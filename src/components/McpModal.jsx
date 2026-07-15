import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Spinner } from 'react-bootstrap';
import Robot from 'react-bootstrap-icons/dist/icons/robot';
import Clipboard from 'react-bootstrap-icons/dist/icons/clipboard';
import Trash from 'react-bootstrap-icons/dist/icons/trash';
import PlusLg from 'react-bootstrap-icons/dist/icons/plus-lg';
import ShieldLock from 'react-bootstrap-icons/dist/icons/shield-lock';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import ChevronRight from 'react-bootstrap-icons/dist/icons/chevron-right';
import { toast } from 'sonner';
import api from '../services/api';

// Streamable HTTP endpoint — what the native "add custom connector" (OAuth) flow speaks, and what
// mcp-remote (legacy dt_mcp_ fallback) also connects to.
const MCP_URL = `${api.defaults.baseURL}/mcp`;

function buildSnippet(token) {
  return JSON.stringify(
    {
      mcpServers: {
        dailytracker: {
          command: 'npx',
          args: ['-y', 'mcp-remote', MCP_URL, '--header', `Authorization: Bearer ${token}`],
        },
      },
    },
    null,
    2,
  );
}

export default function McpModal({ show, handleClose }) {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState(null);
  const [label, setLabel] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState(null); // plaintext, shown once
  const [grants, setGrants] = useState(null);      // authorized OAuth apps
  const [legacyOpen, setLegacyOpen] = useState(false);

  useEffect(() => {
    if (show) {
      setNewToken(null);
      setLegacyOpen(false);
      loadGrants();
    }
  }, [show]);

  const load = () => api.get('/api/mcp/tokens')
    .then(res => setTokens(res.data))
    .catch(() => setTokens([]));

  const loadGrants = () => api.get('/api/oauth/authorizations')
    .then(res => setGrants(res.data))
    .catch(() => setGrants([]));

  const copy = async (text, okMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(okMsg || t('mcp.copied'));
    } catch {
      toast.error(t('mcp.copyError'));
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post('/api/mcp/tokens', {
        label: label.trim() || undefined,
        readOnly,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      });
      setNewToken(res.data.token);
      setLabel('');
      setReadOnly(false);
      setExpiresInDays('');
      load();
      toast.success(t('mcp.tokenCreatedToast'));
    } catch {
      /* interceptor toasts the error */
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm(t('mcp.revokeConfirm'))) return;
    try {
      await api.delete(`/api/mcp/tokens/${id}`);
      toast.success(t('mcp.revoked'));
      load();
    } catch {
      /* interceptor toasts the error */
    }
  };

  const handleRevokeGrant = async (id) => {
    if (!window.confirm(t('mcp.grantRevokeConfirm'))) return;
    try {
      await api.delete(`/api/oauth/authorizations/${id}`);
      toast.success(t('mcp.grantRevoked'));
      loadGrants();
    } catch {
      /* interceptor toasts the error */
    }
  };

  const toggleLegacy = () => {
    const opening = !legacyOpen;
    setLegacyOpen(opening);
    if (opening && tokens === null) load();
  };

  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : null);

  // ── styles ─────────────────────────────────────────────────────────────────
  const card = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '0.9rem 1rem',
    marginBottom: '1rem',
  };
  const sectionTitle = {
    fontFamily: 'var(--font-display)',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    margin: '0 0 0.6rem',
  };
  const input = {
    padding: '0.55rem 0.7rem',
    backgroundColor: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
  };
  const btnPrimary = {
    padding: '0.55rem 0.9rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-base)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  };
  const codeBox = {
    backgroundColor: 'var(--bg-base)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '0.7rem 0.8rem',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'pre',
    overflowX: 'auto',
    margin: 0,
  };
  const iconBtn = {
    background: 'none',
    border: '1px solid var(--border-default)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.35rem 0.55rem',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.78rem',
  };
  const stepList = {
    color: 'var(--text-secondary)',
    fontSize: '0.83rem',
    lineHeight: 1.6,
    margin: '0 0 0.6rem',
    paddingLeft: '1.1rem',
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="border-0 bg-transparent">
      <div className="custom-modal-content">
        <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Robot size={18} />
            {t('mcp.title')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 0, marginBottom: '1rem' }}>
            {t('mcp.subtitle')}
          </p>

          {/* ── Primary: native OAuth connector ─────────────────────────────── */}
          <div style={{ ...card, borderColor: 'var(--accent-border)' }}>
            <h3 style={sectionTitle}>{t('mcp.connectTitle')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 0.7rem' }}>
              {t('mcp.connectHelp')}
            </p>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: '0.3rem' }}>
              {t('mcp.endpointLabel')}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.9rem' }}>
              <code style={{ ...codeBox, flex: 1, whiteSpace: 'nowrap' }}>{MCP_URL}</code>
              <button style={iconBtn} onClick={() => copy(MCP_URL)}><Clipboard size={13} /></button>
            </div>
            <ol style={stepList}>
              <li>{t('mcp.connectStep1')}</li>
              <li>{t('mcp.connectStep2')}</li>
              <li>{t('mcp.connectStep3')}</li>
            </ol>
          </div>

          {/* ── Authorized apps (OAuth grants) ──────────────────────────────── */}
          <div style={card}>
            <h3 style={sectionTitle}>{t('mcp.grantsTitle')}</h3>
            {grants === null && (
              <div style={{ textAlign: 'center', padding: '0.8rem' }}><Spinner animation="border" size="sm" style={{ color: 'var(--text-muted)' }} /></div>
            )}
            {grants && grants.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{t('mcp.noGrants')}</p>
            )}
            {grants && grants.map((g) => (
              <div
                key={g.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem',
                  padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600 }}>{g.clientName}</span>
                    {(g.scopes || []).map((s) => (
                      <span key={s} style={{
                        fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                      }}>{s}</span>
                    ))}
                  </div>
                  {g.authorizedAt && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '0.15rem' }}>
                      {t('mcp.authorizedOn', { date: fmtDate(g.authorizedAt) })}
                    </div>
                  )}
                </div>
                <button
                  style={{ ...iconBtn, color: 'var(--danger)', borderColor: 'var(--danger-subtle)', flexShrink: 0 }}
                  onClick={() => handleRevokeGrant(g.id)}
                >
                  <Trash size={13} /> {t('mcp.revoke')}
                </button>
              </div>
            ))}
          </div>

          {/* ── Advanced / legacy: dt_mcp_ token + mcp-remote ───────────────── */}
          <div style={{ ...card, marginBottom: 0 }}>
            <button
              onClick={toggleLegacy}
              style={{
                ...sectionTitle, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', marginBottom: legacyOpen ? '0.8rem' : 0,
              }}
            >
              {legacyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {t('mcp.legacyTitle')}
            </button>

            {legacyOpen && (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 1rem' }}>{t('mcp.legacyHelp')}</p>

                {/* One-time new token banner */}
                {newToken && (
                  <div style={{ ...card, borderColor: 'var(--accent-border)', background: 'var(--accent-subtle)' }}>
                    <h3 style={{ ...sectionTitle, marginBottom: '0.35rem' }}>{t('mcp.tokenCreatedTitle')}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.6rem' }}>
                      {t('mcp.tokenCreatedWarning')}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <code style={{ ...codeBox, flex: 1, whiteSpace: 'nowrap' }}>{newToken}</code>
                      <button style={iconBtn} onClick={() => copy(newToken, t('mcp.tokenCopied'))}>
                        <Clipboard size={13} /> {t('mcp.copy')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Config snippet */}
                <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block', marginBottom: '0.3rem' }}>
                  {t('mcp.snippetTitle')}
                </label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0 0 0.4rem' }}>{t('mcp.snippetHelp')}</p>
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                  <pre style={codeBox}>{buildSnippet(newToken || t('mcp.tokenPlaceholder'))}</pre>
                  <button
                    style={{ ...iconBtn, position: 'absolute', top: 8, right: 8 }}
                    onClick={() => copy(buildSnippet(newToken || t('mcp.tokenPlaceholder')))}
                  >
                    <Clipboard size={13} /> {t('mcp.copy')}
                  </button>
                </div>

                {/* Create token */}
                <h3 style={sectionTitle}>{t('mcp.newTokenTitle')}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 200px' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t('mcp.labelField')}</label>
                    <input style={input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('mcp.labelPlaceholder')} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: 140 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t('mcp.expiresField')}</label>
                    <input style={input} type="number" min="1" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder={t('mcp.neverExpires')} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.82rem', cursor: 'pointer', paddingBottom: '0.55rem' }}>
                    <input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} />
                    <ShieldLock size={13} /> {t('mcp.readOnlyLabel')}
                  </label>
                </div>
                <button style={{ ...btnPrimary, marginTop: '0.8rem', opacity: creating ? 0.6 : 1 }} onClick={handleCreate} disabled={creating}>
                  {creating ? <Spinner animation="border" size="sm" /> : <PlusLg size={15} />}
                  {t('mcp.createToken')}
                </button>

                {/* Token list */}
                <h3 style={{ ...sectionTitle, marginTop: '1.2rem' }}>{t('mcp.tokensTitle')}</h3>
                {tokens === null && (
                  <div style={{ textAlign: 'center', padding: '1rem' }}><Spinner animation="border" size="sm" style={{ color: 'var(--text-muted)' }} /></div>
                )}
                {tokens && tokens.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{t('mcp.noTokens')}</p>
                )}
                {tokens && tokens.map((tk) => (
                  <div
                    key={tk.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem',
                      padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600 }}>{tk.label}</span>
                        <span style={{
                          fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                        }}>
                          {tk.readOnly ? t('mcp.readOnlyBadge') : t('mcp.readWriteBadge')}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '0.15rem' }}>
                        {t('mcp.createdOn', { date: fmtDate(tk.createdAt) })}
                        {tk.lastUsedAt && ` · ${t('mcp.lastUsed', { date: fmtDate(tk.lastUsedAt) })}`}
                        {tk.expiresAt
                          ? ` · ${t('mcp.expiresOn', { date: fmtDate(tk.expiresAt) })}`
                          : ` · ${t('mcp.neverExpiresLabel')}`}
                      </div>
                    </div>
                    <button
                      style={{ ...iconBtn, color: 'var(--danger)', borderColor: 'var(--danger-subtle)', flexShrink: 0 }}
                      onClick={() => handleRevoke(tk.id)}
                    >
                      <Trash size={13} /> {t('mcp.revoke')}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
}
