import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { datepickerLocales } from '../i18n/datepicker-locales';
import CalendarEventFill from 'react-bootstrap-icons/dist/icons/calendar-event-fill';
import X from 'react-bootstrap-icons/dist/icons/x';
import ChevronUp from 'react-bootstrap-icons/dist/icons/chevron-up';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';

Object.entries(datepickerLocales).forEach(([key, locale]) => {
  registerLocale(key, locale);
});

const pad = (n) => String(n).padStart(2, '0');

function TimeSpinner({ value, min, max, onChange }) {
  const inputRef = useRef(null);

  const increment = (e) => { e.preventDefault(); onChange((value + 1 > max ? min : value + 1)); };
  const decrement = (e) => { e.preventDefault(); onChange((value - 1 < min ? max : value - 1)); };

  const handleKey = (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); increment(e); }
    if (e.key === 'ArrowDown') { e.preventDefault(); decrement(e); }
  };

  const handleInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(-2);
    const n = parseInt(raw, 10);
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
      <button
        type="button"
        onMouseDown={increment}
        style={spinBtnStyle}
      >
        <ChevronUp size={10} />
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={pad(value)}
        onChange={handleInput}
        onKeyDown={handleKey}
        onFocus={(e) => e.target.select()}
        style={spinInputStyle}
      />
      <button
        type="button"
        onMouseDown={decrement}
        style={spinBtnStyle}
      >
        <ChevronDown size={10} />
      </button>
    </div>
  );
}

const spinBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '2px 4px',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
  transition: 'color 0.15s, background 0.15s',
};

const spinInputStyle = {
  width: '2rem',
  textAlign: 'center',
  backgroundColor: 'var(--bg-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  fontWeight: '600',
  fontFamily: 'var(--font-mono, monospace)',
  padding: '3px 2px',
  outline: 'none',
};

const parseValue = (val) => {
  if (!val) return null;
  const [datePart, timePart = '00:00'] = val.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = (timePart || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0);
};


const formatValue = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const DTP_STYLES = `
  .dtp-wrap .react-datepicker {
    background-color: var(--bg-elevated);
    border: none;
    font-family: var(--font-body);
  }
  .dtp-wrap .react-datepicker__header {
    background-color: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0.5rem 0.4rem 0.3rem;
  }
  .dtp-wrap .react-datepicker__current-month {
    color: var(--text-primary);
    font-size: 0.8rem;
    font-weight: 600;
    padding-bottom: 0.3rem;
  }
  .dtp-wrap .react-datepicker__day-name {
    color: var(--text-muted);
    font-size: 0.65rem;
    font-weight: 500;
    width: 1.9rem;
    line-height: 1.7rem;
    margin: 0.04rem;
    text-transform: uppercase;
  }
  .dtp-wrap .react-datepicker__day {
    color: var(--text-secondary);
    width: 1.9rem;
    line-height: 1.9rem;
    margin: 0.04rem;
    border-radius: var(--radius-sm);
    font-size: 0.76rem;
  }
  .dtp-wrap .react-datepicker__day:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
  }
  .dtp-wrap .react-datepicker__day--selected,
  .dtp-wrap .react-datepicker__day--keyboard-selected {
    background-color: var(--accent) !important;
    color: var(--bg-base) !important;
    font-weight: 700;
  }
  .dtp-wrap .react-datepicker__day--today {
    color: var(--accent);
    font-weight: 600;
    border: 1px solid var(--accent-border);
  }
  .dtp-wrap .react-datepicker__day--today.react-datepicker__day--selected { border: none; }
  .dtp-wrap .react-datepicker__day--outside-month { color: var(--text-muted); opacity: 0.35; }
  .dtp-wrap .react-datepicker__navigation-icon::before {
    border-color: var(--text-muted);
    border-width: 2px 2px 0 0;
  }
  .dtp-wrap .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
    border-color: var(--text-primary);
  }
  .dtp-wrap .react-datepicker__month-container { float: none; }
`;

export default function CustomDateTimePicker({ value, onChange, placeholder, disabled }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0, above: false });
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  const locale = i18n.language || 'pt-BR';
  const selected = parseValue(value);

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const above = window.innerHeight - rect.bottom < 300 && rect.top > 300;
    setPopupPos({
      top: above ? rect.top - 8 : rect.bottom + 5,
      left: rect.left,
      above,
    });
  }, []);

  useLayoutEffect(() => { if (open) computePosition(); }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', computePosition, true);
    window.addEventListener('resize', computePosition);
    return () => {
      window.removeEventListener('scroll', computePosition, true);
      window.removeEventListener('resize', computePosition);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || popupRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleDateChange = (date) => {
    if (!date) return;
    // keep existing time
    if (selected) {
      date.setHours(selected.getHours(), selected.getMinutes());
    }
    onChange(formatValue(date));
  };

  const handleHourChange = (h) => {
    const base = selected ? new Date(selected) : new Date();
    base.setHours(h, selected ? selected.getMinutes() : 0);
    onChange(formatValue(base));
  };

  const handleMinuteChange = (m) => {
    const base = selected ? new Date(selected) : new Date();
    base.setHours(selected ? selected.getHours() : 0, m);
    onChange(formatValue(base));
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const displayText = (() => {
    if (!value || !selected) return '';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(selected);
  })();

  const popupStyle = {
    position: 'fixed',
    left: popupPos.left,
    zIndex: 99999,
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
    overflow: 'hidden',
    animation: 'dtpickerFadeIn 0.12s cubic-bezier(0.16,1,0.3,1) both',
    transformOrigin: popupPos.above ? 'bottom center' : 'top center',
    ...(popupPos.above
      ? { bottom: window.innerHeight - popupPos.top, top: 'auto' }
      : { top: popupPos.top }),
  };

  const popup = open ? createPortal(
    <div ref={popupRef} style={popupStyle} onMouseDown={(e) => e.stopPropagation()}>
      <style>{DTP_STYLES}</style>
      <div className="dtp-wrap">
        <DatePicker
          selected={selected}
          onChange={handleDateChange}
          inline
          locale={locale}
        />
      </div>
      {/* Time row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.75rem 0.5rem',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-elevated)',
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flex: 1 }}>
          {t('task.dueDate')}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <TimeSpinner
            value={selected ? selected.getHours() : 0}
            min={0}
            max={23}
            onChange={handleHourChange}
          />
          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', lineHeight: 1, paddingBottom: '1px' }}>:</span>
          <TimeSpinner
            value={selected ? selected.getMinutes() : 0}
            min={0}
            max={59}
            onChange={handleMinuteChange}
          />
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`dtpicker-trigger${open ? ' dtpicker-trigger--open' : ''}${disabled ? ' dtpicker-trigger--disabled' : ''}`}
      >
        <CalendarEventFill
          size={12}
          style={{ color: displayText ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, transition: 'color var(--transition)' }}
        />
        <span className={`dtpicker-display${!displayText ? ' dtpicker-display--empty' : ''}`}>
          {displayText || (placeholder ?? '—')}
        </span>
        {value && !disabled && (
          <span onClick={handleClear} className="dtpicker-clear" title={t('common.cancel')}>
            <X size={13} />
          </span>
        )}
      </div>
      {popup}
    </>
  );
}
