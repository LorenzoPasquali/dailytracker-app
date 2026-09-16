import React from 'react';
import { Spinner } from 'react-bootstrap';
import { cardStyle, chartTitleStyle } from '../../components/charts/chartTheme';

export function Card({ title, children, style }) {
  return (
    <div style={{ ...cardStyle, ...style }}>
      {title && <div style={chartTitleStyle}>{title}</div>}
      {children}
    </div>
  );
}

export function Loading() {
  return <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner animation="border" variant="success" size="sm" /></div>;
}

export function ErrorBox({ message }) {
  return (
    <div style={{ ...cardStyle, borderColor: 'var(--danger)', color: 'var(--danger)', fontSize: '0.85rem' }}>
      Não foi possível carregar: {message}
    </div>
  );
}

/** Simple ranked list: label + count + proportional bar. */
export function RankList({ rows, labelKey = 'key', valueKey = 'count', empty = 'Sem dados no período' }) {
  if (!rows?.length) return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{empty}</div>;
  const max = Math.max(...rows.map((r) => r[valueKey]));
  return (
    <div style={{ display: 'grid', gap: '0.4rem' }}>
      {rows.map((r) => (
        <div key={r[labelKey]} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <div style={{ position: 'relative', minWidth: 0 }}>
            <div style={{ position: 'absolute', inset: 0, width: `${(r[valueKey] / max) * 100}%`, background: 'var(--accent-subtle)', borderRadius: 3 }} />
            <span style={{ position: 'relative', padding: '0.15rem 0.4rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[labelKey]}</span>
          </div>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>{r[valueKey].toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
}
