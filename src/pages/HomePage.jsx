import React from 'react';
import { Link } from 'react-router-dom';
import { KanbanFill, CalendarCheck, ChatDotsFill, ArrowRight } from 'react-bootstrap-icons';
import CssParticles from '../components/CssParticles';

const features = [
  {
    icon: KanbanFill,
    title: 'Kanban Visual',
    description: 'Organize tarefas em colunas Planejado, Em Progresso e Feito com drag & drop intuitivo.'
  },
  {
    icon: CalendarCheck,
    title: 'Filtros Inteligentes',
    description: 'Filtre por projeto, tipo de tarefa e intervalo de datas para encontrar exatamente o que precisa.'
  },
  {
    icon: ChatDotsFill,
    title: 'Assistente IA',
    description: 'Analise sua produtividade, gere resumos de daily e identifique gargalos com IA integrada.'
  }
];

export default function HomePage() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/login" style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)',
            transition: 'color var(--transition)'
          }}>
            Entrar
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
            Cadastrar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative',
        zIndex: 1,
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
          Organize suas dailies com simplicidade
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
          Simplifique seu dia.{' '}
          <span style={{ color: 'var(--accent)' }}>
            Domine suas tarefas.
          </span>
        </h1>

        <p className="animate-fade-in-up delay-3" style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          maxWidth: '560px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.7
        }}>
          Registre tarefas de forma rapida e objetiva, gerencie projetos com Kanban
          e esteja sempre preparado para a proxima reuniao.
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
            Comecar agora
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
            Ja tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{
        position: 'relative',
        zIndex: 1,
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
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  letterSpacing: '-0.3px'
                }}>
                  {feature.title}
                </h3>
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
        DailyTracker — Feito para simplificar seu fluxo de trabalho.
      </footer>
    </div>
  );
}
