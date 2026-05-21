import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShieldLockFill from 'react-bootstrap-icons/dist/icons/shield-lock-fill';
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill';
import { useMediaQuery } from '../hooks/useMediaQuery';

export const CONSENT_KEY = 'cookieConsent';
export const CONSENT_VERSION = 1;
export const OPEN_PREFERENCES_EVENT = 'open-cookie-preferences';

export function getStoredConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/* Toggle switch styled with project accent */
const Toggle = ({ checked, disabled, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    style={{
      flexShrink: 0,
      width: '42px',
      height: '24px',
      borderRadius: '100px',
      border: '1px solid var(--border-default)',
      background: checked ? 'var(--accent)' : 'var(--bg-active)',
      position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1,
      transition: 'background-color var(--transition), border-color var(--transition)',
      padding: 0,
    }}
  >
    <span style={{
      position: 'absolute',
      top: '2px',
      left: checked ? '20px' : '2px',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: '#fafafa',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      transition: 'left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
    }} />
  </button>
);

const CategoryRow = ({ title, description, checked, disabled, badge, onChange }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '0.8rem 0.9rem',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-elevated)',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem' }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--accent)', backgroundColor: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)', borderRadius: '100px', padding: '0.1rem 0.5rem',
          }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
    <Toggle checked={checked} disabled={disabled} onChange={onChange} />
  </div>
);

export default function CookieConsent() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  /* Show banner on first visit (no valid stored consent) */
  useEffect(() => {
    if (!getStoredConsent()) {
      setVisible(true);
      requestAnimationFrame(() => setMounted(true));
    }
  }, []);

  /* Allow re-opening preferences from anywhere (e.g. cookie policy page) */
  useEffect(() => {
    const open = () => {
      const stored = getStoredConsent();
      setAnalytics(!!stored?.analytics);
      setMarketing(!!stored?.marketing);
      setShowPreferences(true);
      setVisible(true);
      requestAnimationFrame(() => setMounted(true));
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  const persist = useCallback((consent) => {
    const payload = {
      ...consent,
      necessary: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: payload }));
    setMounted(false);
    setTimeout(() => {
      setVisible(false);
      setShowPreferences(false);
    }, 320);
  }, []);

  const acceptAll = () => persist({ analytics: true, marketing: true });
  const rejectAll = () => persist({ analytics: false, marketing: false });
  const savePreferences = () => persist({ analytics, marketing });

  if (!visible) return null;

  const iconBox = (
    <div style={{
      width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--accent-subtle), var(--bg-hover))',
      border: '1px solid var(--accent-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
    }}>
      <ShieldLockFill size={17} />
    </div>
  );

  const description = (
    <p style={{
      margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.55,
    }}>
      {t('cookieConsent.description')}{' '}
      <Link to="/politica-de-privacidade" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
        {t('cookieConsent.privacyLink')}
      </Link>
      {' · '}
      <Link to="/politica-de-cookies" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
        {t('cookieConsent.cookieLink')}
      </Link>
    </p>
  );

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t('cookieConsent.title')}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        transform: `translateY(${mounted ? '0' : '110%'})`,
        transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto',
      }}
    >
      <div className="glass-panel" style={{
        border: '1px solid transparent',
        borderTop: '1px solid var(--border-default)',
        borderRadius: 0,
        backgroundColor: 'var(--bg-surface)',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
      }}>
        <div style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: isMobile ? '0.9rem 1.25rem' : '1rem 2rem',
          maxHeight: '85dvh',
          overflowY: 'auto',
        }}>
          {showPreferences ? (
            /* ── Preferences (full-width bar, expands upward) ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {iconBox}
                <h3 style={{
                  margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: isMobile ? '1.05rem' : '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.02em',
                }}>
                  {t('cookieConsent.title')}
                </h3>
              </div>
              {description}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: isMobile ? '0.6rem' : '0.85rem 1.25rem',
              }}>
                <CategoryRow
                  title={t('cookieConsent.necessaryTitle')}
                  description={t('cookieConsent.necessaryDesc')}
                  badge={t('cookieConsent.alwaysActive')}
                  checked
                  disabled
                  onChange={() => {}}
                />
                <CategoryRow
                  title={t('cookieConsent.analyticsTitle')}
                  description={t('cookieConsent.analyticsDesc')}
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <CategoryRow
                  title={t('cookieConsent.marketingTitle')}
                  description={t('cookieConsent.marketingDesc')}
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'flex-end',
                gap: '0.6rem',
              }}>
                <button onClick={acceptAll} style={secondaryBtn(isMobile)}>
                  {t('cookieConsent.acceptAll')}
                </button>
                <button onClick={savePreferences} style={primaryBtn(isMobile)}>
                  {t('cookieConsent.save')}
                </button>
              </div>
            </div>
          ) : (
            /* ── Compact bar (single bottom edge row) ── */
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? '0.85rem' : '1.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                {iconBox}
                {description}
              </div>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '0.6rem',
                flexShrink: 0,
              }}>
                <button onClick={acceptAll} style={primaryBtn(isMobile)}>
                  {t('cookieConsent.acceptAll')}
                </button>
                <button onClick={rejectAll} style={secondaryBtn(isMobile)}>
                  {t('cookieConsent.rejectAll')}
                </button>
                <button onClick={() => setShowPreferences(true)} style={ghostBtn(isMobile)}>
                  <GearFill size={14} />
                  {t('cookieConsent.customize')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared button styles ───────────────────────────── */
const baseBtn = (isMobile) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  padding: '0.7rem 1.1rem',
  fontSize: '0.88rem',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, background-color var(--transition), border-color var(--transition), color var(--transition)',
  whiteSpace: 'nowrap',
  flex: 'none',
  width: isMobile ? '100%' : 'auto',
});

const primaryBtn = (isMobile) => ({
  ...baseBtn(isMobile),
  color: '#fafafa',
  backgroundColor: 'var(--accent)',
  border: '1px solid var(--accent)',
  boxShadow: '0 4px 14px -2px var(--accent-subtle)',
});

const secondaryBtn = (isMobile) => ({
  ...baseBtn(isMobile),
  color: 'var(--text-secondary)',
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
});

const ghostBtn = (isMobile) => ({
  ...baseBtn(isMobile),
  color: 'var(--text-muted)',
  backgroundColor: 'transparent',
  border: '1px solid var(--border-subtle)',
});
