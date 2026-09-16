import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import KpiCard from '../../../components/charts/KpiCard';
import DarkTooltip from '../../../components/charts/DarkTooltip';
import EmptyState from '../../../components/charts/EmptyState';
import { TICK_STYLE, GRID_COLOR } from '../../../components/charts/chartTheme';
import { useAdminQuery, fmt } from '../useAdminQuery';
import { Card, Loading, ErrorBox, RankList } from '../Shared';

const FUNNEL_STEPS = [
  { key: 'visitors', label: 'Visitantes únicos' },
  { key: 'authPage', label: 'Chegaram em login/cadastro' },
  { key: 'accounts', label: 'Contas criadas' },
  { key: 'onboarded', label: 'Onboarding concluído' },
  { key: 'firstTask', label: 'Criaram a primeira task' },
  { key: 'retainedWeek1', label: 'Voltaram após 7 dias' },
];

function Funnel({ data }) {
  const first = data.visitors || 0;
  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      {FUNNEL_STEPS.map((s, i) => {
        const v = data[s.key] || 0;
        const prev = i === 0 ? v : data[FUNNEL_STEPS[i - 1].key] || 0;
        const width = first ? Math.min(100, Math.max((v / first) * 100, v ? 2 : 0)) : (v ? 100 : 0);
        const stepRate = i === 0 ? null : prev ? (v / prev) * 100 : 0;
        return (
          <div key={s.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 220px) 1fr auto', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
            <div style={{ height: 22, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${width}%`, height: '100%', background: 'var(--accent)', opacity: 1 - i * 0.12, transition: 'width 300ms ease' }} />
            </div>
            <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              <strong>{fmt.int(v)}</strong>
              {stepRate != null && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{stepRate.toFixed(0)}%</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OverviewSection({ range }) {
  const { data, loading, error } = useAdminQuery('/admin/analytics/overview', range);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const k = data.kpis;
  const p = data.previousKpis;
  const series = data.series.map((d) => ({ ...d, label: fmt.day(d.day) }));
  const hasPv = series.some((d) => d.pageviews > 0);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <KpiCard label="Visualizações" value={fmt.int(k.pageviews)} color="var(--text-primary)" hint={fmt.delta(k.pageviews, p.pageviews)} />
        <KpiCard label="Visitantes únicos" value={fmt.int(k.uniqueVisitors)} color="var(--text-primary)" hint={fmt.delta(k.uniqueVisitors, p.uniqueVisitors)} />
        <KpiCard label="Contas criadas" value={fmt.int(k.signups)} color="#f59e0b" hint={fmt.delta(k.signups, p.signups)} />
        <KpiCard label="Conversão visita → conta" value={fmt.pct(k.visitorToSignupRate)} color="var(--accent)" hint={fmt.delta(k.visitorToSignupRate, p.visitorToSignupRate)} />
        <KpiCard label="Usuários ativos" value={fmt.int(k.activeUsers)} color="#3b82f6" hint={fmt.delta(k.activeUsers, p.activeUsers)} />
        <KpiCard label="Total de contas" value={fmt.int(k.totalUsers)} color="var(--text-secondary)" />
      </div>

      <Card title="Visitantes, contas e usuários ativos por dia">
        {!hasPv && !series.some((d) => d.signups || d.activeUsers) ? <EmptyState label="Sem dados no período" /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="visitors" name="Visitantes" stroke="#10b981" fill="url(#gVisitors)" strokeWidth={2} />
              <Area type="monotone" dataKey="pageviews" name="Visualizações" stroke="#6b7280" fill="none" strokeWidth={1} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="signups" name="Contas criadas" stroke="#f59e0b" fill="none" strokeWidth={2} />
              <Area type="monotone" dataKey="activeUsers" name="Usuários ativos" stroke="#3b82f6" fill="none" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Funil do período">
        <Funnel data={data.funnel} />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          Contas, onboarding e primeira task contam usuários criados no período. Visitantes contam pessoas anônimas, então a passagem para "contas" é uma aproximação.
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <Card title="Páginas mais vistas"><RankList rows={data.topPaths} /></Card>
        <Card title="Origem do tráfego"><RankList rows={data.topReferrers} /></Card>
        <Card title="Campanhas (utm_source)"><RankList rows={data.utmSources} empty="Nenhuma visita com utm_source" /></Card>
        <Card title="Cadastro por método"><RankList rows={data.signupsByMethod} /></Card>
      </div>
    </div>
  );
}
