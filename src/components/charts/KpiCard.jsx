import React from 'react';
import { cardStyle } from './chartTheme';

export default function KpiCard({ label, value, color, hint }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '1rem' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {hint != null && (
        <div style={{ fontSize: '0.72rem', marginTop: '0.3rem', color: hint.startsWith('-') ? 'var(--danger)' : 'var(--accent)' }}>
          {hint}
        </div>
      )}
    </div>
  );
}
