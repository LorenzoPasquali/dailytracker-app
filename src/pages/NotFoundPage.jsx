import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CalendarCheck from 'react-bootstrap-icons/dist/icons/calendar-check';
import HouseDoor from 'react-bootstrap-icons/dist/icons/house-door';
import Kanban from 'react-bootstrap-icons/dist/icons/kanban';
import BoxArrowInRight from 'react-bootstrap-icons/dist/icons/box-arrow-in-right';
import { useMediaQuery } from '../hooks/useMediaQuery';
import CssParticles from '../components/CssParticles';
import LanguageSelector from '../components/LanguageSelector';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isAuthenticated = !!localStorage.getItem('authToken');

  /* Force dark theme on mount, restore on unmount (mirrors HomePage) */
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  /* The server answers unknown routes with index.html, so tell crawlers this is a 404 */
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  const documentTitle = t('notFound.documentTitle');
  useEffect(() => {
    const prev = document.title;
    document.title = documentTitle;
    return () => { document.title = prev; };
  }, [documentTitle]);

  const primary = isAuthenticated
    ? { to: '/dashboard', label: t('notFound.goApp'), Icon: Kanban }
    : { to: '/', label: t('notFound.goHome'), Icon: HouseDoor };
  const secondary = isAuthenticated
    ? { to: '/', label: t('notFound.goHome'), Icon: HouseDoor }
    : { to: '/login', label: t('notFound.signIn'), Icon: BoxArrowInRight };

  return (
    <div className="bg-grid" style={{
      position: 'relative',
      width: '100%',
      minHeight: '100dvh',
      backgroundColor: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <CssParticles />

      {/* Atmospheric orb */}
      <div style={{
        position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '70vw', maxWidth: '900px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 60%)',
        filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <header style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', maxWidth: '1100px', margin: '0 auto',
        padding: isMobile ? '1rem 1.25rem' : '1.5rem 2rem',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-subtle)', flexShrink: 0,
          }}>
            <CalendarCheck size={16} color="#fafafa" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.5px',
          }}>
            DailyTracker
          </span>
        </Link>
        <LanguageSelector variant="navbar" />
      </header>

      <main style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        width: '100%', maxWidth: '640px', margin: '0 auto',
        padding: isMobile ? '2rem 1.25rem 4rem' : '3rem 2rem 6rem',
        boxSizing: 'border-box',
      }}>
        <div aria-hidden="true" className="animate-fade-in-up" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(6rem, 22vw, 10rem)',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.06em',
          marginBottom: '1.25rem',
          background: 'linear-gradient(to right, var(--accent), #34d399)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          filter: 'drop-shadow(0 0 40px var(--accent-subtle))',
        }}>
          404
        </div>

        <h1 className="text-glow animate-fade-in-up delay-1" style={{
          fontFamily: 'var(--font-display)',
          fontSize: isMobile ? '1.75rem' : '2.4rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          margin: '0 0 1rem',
        }}>
          {t('notFound.title')}
        </h1>

        <p className="animate-fade-in-up delay-2" style={{
          color: 'var(--text-muted)',
          fontSize: isMobile ? '1rem' : '1.1rem',
          lineHeight: 1.65,
          margin: '0 0 1.75rem',
        }}>
          {t('notFound.description')}
        </p>

        {/* Requested path */}
        <div className="animate-fade-in-up delay-2" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
          maxWidth: '100%', boxSizing: 'border-box',
          padding: '0.45rem 0.9rem', marginBottom: '2.25rem',
          border: '1px solid var(--border-default)', borderRadius: '100px',
          backgroundColor: 'var(--bg-elevated)',
          fontSize: '0.8rem',
        }}>
          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('notFound.pathLabel')}</span>
          <code title={pathname} style={{
            color: 'var(--accent)', fontSize: '0.85rem',
            minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {pathname}
          </code>
        </div>

        <div className="animate-fade-in-up delay-3" style={{
          display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
          width: isMobile ? '100%' : 'auto',
        }}>
          <Link to={primary.to} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            flex: isMobile ? '1 1 100%' : '0 0 auto',
            color: '#fafafa', backgroundColor: 'var(--accent)', textDecoration: 'none',
            padding: '0.9rem 1.9rem', fontSize: '1rem', fontWeight: 600,
            borderRadius: '12px', boxShadow: '0 8px 28px -6px rgba(16,185,129,0.4)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
          }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px -6px rgba(16,185,129,0.5)';
          }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 28px -6px rgba(16,185,129,0.4)';
          }}>
            <primary.Icon size={17} />
            {primary.label}
          </Link>
          <Link to={secondary.to} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            flex: isMobile ? '1 1 100%' : '0 0 auto',
            color: 'var(--text-secondary)', textDecoration: 'none',
            padding: '0.9rem 1.9rem', fontSize: '1rem', fontWeight: 500,
            backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', transition: 'background-color 0.2s, color 0.2s, transform 0.2s',
          }} onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }} onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <secondary.Icon size={17} />
            {secondary.label}
          </Link>
        </div>
      </main>
    </div>
  );
}
