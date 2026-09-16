import React, { useState } from 'react';
import { format } from 'date-fns';
import Calendar from 'react-bootstrap-icons/dist/icons/calendar';
import DateFilterModal from '../../components/DateFilterModal';
import { PRESETS } from './rangeUtils';

const btn = (active) => ({
  padding: '0.35rem 0.75rem',
  fontSize: '0.82rem',
  fontWeight: active ? 600 : 400,
  color: active ? 'var(--accent)' : 'var(--text-muted)',
  backgroundColor: active ? 'var(--accent-subtle)' : 'transparent',
  border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
});

export default function RangeBar({ preset, custom, onChange }) {
  const [showModal, setShowModal] = useState(false);
  const isCustom = !!custom?.[0];

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {PRESETS.map((p) => (
        <button key={p.key} type="button" style={btn(!isCustom && preset === p.key)}
          onClick={() => onChange({ preset: p.key, custom: [null, null] })}>
          {p.label}
        </button>
      ))}
      <button type="button" style={btn(isCustom)} onClick={() => setShowModal(true)}>
        <Calendar size={13} />
        {isCustom
          ? (custom[1] ? `${format(custom[0], 'dd/MM')} – ${format(custom[1], 'dd/MM')}` : format(custom[0], 'dd/MM/yyyy'))
          : 'Período'}
      </button>
      <DateFilterModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        onApplyFilter={(range) => onChange({ preset, custom: range })}
        initialDateRange={custom}
      />
    </div>
  );
}
