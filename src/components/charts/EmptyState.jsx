import React from 'react';

export default function EmptyState({ label }) {
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      {label}
    </div>
  );
}
