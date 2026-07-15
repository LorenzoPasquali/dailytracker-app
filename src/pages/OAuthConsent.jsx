import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import Robot from 'react-bootstrap-icons/dist/icons/robot';
import ShieldLock from 'react-bootstrap-icons/dist/icons/shield-lock';
import { toast } from 'sonner';
import api from '../services/api';
import CssParticles from '../components/CssParticles';

const SCOPE_META = {
  'mcp:read': { key: 'oauthConsent.scopeRead', locked: false },
  'mcp:write': { key: 'oauthConsent.scopeWrite', locked: false },
};

/**
 * OAuth 2.1 consent page. The API's Authorization Server bounces an unauthenticated
 * /oauth2/authorize hit here (preserving the query string). The logged-in user picks read/write,
 * and we POST the approval to mint a one-time ticket, then top-level navigate to the resume URL so
 * the Authorization Server can issue the code back to the connector (e.g. Claude).
 */
export default function OAuthConsent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const requestedScopes = useMemo(
    () => (params.scope ? params.scope.trim().split(/[\s+]+/).filter(Boolean) : []),
    [params.scope],
  );

  const [info, setInfo] = useState(null);
  const [approved, setApproved] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Require login; bounce to /login and come back here afterwards.
  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?next=${next}`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!params.client_id) {
      setError(t('oauthConsent.invalidRequest'));
      return;
    }
    api
      .get('/api/oauth/consent-info', { params: { client_id: params.client_id, scope: params.scope } })
      .then((res) => {
        setInfo(res.data);
        setApproved(new Set(res.data.requestedScopes || requestedScopes));
      })
      .catch(() => setError(t('oauthConsent.invalidRequest')));
  }, [params.client_id, params.scope, requestedScopes, t]);

  const toggle = (scope) => {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  };

  const handleApprove = async () => {
    if (approved.size === 0) {
      toast.error(t('oauthConsent.needScope'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/api/oauth/consent', {
        params,
        approvedScopes: Array.from(approved),
      });
      window.location.href = res.data.resumeUrl;
    } catch {
      setSubmitting(false);
      /* interceptor toasts the error */
    }
  };

  const handleDeny = () => {
    if (params.redirect_uri) {
      const url = new URL(params.redirect_uri);
      url.searchParams.set('error', 'access_denied');
      if (params.state) url.searchParams.set('state', params.state);
      window.location.href = url.toString();
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const scopeList = (info?.requestedScopes && info.requestedScopes.length > 0)
    ? info.requestedScopes
    : requestedScopes;

  const shell = (children) => (
    <div style={{
      position: 'relative', width: '100vw', minHeight: '100vh', backgroundColor: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '1.5rem',
    }}>
      <CssParticles />
      <div className="animate-fade-in-up delay-1" style={{ width: '100%', maxWidth: '440px' }}>
        {children}
      </div>
    </div>
  );

  const card = {
    padding: '2rem',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
  };

  if (error) {
    return shell(
      <div style={card}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: 0 }}>
          {t('oauthConsent.errorTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{error}</p>
        <button style={secondaryBtn} onClick={() => navigate('/dashboard', { replace: true })}>
          {t('oauthConsent.backToApp')}
        </button>
      </div>,
    );
  }

  if (!info) {
    return shell(
      <div style={{ ...card, textAlign: 'center' }}>
        <Spinner animation="border" variant="success" />
      </div>,
    );
  }

  return shell(
    <div style={card}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-subtle)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
        }}>
          <Robot size={24} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0.9rem 0 0.3rem' }}>
          {t('oauthConsent.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
          {t('oauthConsent.subtitle', { client: info.clientName })}
        </p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 0.6rem' }}>
          {t('oauthConsent.permissionsLabel')}
        </p>
        {scopeList.map((scope) => {
          const meta = SCOPE_META[scope];
          return (
            <label
              key={scope}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 0.8rem',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                marginBottom: '0.5rem', cursor: 'pointer', background: 'var(--bg-base)',
              }}
            >
              <input type="checkbox" checked={approved.has(scope)} onChange={() => toggle(scope)} />
              <ShieldLock size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                {meta ? t(meta.key) : scope}
              </span>
            </label>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button style={{ ...secondaryBtn, flex: 1 }} onClick={handleDeny} disabled={submitting}>
          {t('oauthConsent.deny')}
        </button>
        <button style={{ ...primaryBtn, flex: 1, opacity: submitting ? 0.6 : 1 }} onClick={handleApprove} disabled={submitting}>
          {submitting ? <Spinner animation="border" size="sm" /> : t('oauthConsent.approve')}
        </button>
      </div>
    </div>,
  );
}

const primaryBtn = {
  padding: '0.6rem 0.9rem',
  backgroundColor: 'var(--accent)',
  color: 'var(--bg-base)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.88rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
};

const secondaryBtn = {
  padding: '0.6rem 0.9rem',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.88rem',
  fontWeight: 500,
  cursor: 'pointer',
};
