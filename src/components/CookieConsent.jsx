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
    gap: '1rem',
    padding: '0.9rem 0',
    borderBottom: '1px solid var(--border-subtle)',
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

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t('cookieConsent.title')}
      style={{
        position: 'fixed',
        left: '50%',
        bottom: isMobile ? '0.75rem' : '1.5rem',
        transform: `translateX(-50%) translateY(${mounted ? '0' : '24px'})`,
        opacity: mounted ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        zIndex: 1100,
        width: 'calc(100% - 2rem)',
        maxWidth: showPreferences ? '560px' : '460px',
        pointerEvents: 'auto',
      }}
    >
      <div className="glow-wrapper" style={{ borderRadius: '20px' }}>
        <div className="glass-panel" style={{
          borderRadius: '20px',
          padding: isMobile ? '1.25rem' : '1.6rem',
          maxHeight: '80dvh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-surface)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-subtle), var(--bg-hover))',
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
            }}>
              <ShieldLockFill size={18} />
            </div>
            <h3 style={{
              margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: isMobile ? '1.05rem' : '1.2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em',
            }}>
              {t('cookieConsent.title')}
            </h3>
          </div>

          <p style={{
            margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6,
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

          {/* Granular preferences */}
          {showPreferences && (
            <div style={{ marginBottom: '1.1rem' }}>
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
          )}

          {/* Actions */}
          {showPreferences ? (
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '0.6rem',
            }}>
              <button onClick={savePreferences} style={primaryBtn(isMobile)}>
                {t('cookieConsent.save')}
              </button>
              <button onClick={acceptAll} style={secondaryBtn(isMobile)}>
                {t('cookieConsent.acceptAll')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '0.6rem',
              }}>
                <button onClick={acceptAll} style={primaryBtn(isMobile)}>
                  {t('cookieConsent.acceptAll')}
                </button>
                <button onClick={rejectAll} style={secondaryBtn(isMobile)}>
                  {t('cookieConsent.rejectAll')}
                </button>
              </div>
              <button
                onClick={() => setShowPreferences(true)}
                style={{ ...ghostBtn(false), width: '100%', flex: 'none' }}
              >
                <GearFill size={14} />
                {t('cookieConsent.customize')}
              </button>
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
  minWidth: 0,
  flex: isMobile ? 'none' : 1,
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
