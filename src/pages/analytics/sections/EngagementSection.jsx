import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import KpiCard from '../../../components/charts/KpiCard';
import DarkTooltip from '../../../components/charts/DarkTooltip';
import EmptyState from '../../../components/charts/EmptyState';
import { TICK_STYLE, GRID_COLOR } from '../../../components/charts/chartTheme';
import { useAdminQuery, fmt } from '../useAdminQuery';
import { Card, Loading, ErrorBox } from '../Shared';
import { thStyle, tdStyle } from '../tableStyles';

function heat(pct) {
  if (pct == null) return 'transparent';
  const a = Math.min(0.08 + (pct / 100) * 0.85, 0.95);
  return `rgba(16, 185, 129, ${a})`;
}

function Cohorts({ rows }) {
  if (!rows?.length) return <EmptyState label="Ainda não há coortes (precisa de contas criadas nas últimas 12 semanas)" />;
  const offsets = rows[0].retention.length;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
        <thead>
          <tr>
            <th style={thStyle}>Semana de cadastro</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Contas</th>
            {Array.from({ length: offsets }, (_, i) => <th key={i} style={{ ...thStyle, textAlign: 'center' }}>S{i}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cohortWeek}>
              <td style={tdStyle}>{fmt.date(r.cohortWeek)}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.size}</td>
              {r.retention.map((pct, i) => (
                <td key={i} style={{ ...tdStyle, textAlign: 'center', padding: '0.25rem' }}>
                  <div style={{ background: heat(pct), borderRadius: 4, padding: '0.3rem 0', fontSize: '0.78rem', color: pct == null ? 'var(--text-muted)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {pct == null ? '' : `${Math.round(pct)}%`}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        S0 = semana do cadastro. Cada célula é a fração da coorte que usou o app naquela semana.
      </div>
    </div>
  );
}

export default function EngagementSection({ range }) {
  const { data, loading, error } = useAdminQuery('/admin/analytics/engagement', range);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const c = data.current || {};
  const series = data.series.map((d) => ({ ...d, label: fmt.day(d.day) }));
  const hasData = series.some((d) => d.mau > 0);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <KpiCard label="Ativos hoje (DAU)" value={fmt.int(c.dau)} color="#3b82f6" />
        <KpiCard label="Ativos 7 dias (WAU)" value={fmt.int(c.wau)} color="#8b5cf6" />
        <KpiCard label="Ativos 30 dias (MAU)" value={fmt.int(c.mau)} color="var(--accent)" />
        <KpiCard label="Stickiness (DAU/MAU)" value={fmt.pct(c.stickiness, 0)} color="var(--text-primary)" />
      </div>

      <Card title="Usuários ativos: diário, 7 dias e 30 dias">
        {!hasData ? <EmptyState label="Sem atividade registrada no período" /> : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="dau" name="DAU" stroke="#3b82f6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="wau" name="WAU" stroke="#8b5cf6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="mau" name="MAU" stroke="#10b981" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Retenção por coorte semanal (últimas 12 semanas)">
        <Cohorts rows={data.cohorts} />
      </Card>
    </div>
  );
}
