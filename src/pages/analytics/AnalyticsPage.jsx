import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { ADMIN_TOKEN_KEY } from '../../services/adminApi';
import { useTheme } from '../../hooks/useTheme';
import AdminLogin from './AdminLogin';
import RangeBar from './RangeBar';
import { rangeFor } from './rangeUtils';

const OverviewSection = lazy(() => import('./sections/OverviewSection'));
const EngagementSection = lazy(() => import('./sections/EngagementSection'));
const UsersSection = lazy(() => import('./sections/UsersSection'));
const GeoSection = lazy(() => import('./sections/GeoSection'));
const HealthSection = lazy(() => import('./sections/HealthSection'));

const TABS = [
  { key: 'overview', label: 'Visão geral', Component: OverviewSection, ranged: true },
  { key: 'engagement', label: 'Engajamento', Component: EngagementSection, ranged: true },
  { key: 'users', label: 'Usuários', Component: UsersSection, ranged: false },
  { key: 'geo', label: 'Mundo', Component: GeoSection, ranged: true },
  { key: 'health', label: 'Saúde', Component: HealthSection, ranged: false },
];

/** Hidden admin dashboard at /analytics. Not linked from anywhere; password from the backend .env. */
export default function AnalyticsPage() {
  useTheme();
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ADMIN_TOKEN_KEY));
  const [tab, setTab] = useState('overview');
  const [preset, setPreset] = useState('30d');
  const [custom, setCustom] = useState([null, null]);
  const range = useMemo(() => rangeFor(preset, custom), [preset, custom]);

  useEffect(() => {
    document.title = 'Painel';
    const onLogout = () => setAuthed(false);
    window.addEventListener('admin-logout', onLogout);
    return () => window.removeEventListener('admin-logout', onLogout);
  }, []);

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  const active = TABS.find((t) => t.key === tab);
  const { Component } = active;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Daily Tracker · painel interno
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Dias contados no fuso de Brasília. Visitantes são anônimos.
            </div>
          </div>
          <button type="button" onClick={() => { sessionStorage.removeItem(ADMIN_TOKEN_KEY); setAuthed(false); }}
            style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sair
          </button>
        </header>

        <nav style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem', overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{
              background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)', padding: '0.6rem 0.85rem',
              fontSize: '0.88rem', fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              {t.label}
            </button>
          ))}
        </nav>

        {active.ranged && (
          <div style={{ marginBottom: '1.25rem' }}>
            <RangeBar preset={preset} custom={custom} onChange={({ preset: p, custom: c }) => { setPreset(p); setCustom(c); }} />
          </div>
        )}

        <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}><Spinner animation="border" variant="success" /></div>}>
          <Component range={range} />
        </Suspense>
      </div>
    </div>
  );
}
