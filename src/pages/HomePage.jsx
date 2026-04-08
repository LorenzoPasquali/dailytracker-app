import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import KanbanFill from 'react-bootstrap-icons/dist/icons/kanban-fill';
import CalendarCheck from 'react-bootstrap-icons/dist/icons/calendar-check';
import ChatDotsFill from 'react-bootstrap-icons/dist/icons/chat-dots-fill';
import ArrowRight from 'react-bootstrap-icons/dist/icons/arrow-right';
import GraphUpArrow from 'react-bootstrap-icons/dist/icons/graph-up-arrow';
import FolderFill from 'react-bootstrap-icons/dist/icons/folder-fill';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import CheckCircleFill from 'react-bootstrap-icons/dist/icons/check-circle-fill';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../hooks/useMediaQuery';
import CssParticles from '../components/CssParticles';
import LanguageSelector from '../components/LanguageSelector';
import heroVideo from '../assets/dailytracker1.mp4';
import kanbanImg from '../assets/kanban.png';
import reportsImg from '../assets/reportsIA.png';

/* ── FAQ Accordion Item ─────────────────────────────── */
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid var(--border-subtle)',
      padding: '1.5rem 0',
      cursor: 'pointer'
    }} onClick={() => setIsOpen(!isOpen)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{
          margin: 0,
          color: 'var(--text-primary)',
          fontSize: '1.1rem',
          fontWeight: 600,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.3px'
        }}>
          {question}
        </h4>
        <div style={{
          transform: `rotate(${isOpen ? '180deg' : '0'})`,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          color: 'var(--accent)',
          flexShrink: 0
        }}>
          <ChevronDown size={20} />
        </div>
      </div>
      <div style={{
        maxHeight: isOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s',
        opacity: isOpen ? 1 : 0,
      }}>
        <p style={{ margin: 0, paddingTop: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {answer}
        </p>
      </div>
    </div>
  );
};

/* ── Step Card (How It Works) ────────────────────────── */
const StepCard = ({ number, icon, title, description }) => (
  <div style={{
    textAlign: 'center',
    padding: '2.5rem 2rem',
    borderRadius: '20px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-subtle)',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden'
  }} onMouseEnter={e => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.borderColor = 'var(--accent)';
  }} onMouseLeave={e => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.borderColor = 'var(--border-subtle)';
  }}>
    <div style={{
      position: 'absolute',
      top: '1rem',
      left: '1.25rem',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: 'var(--accent)',
      fontFamily: 'var(--font-display)',
      opacity: 0.5
    }}>
      0{number}
    </div>
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, var(--accent-subtle), var(--bg-hover))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.25rem',
      color: 'var(--accent)',
      border: '1px solid var(--accent-border)'
    }}>
      {icon}
    </div>
    <h3 style={{
      fontFamily: 'var(--font-display)',
      fontSize: '1.25rem',
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: '0.75rem',
      letterSpacing: '-0.3px'
    }}>
      {title}
    </h3>
    <p style={{
      color: 'var(--text-muted)',
      fontSize: '0.95rem',
      lineHeight: 1.6,
      margin: 0
    }}>
      {description}
    </p>
  </div>
);

/* ── Video Showcase (parallax reveal) ───────────────── */
const VideoShowcase = ({ src, label }) => {
  const sectionRef   = useRef(null);
  const videoRef     = useRef(null);
  const parallaxRef  = useRef(null);
  const rafRef       = useRef(null);
  const hasPlayed    = useRef(false);
  const [revealed, setRevealed] = useState(false);

  const applyVideoSettings = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 1;
    v.playbackRate = 1.3;
  };

  /* IntersectionObserver — trigger reveal + autoplay */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (!hasPlayed.current) {
            hasPlayed.current = true;
            applyVideoSettings();
            videoRef.current?.play().catch(() => {});
          }
        }
      },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  /* Scroll-driven parallax */
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!sectionRef.current || !parallaxRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const vh   = window.innerHeight;
        const progress = (vh - rect.top) / (vh + rect.height);
        const clamped  = Math.max(0, Math.min(1, progress));
        /* Move inner video from +36px to -36px as section scrolls through viewport */
        const y = 36 - clamped * 72;
        parallaxRef.current.style.transform = `translateY(${y}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isMobileVid = useMediaQuery('(max-width: 768px)');

  return (
    <section ref={sectionRef} style={{
      padding: isMobileVid ? '0 1rem 4rem' : '0 2rem 8rem',
      maxWidth: '1320px',
      margin: '0 auto',
    }}>
      {/* Eye-brow label */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span style={{
          display: 'inline-block',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          padding: '0.3rem 0.9rem',
          border: '1px solid var(--accent-border)',
          borderRadius: '100px',
          backgroundColor: 'var(--accent-subtle)',
        }}>
          {label}
        </span>
      </div>

      {/* Parallax outer — JS sets translateY directly, no CSS transition here */}
      <div ref={parallaxRef} style={{ willChange: 'transform' }}>
        {/* Reveal inner — CSS opacity + scale transition on scroll-into-view */}
        <div style={{
          opacity:    revealed ? 1    : 0,
          transform:  revealed ? 'scale(1) translateY(0)' : 'scale(0.91) translateY(32px)',
          transition: 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div className="glow-wrapper" style={{ borderRadius: '20px' }}>
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 40px 80px -16px rgba(0,0,0,0.65)',
              lineHeight: 0,
            }}>
              <video
                ref={videoRef}
                src={src}
                muted
                loop
                playsInline
                preload="metadata"
                onLoadedMetadata={applyVideoSettings}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  /* Clip baked-in letterbox bars (58px top, 80px bottom at 1920x1080)
                     Margins as % of width: top=58/1920, bottom=80/1920 */
                  marginTop: '-3.021%',
                  marginBottom: '-4.167%',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════ */
/* ══  HomePage                                       ══ */
/* ══════════════════════════════════════════════════════ */
export default function HomePage() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  /* Force dark theme on mount, restore on unmount */
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev);
      else document.documentElement.removeAttribute('data-theme');
    };
  }, []);

  const faqs = [
    { question: t('home.faq1Q'), answer: t('home.faq1A') },
    { question: t('home.faq2Q'), answer: t('home.faq2A') },
    { question: t('home.faq3Q'), answer: t('home.faq3A') },
    { question: t('home.faq4Q'), answer: t('home.faq4A') },
  ];

  return (
    <div className="bg-grid" style={{
      position: 'relative',
      width: '100%',
      minHeight: '100dvh',
      backgroundColor: 'var(--bg-base)',
      overflowX: 'hidden'
    }}>
      <CssParticles />

      {/* ── Atmospheric Orbs ─────────────────────────── */}
      <div style={{
        position: 'absolute', top: '-10%', left: '10%',
        width: '80vw', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 60%)',
        filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '-10%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0
      }} />

      {/* ── Sticky Glassmorphic Nav ──────────────────── */}
      <nav className="glass-panel animate-fade-in" style={{
        position: 'sticky', top: isMobile ? '0.75rem' : '1.5rem', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.5rem', maxWidth: '1300px',
        margin: isMobile ? '0.75rem auto 0' : '1.5rem auto 0', borderRadius: '100px',
        border: '1px solid var(--border-subtle)', width: 'calc(100% - 2rem)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-subtle)', flexShrink: 0
          }}>
            <CalendarCheck size={16} color="#fafafa" />
          </div>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: 800,
            color: 'var(--text-primary)', textDecoration: 'none', letterSpacing: '-0.5px'
          }}>
            DailyTracker
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isMobile && <LanguageSelector variant="navbar" />}
          {!isMobile && (
            <Link to="/login" style={{
              color: 'var(--text-secondary)', textDecoration: 'none',
              padding: '0.6rem 1.25rem', fontSize: '0.95rem', fontWeight: 500,
              borderRadius: '100px', transition: 'all 0.2s ease',
            }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
               onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              {t('nav.login')}
            </Link>
          )}
          <Link to="/register" style={{
            color: '#fafafa', backgroundColor: 'var(--accent)', textDecoration: 'none',
            padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.75rem',
            fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 600,
            borderRadius: '100px', boxShadow: '0 4px 14px 0 var(--accent-subtle)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
            whiteSpace: 'nowrap',
          }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.23)';
          }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px 0 var(--accent-subtle)';
          }} onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'}
             onMouseUp={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1)'}>
            {t('nav.register', 'Cadastrar')}
          </Link>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, width: '100%' }}>

        {/* ══════════════════════════════════════════════ */}
        {/* ══  1. HERO — Full-viewport centered text   ══ */}
        {/* ══════════════════════════════════════════════ */}
        <section className="animate-slide-up" style={{
          width: '100%',
          minHeight: isMobile ? '70dvh' : '82dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '4rem 1.25rem 3rem' : '5rem 2rem',
          textAlign: 'center',
          position: 'relative',
          boxSizing: 'border-box',
        }}>

          {/* Beta badge */}
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{
              display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)',
              padding: '0.35rem 1rem', border: '1px solid var(--accent-border)',
              borderRadius: '100px', backgroundColor: 'var(--accent-subtle)',
            }}>
              {t('home.betaBadge')}
            </span>
          </div>

          <h1 className="text-glow" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            maxWidth: '760px',
            width: '100%',
            margin: '0 auto 1.5rem',
          }}>
            {t('home.heroTitle', 'Mude a forma como')} <br />
            <span style={{
              background: 'linear-gradient(to right, var(--accent), #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}>
              {t('home.heroAccent', 'você produz.')}
            </span>
          </h1>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'var(--text-muted)',
            lineHeight: 1.65,
            maxWidth: '580px',
            width: '100%',
            margin: '0 auto 2.5rem',
          }}>
            {t('home.heroParagraph')}
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              color: '#fafafa', backgroundColor: 'var(--accent)', textDecoration: 'none',
              padding: '1rem 2.25rem', fontSize: '1.05rem', fontWeight: 600,
              borderRadius: '12px', boxShadow: '0 8px 28px -6px rgba(16,185,129,0.4)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
            }} onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px -6px rgba(16,185,129,0.5)';
            }} onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 28px -6px rgba(16,185,129,0.4)';
            }} onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'}>
              {t('home.ctaStart', 'Começar a usar')}
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" style={{
              display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)',
              textDecoration: 'none', padding: '1rem 2.25rem', fontSize: '1.05rem', fontWeight: 500,
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
              {t('home.howItWorksLink')}
            </a>
          </div>

          {/* Scroll indicator */}
          <div style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'var(--text-muted)',
          }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>scroll</span>
            <ChevronDown size={16} className="scroll-indicator-bounce" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════ */}
        {/* ══  1b. VIDEO SHOWCASE — parallax reveal    ══ */}
        {/* ══════════════════════════════════════════════ */}
        <VideoShowcase src={heroVideo} label={t('home.videoLabel')} />

        {/* ══════════════════════════════════════════════ */}
        {/* ══  2. FEATURE HIGHLIGHTS                   ══ */}
        {/* ══════════════════════════════════════════════ */}
        <section style={{
          borderTop: '2px solid var(--border-subtle)',
          borderBottom: '2px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div style={{
            maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '2rem 1.25rem' : '3rem 2rem',
            display: 'flex', justifyContent: 'center', gap: isMobile ? '0.6rem 1.5rem' : '0.75rem 2.5rem',
            alignItems: 'center', flexWrap: 'wrap'
          }}>
            {[
              { icon: <KanbanFill size={16} />, label: t('home.featKanban') },
              { icon: <ChatDotsFill size={16} />, label: t('home.featAI') },
              { icon: <FolderFill size={16} />, label: t('home.featWorkspace') },
              { icon: <CheckCircleFill size={16} />, label: t('home.featSummary') },
              { icon: <CalendarCheck size={16} />, label: t('home.featNotifications') },
              { icon: <GraphUpArrow size={16} />, label: t('home.featReports') },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                color: 'var(--text-secondary)', fontSize: isMobile ? '0.8rem' : '0.9rem', fontWeight: 500,
              }}>
                <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════ */}
        {/* ══  3. HOW IT WORKS — 3 Steps               ══ */}
        {/* ══════════════════════════════════════════════ */}
        <section id="how-it-works" style={{
          maxWidth: '1300px', margin: '0 auto', padding: isMobile ? '4rem 1.25rem' : '8rem 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '-0.5px'
            }}>
              {t('home.howItWorksTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              {t('home.howItWorksSubtitle')}
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem'
          }}>
            <StepCard number={1} icon={<FolderFill size={24} />} title={t('home.step1Title')} description={t('home.step1Desc')} />
            <StepCard number={2} icon={<KanbanFill size={24} />} title={t('home.step2Title')} description={t('home.step2Desc')} />
            <StepCard number={3} icon={<ChatDotsFill size={24} />} title={t('home.step3Title')} description={t('home.step3Desc')} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════ */}
        {/* ══  4. DEEP DIVE — Kanban                   ══ */}
        {/* ══════════════════════════════════════════════ */}
        <section id="tutorial" style={{
          maxWidth: '1600px', margin: '0 auto', padding: isMobile ? '3.5rem 1.25rem' : '6rem 2rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
            gap: isMobile ? '2rem' : '4rem',
            alignItems: 'center'
          }}>
            <div className="glow-wrapper" style={{ borderRadius: '20px', alignSelf: 'start', order: isMobile ? 1 : 0 }}>
              <div style={{
                borderRadius: '20px', overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                lineHeight: 0,
              }}>
                <img
                  src={kanbanImg}
                  alt="Interface Kanban do DailyTracker"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            </div>
            <div style={{ order: isMobile ? 2 : 0 }}>
              <div style={{
                display: 'inline-flex', width: '48px', height: '48px', borderRadius: '12px',
                backgroundColor: 'var(--bg-hover)', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem', border: '1px solid var(--border-subtle)'
              }}>
                <KanbanFill size={20} color="var(--accent)" />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.6rem' : '2.5rem', fontWeight: 700,
                color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem'
              }}>
                {t('home.kanbanTitle')}
              </h2>
              <p style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
                {t('home.kanbanParagraph')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  <div style={{ color: 'var(--accent)', flexShrink: 0 }}><CalendarCheck size={18} /></div> {t('home.kanbanBullet1')}
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  <div style={{ color: 'var(--accent)', flexShrink: 0 }}><FolderFill size={18} /></div> {t('home.kanbanBullet2')}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════ */}
        {/* ══  5. DEEP DIVE — AI (Inverted)            ══ */}
        {/* ══════════════════════════════════════════════ */}
        <section style={{
          backgroundColor: 'var(--bg-elevated)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            maxWidth: '1600px', margin: '0 auto',
            padding: isMobile ? '3.5rem 1.25rem' : '8rem 2rem',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr',
            gap: isMobile ? '2rem' : '4rem',
            alignItems: 'center'
          }}>
            <div style={{ order: isMobile ? 2 : 2 }}>
              <div style={{
                display: 'inline-flex', width: '48px', height: '48px', borderRadius: '12px',
                backgroundColor: 'var(--accent-subtle)', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.5rem', border: '1px solid var(--accent-border)'
              }}>
                <ChatDotsFill size={20} color="var(--accent)" />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.6rem' : '2.5rem', fontWeight: 700,
                color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.25rem'
              }}>
                {t('home.aiTitle')}
              </h2>
              <p style={{ fontSize: isMobile ? '0.95rem' : '1.15rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
                {t('home.aiParagraph')}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  <div style={{ color: 'var(--accent)', flexShrink: 0 }}><GraphUpArrow size={18} /></div> {t('home.aiBullet1')}
                </li>
              </ul>
            </div>
            <div className="glow-wrapper" style={{ order: isMobile ? 1 : 1, borderRadius: '20px', alignSelf: 'start' }}>
              <div style={{
                borderRadius: '20px', overflow: 'hidden',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
                lineHeight: 0,
              }}>
                <img
                  src={reportsImg}
                  alt="IA e Relatórios do DailyTracker"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════ */}
        {/* ══  6. FAQ Section                          ══ */}
        {/* ══════════════════════════════════════════════ */}
        <section style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '4rem 1.25rem 2.5rem' : '8rem 2rem 4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '2.5rem' : '4rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 700,
              color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: '-0.5px'
            }}>
              {t('home.faqTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
              {t('home.faqSubtitle')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════ */}
        {/* ══  7. FINAL CTA                            ══ */}
        {/* ══════════════════════════════════════════════ */}
        <section style={{
          position: 'relative',
          maxWidth: '1300px', margin: '0 auto', padding: isMobile ? '3rem 1.25rem 4rem' : '6rem 2rem 8rem',
        }}>
          <div className="glow-wrapper" style={{ borderRadius: isMobile ? '16px' : '24px' }}>
            <div style={{
              borderRadius: isMobile ? '16px' : '24px',
              backgroundColor: 'var(--bg-surface)',
              padding: isMobile ? '2.5rem 1.5rem' : '5rem 3rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background accent */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at 50% 0%, var(--accent-subtle) 0%, transparent 50%)',
                pointerEvents: 'none'
              }} />

              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800, color: 'var(--text-primary)',
                marginBottom: '1.5rem', letterSpacing: '-0.03em', position: 'relative'
              }}>
                {t('home.ctaTitle')} <br/>
                <span style={{
                  background: 'linear-gradient(to right, var(--accent), #34d399)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent'
                }}>
                  {t('home.ctaAccent')}
                </span>
              </h2>
              <p style={{
                color: 'var(--text-muted)', fontSize: isMobile ? '1rem' : '1.15rem',
                maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: 1.6, position: 'relative'
              }}>
                {t('home.ctaParagraph')}
              </p>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                color: '#fafafa', backgroundColor: 'var(--accent)', textDecoration: 'none',
                padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 600,
                borderRadius: '12px', boxShadow: '0 8px 24px -6px var(--accent-subtle)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
              }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                 onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'}>
                {t('home.ctaButton')}
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        padding: isMobile ? '2rem 1.25rem' : '3rem 2rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-hover)'
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck size={20} color="var(--text-secondary)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-secondary)' }}>DailyTracker</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
            {t('home.footer', 'Todos os direitos reservados.')}
          </p>
        </div>
      </footer>
    </div>
  );
}
