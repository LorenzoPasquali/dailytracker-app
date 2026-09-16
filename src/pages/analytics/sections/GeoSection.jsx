import React, { useState } from 'react';
import { useAdminQuery, fmt } from '../useAdminQuery';
import { Card, Loading, ErrorBox } from '../Shared';
import { thStyle, tdStyle, numStyle } from '../tableStyles';
import WorldMap from '../WorldMap';
import { countryName } from '../countries';

const METRICS = [
  { key: 'visitors', label: 'Visitantes' },
  { key: 'pageviews', label: 'Visualizações' },
  { key: 'signups', label: 'Contas criadas' },
  { key: 'activeUsers', label: 'Usuários ativos' },
];

export default function GeoSection({ range }) {
  const { data, loading, error } = useAdminQuery('/admin/analytics/geo', range);
  const [metric, setMetric] = useState('visitors');
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const rows = [...data.countries].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
  const total = rows.reduce((s, r) => s + (r[metric] || 0), 0);
  const current = METRICS.find((m) => m.key === metric);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <Card>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {METRICS.map((m) => (
            <button key={m.key} type="button" onClick={() => setMetric(m.key)} style={{
              padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
              color: metric === m.key ? 'var(--accent)' : 'var(--text-muted)',
              background: metric === m.key ? 'var(--accent-subtle)' : 'transparent',
              border: `1px solid ${metric === m.key ? 'var(--accent)' : 'var(--border-subtle)'}`,
            }}>{m.label}</button>
          ))}
        </div>
        {rows.length === 0
          ? <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>
              Nenhum país identificado no período. Sem o banco GeoLite2 configurado no servidor, o país fica vazio.
            </div>
          : <WorldMap rows={rows} metric={metric} label={current.label} />}
      </Card>

      <Card title={`Por país · ${current.label}`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
            <thead>
              <tr>
                <th style={thStyle}>País</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Visitantes</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Visualizações</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Contas criadas</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Usuários ativos</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>% de {current.label.toLowerCase()}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.country}>
                  <td style={tdStyle}>{countryName(r.country)} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{r.country}</span></td>
                  <td style={numStyle}>{fmt.int(r.visitors)}</td>
                  <td style={numStyle}>{fmt.int(r.pageviews)}</td>
                  <td style={numStyle}>{fmt.int(r.signups)}</td>
                  <td style={numStyle}>{fmt.int(r.activeUsers)}</td>
                  <td style={numStyle}>{total ? `${(((r[metric] || 0) / total) * 100).toFixed(1)}%` : '–'}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, color: 'var(--text-muted)' }}>Sem dados</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
