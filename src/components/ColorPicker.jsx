import React, { useState, useEffect } from 'react';
import { Popover, OverlayTrigger, Button } from 'react-bootstrap';
import { HexColorPicker } from 'react-colorful';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f43f5e', '#64748b', '#a3a3a3',
];

export default function ColorPicker({ currentColor, onColorSelect }) {
  const [draftColor, setDraftColor] = useState(currentColor || '#ef4444');

  // Sync draft when external color changes (e.g. parent re-fetches data)
  useEffect(() => {
    setDraftColor(currentColor || '#ef4444');
  }, [currentColor]);

  // Only commit to parent (and trigger API calls) when popover closes
  const handleToggle = (nextShow) => {
    if (!nextShow && draftColor !== currentColor) {
      onColorSelect(draftColor);
    }
  };

  const popover = (
    <Popover id="popover-color-picker" style={{ maxWidth: '220px' }}>
      <Popover.Body style={{
        padding: '0.75rem',
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
      }}>
        <HexColorPicker
          color={draftColor}
          onChange={setDraftColor}
          style={{ width: '100%', height: '140px', borderRadius: '8px' }}
        />

        {/* Preset swatches */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '5px',
          marginTop: '0.6rem',
        }}>
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setDraftColor(c)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '4px',
                backgroundColor: c,
                border: draftColor === c
                  ? '2px solid var(--text-primary)'
                  : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>

        {/* Hex input */}
        <div style={{
          marginTop: '0.6rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'var(--bg-base)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          padding: '0.3rem 0.5rem',
        }}>
          <div style={{
            width: '14px', height: '14px',
            borderRadius: '3px',
            backgroundColor: draftColor,
            flexShrink: 0,
            border: '1px solid var(--border-subtle)',
          }} />
          <input
            value={draftColor}
            onChange={e => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setDraftColor(val);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              minWidth: 0,
            }}
          />
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom"
      overlay={popover}
      rootClose
      onToggle={handleToggle}
    >
      <Button
        variant="link"
        className="p-0 m-0"
        style={{ lineHeight: 1, display: 'inline-flex', alignItems: 'center' }}
        aria-label="Escolher cor"
      >
        <div style={{
          width: '22px',
          height: '22px',
          backgroundColor: draftColor,
          borderRadius: '50%',
          border: '2px solid var(--border-default)',
          cursor: 'pointer',
          transition: 'transform 0.15s, border-color 0.15s',
          boxShadow: `0 0 0 0 ${draftColor}40`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.15)';
          e.currentTarget.style.borderColor = 'var(--border-strong)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
        }}
        />
      </Button>
    </OverlayTrigger>
  );
}
