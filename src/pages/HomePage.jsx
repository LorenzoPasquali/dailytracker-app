import React from 'react';
import { Link } from 'react-router-dom';
import KanbanFill from 'react-bootstrap-icons/dist/icons/kanban-fill';
import CalendarCheck from 'react-bootstrap-icons/dist/icons/calendar-check';
import ChatDotsFill from 'react-bootstrap-icons/dist/icons/chat-dots-fill';
import ArrowRight from 'react-bootstrap-icons/dist/icons/arrow-right';
import { useTranslation } from 'react-i18next';
import CssParticles from '../components/CssParticles';
import LanguageSelector from '../components/LanguageSelector';

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    { icon: KanbanFill, title: t('home.features.kanban.title'), description: t('home.features.kanban.description') },
    { icon: CalendarCheck, title: t('home.features.filters.title'), description: t('home.features.filters.description') },
    { icon: ChatDotsFill, title: t('home.features.ai.title'), description: t('home.features.ai.description') },
  ];
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-base)',
      overflow: 'auto'
    }}>
      <CssParticles />

      {/* Subtle gradient orb */}
      <div style={{
        position: 'fixed',
        top: '-20%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-30%',
        left: '-10%',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Nav */}
      <nav className="animate-fade-in" style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <Link to="/" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.5px'
        }}>
          DailyTracker
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <LanguageSelector variant="navbar" />
          <Link to="/login" style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)',
            transition: 'color var(--transition)'
          }}>
            {t('nav.login')}
          </Link>
          <Link to="/register" style={{
            color: 'var(--bg-base)',
            backgroundColor: 'var(--accent)',
            textDecoration: 'none',
            padding: '0.5rem 1.25rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            transition: 'background-color var(--transition)'
          }}>
            {t('nav.register')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ position: 'relative', zIndex: 1 }}>
        <section style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '6rem 2rem 4rem',
          textAlign: 'center'
        }}>
          <div className="animate-fade-in-up delay-1" style={{
            display: 'inline-block',
            padding: '0.35rem 1rem',
            borderRadius: '100px',
            border: '1px solid var(--accent-border)',
            backgroundColor: 'var(--accent-subtle)',
            color: 'var(--accent)',
            fontSize: '0.8rem',
            fontWeight: 500,
            marginBottom: '1.5rem',
            letterSpacing: '0.02em'
          }}>
            {t('home.tagline')}
          </div>

          <h1 className="animate-fade-in-up delay-2" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            marginBottom: '1.5rem'
          }}>
            {t('home.heroTitle')}{' '}
            <span style={{ color: 'var(--accent)' }}>
              {t('home.heroAccent')}
            </span>
          </h1>

          <p className="animate-fade-in-up delay-3" style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            maxWidth: '560px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7
          }}>
            {t('home.heroBody')}
          </p>

          <div className="animate-fade-in-up delay-4" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--bg-base)',
              backgroundColor: 'var(--accent)',
              textDecoration: 'none',
              padding: '0.75rem 1.75rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              transition: 'background-color var(--transition)'
            }}>
              {t('home.ctaStart')}
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '0.75rem 1.75rem',
              fontSize: '0.95rem',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              transition: 'border-color var(--transition)'
            }}>
              {t('home.ctaLogin')}
            </Link>
          </div>
        </section>

        {/* Features */}
        <section style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '2rem 2rem 6rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1px',
            backgroundColor: 'var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)'
          }}>
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className={`animate-fade-in-up delay-${i + 4}`} style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '2.5rem 2rem',
                  transition: 'background-color var(--transition)'
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem'
                  }}>
                    <Icon size={18} color="var(--accent)" />
                  </div>
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem',
                    letterSpacing: '-0.3px'
                  }}>
                    {feature.title}
                  </h2>
                  <p style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="animate-fade-in delay-6" style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        {t('home.footer')}
      </footer>
    </div>
  );
}
