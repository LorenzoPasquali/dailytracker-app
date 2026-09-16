import React from 'react';

export default function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '0.5rem 0.75rem',
      fontFamily: 'var(--font-body)',
      fontSize: '0.82rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      {label && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.35rem', fontSize: '0.75rem' }}>{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: 1.6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color || entry.fill, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
}
