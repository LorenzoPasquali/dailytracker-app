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

// Auto-repeat tuning: pause before repeat kicks in, then each tick speeds up
// toward the floor — holding the key/button fast-forwards the value.
const HOLD_START_DELAY = 320;
const HOLD_MIN_DELAY = 35;
const HOLD_ACCEL = 0.8;

function TimeSpinner({ value, min, max, onChange }) {
  const inputRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const timerRef = useRef(null);
  const holdingRef = useRef(false);

  const stepOnce = (dir) => {
    const v = valueRef.current;
    const next = dir > 0 ? (v >= max ? min : v + 1) : (v <= min ? max : v - 1);
    valueRef.current = next; // advance synchronously so rapid ticks don't read a stale prop
    onChange(next);
  };

  const stopHold = useCallback(() => {
    holdingRef.current = false;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    window.removeEventListener('mouseup', stopHold);
  }, []);

  const startHold = (dir) => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    stepOnce(dir);
    let delay = HOLD_START_DELAY;
    const tick = () => {
      stepOnce(dir);
      delay = Math.max(HOLD_MIN_DELAY, delay * HOLD_ACCEL);
      timerRef.current = setTimeout(tick, delay);
    };
    timerRef.current = setTimeout(tick, delay);
    window.addEventListener('mouseup', stopHold);
  };

  useEffect(() => stopHold, [stopHold]); // clear any pending timer on unmount

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) startHold(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (!e.repeat) startHold(-1); }
  };
  const handleKeyUp = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') stopHold();
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
        aria-label="+"
        onMouseDown={(e) => { e.preventDefault(); startHold(1); }}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
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
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={stopHold}
        onFocus={(e) => e.target.select()}
        style={spinInputStyle}
      />
      <button
        type="button"
        aria-label="-"
        onMouseDown={(e) => { e.preventDefault(); startHold(-1); }}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
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
  backgroundColor: 'var(--bg-surface)',
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

// Typed-date support. English shows month first; everything else day first.
const digitsToMask = (raw) => {
  const d = raw.replace(/\D/g, '').slice(0, 12); // g1 g2 yyyy hh mm
  let out = d.slice(0, 2);
  if (d.length > 2) out += '/' + d.slice(2, 4);
  if (d.length > 4) out += '/' + d.slice(4, 8);
  if (d.length > 8) out += ' ' + d.slice(8, 10);
  if (d.length > 10) out += ':' + d.slice(10, 12);
  return out;
};

const dateToMask = (date, isEn) => {
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const datePart = isEn ? `${mm}/${dd}/${date.getFullYear()}` : `${dd}/${mm}/${date.getFullYear()}`;
  return `${datePart} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const maskToDate = (str, isEn, fallback) => {
  const d = str.replace(/\D/g, '');
  if (d.length < 8) return null;
  const g1 = +d.slice(0, 2), g2 = +d.slice(2, 4), year = +d.slice(4, 8);
  const day = isEn ? g2 : g1;
  const month = isEn ? g1 : g2;
  const hh = d.length >= 10 ? +d.slice(8, 10) : (fallback ? fallback.getHours() : 0);
  const mi = d.length >= 12 ? +d.slice(10, 12) : (fallback ? fallback.getMinutes() : 0);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hh > 23 || mi > 59 || year < 1000) return null;
  const dt = new Date(year, month - 1, day, hh, mi);
  if (dt.getMonth() !== month - 1 || dt.getDate() !== day) return null; // reject overflow (e.g. 31/02)
  return dt;
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
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const triggerRef = useRef(null);
  const popupRef = useRef(null);
  const inputRef = useRef(null);

  const locale = i18n.language || 'pt-BR';
  const isEnLocale = locale.toLowerCase().startsWith('en');
  const formatHint = isEnLocale ? 'mm/dd/yyyy hh:mm' : 'dd/mm/aaaa hh:mm';
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

  const enterEdit = () => {
    setOpen(true);
    setDraft(selected ? dateToMask(selected, isEnLocale) : '');
    setFocused(true);
  };

  // Commit on blur/Enter: empty clears, valid date commits, anything else reverts.
  const commitDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      if (value) onChange('');
    } else {
      const parsed = maskToDate(trimmed, isEnLocale, selected);
      if (parsed) onChange(formatValue(parsed));
    }
    setFocused(false);
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
        onClick={() => { if (!disabled) inputRef.current?.focus(); }}
        className={`dtpicker-trigger${open ? ' dtpicker-trigger--open' : ''}${disabled ? ' dtpicker-trigger--disabled' : ''}`}
      >
        <CalendarEventFill
          size={12}
          style={{ color: displayText ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, transition: 'color var(--transition)' }}
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          className="dtpicker-input"
          placeholder={focused ? formatHint : (placeholder ?? '—')}
          value={focused ? draft : displayText}
          onFocus={(e) => { enterEdit(); requestAnimationFrame(() => e.target.select()); }}
          onChange={(e) => setDraft(digitsToMask(e.target.value))}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitDraft(); inputRef.current?.blur(); }
            else if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); }
          }}
        />
        {value && !disabled && (
          <span onMouseDown={(e) => e.preventDefault()} onClick={handleClear} className="dtpicker-clear" title={t('common.cancel')}>
            <X size={13} />
          </span>
        )}
      </div>
      {popup}
    </>
  );
}
