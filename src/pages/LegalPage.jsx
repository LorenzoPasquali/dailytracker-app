import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CalendarCheck from 'react-bootstrap-icons/dist/icons/calendar-check';
import ArrowLeft from 'react-bootstrap-icons/dist/icons/arrow-left';
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill';
import { useMediaQuery } from '../hooks/useMediaQuery';
import LanguageSelector from '../components/LanguageSelector';
import CookieConsent, { OPEN_PREFERENCES_EVENT } from '../components/CookieConsent';

export default function LegalPage({ docKey }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  /* Force dark theme on mount, restore on unmount (mirrors HomePage) */
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
    window.scrollTo(0, 0);
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  const sections = t(`legal.${docKey}.sections`, { returnObjects: true });
  const sectionList = Array.isArray(sections) ? sections : [];

  return (
    <div className="bg-grid" style={{
      position: 'relative',
      width: '100%',
      minHeight: '100dvh',
      backgroundColor: 'var(--bg-base)',
      overflowX: 'hidden',
    }}>
      {/* Atmospheric orb */}
      <div style={{
        position: 'absolute', top: '-10%', left: '20%',
        width: '70vw', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 60%)',
        filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Sticky glass nav */}
      <nav className="glass-panel" style={{
        position: 'sticky', top: isMobile ? '0.75rem' : '1.5rem', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem', maxWidth: '1100px',
        margin: isMobile ? '0.75rem auto 0' : '1.5rem auto 0', borderRadius: '100px',
        border: '1px solid var(--border-subtle)', width: 'calc(100% - 2rem)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-subtle)', flexShrink: 0,
          }}>
            <CalendarCheck size={16} color="#fafafa" />
          </div>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: 800,
            color: 'var(--text-primary)', textDecoration: 'none', letterSpacing: '-0.5px',
          }}>
            DailyTracker
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!isMobile && <LanguageSelector variant="navbar" />}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--text-secondary)', textDecoration: 'none',
            padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 500,
            borderRadius: '100px', border: '1px solid var(--border-subtle)',
            transition: 'color 0.2s ease, border-color 0.2s ease',
          }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
             onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
            <ArrowLeft size={15} />
            {!isMobile && t('legal.backHome')}
          </Link>
        </div>
      </nav>

      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: '820px', margin: '0 auto',
        padding: isMobile ? '2.5rem 1.25rem 4rem' : '4.5rem 2rem 6rem',
      }}>
        {/* Eyebrow */}
        <span style={{
          display: 'inline-block', fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)',
          padding: '0.3rem 0.9rem', border: '1px solid var(--accent-border)',
          borderRadius: '100px', backgroundColor: 'var(--accent-subtle)', marginBottom: '1.25rem',
        }}>
          {t('legal.eyebrow')}
        </span>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: 800,
          color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 0.75rem',
        }}>
          {t(`legal.${docKey}.title`)}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 2rem' }}>
          {t('legal.lastUpdated')}: {t(`legal.${docKey}.updatedDate`)}
        </p>

        <p style={{
          color: 'var(--text-secondary)', fontSize: isMobile ? '1rem' : '1.1rem',
          lineHeight: 1.75, margin: '0 0 2.5rem',
        }}>
          {t(`legal.${docKey}.intro`)}
        </p>

        {/* Sections */}
        {sectionList.map((section, i) => (
          <section key={i} style={{ marginBottom: '2.25rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.25rem' : '1.45rem', fontWeight: 700,
              color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 0.9rem',
            }}>
              {section.heading}
            </h2>
            {(section.body || []).map((para, j) => (
              <p key={j} style={{
                color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1rem',
                lineHeight: 1.75, margin: '0 0 0.9rem',
              }}>
                {para}
              </p>
            ))}
            {Array.isArray(section.bullets) && section.bullets.length > 0 && (
              <ul style={{ margin: '0.25rem 0 0', paddingLeft: 0, listStyle: 'none' }}>
                {section.bullets.map((item, k) => (
                  <li key={k} style={{
                    position: 'relative', paddingLeft: '1.4rem', marginBottom: '0.6rem',
                    color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1rem', lineHeight: 1.65,
                  }}>
                    <span style={{
                      position: 'absolute', left: 0, top: '0.55em', width: '6px', height: '6px',
                      borderRadius: '50%', backgroundColor: 'var(--accent)',
                    }} />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {/* Manage cookie preferences (cookie policy only) */}
        {docKey === 'cookies' && (
          <button
            onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '0.5rem', padding: '0.8rem 1.5rem',
              color: '#fafafa', backgroundColor: 'var(--accent)', border: '1px solid var(--accent)',
              borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 14px -2px var(--accent-subtle)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <GearFill size={16} />
            {t('legal.managePreferences')}
          </button>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        padding: isMobile ? '2rem 1.25rem' : '3rem 2rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-hover)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
            <Link to="/politica-de-privacidade" style={footerLink}>{t('legal.privacy.title')}</Link>
            <Link to="/politica-de-cookies" style={footerLink}>{t('legal.cookies.title')}</Link>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
            {t('home.footer', 'Todos os direitos reservados.')}
          </p>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}

const footerLink = {
  color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500,
};
