import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';
import 'flag-icons/css/flag-icons.min.css';

const LOCALES = [
  { key: 'pt-BR', flag: 'br', label: 'PT' },
  { key: 'en-US', flag: 'us', label: 'EN' },
  { key: 'es',    flag: 'es', label: 'ES' },
];

export default function LanguageSelector({ variant = 'navbar', onSaveToServer }) {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const handleChange = async (localeKey) => {
    if (localeKey === current) return;
    localStorage.setItem('language', localeKey);
    await i18n.changeLanguage(localeKey);
    if (onSaveToServer) {
      onSaveToServer(localeKey);
    }
  };

  if (variant === 'dropdown') {
    return (
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.15rem 0' }}>
        {LOCALES.map(({ key, flag, label }) => (
          <button
            key={key}
            onClick={() => handleChange(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.3rem 0.5rem',
              border: `1px solid ${current === key ? 'var(--accent)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: current === key ? 'var(--accent-subtle)' : 'transparent',
              color: current === key ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition)',
              outline: 'none',
              fontFamily: 'inherit',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <span className={`fi fi-${flag}`} style={{ borderRadius: '2px', width: '16px', flexShrink: 0 }} />
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {LOCALES.map(({ key, flag, label }) => (
        <button
          key={key}
          onClick={() => handleChange(key)}
          title={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.5rem',
            border: `1px solid ${current === key ? 'var(--accent)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: current === key ? 'var(--accent-subtle)' : 'transparent',
            color: current === key ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition)',
            letterSpacing: '0.02em',
            lineHeight: 1,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        >
          <span className={`fi fi-${flag}`} style={{ borderRadius: '2px', width: '16px', flexShrink: 0 }} />
          {label}
        </button>
      ))}
    </div>
  );
}
