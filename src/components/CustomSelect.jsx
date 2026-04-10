import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ChevronDown from 'react-bootstrap-icons/dist/icons/chevron-down';
import CheckLg from 'react-bootstrap-icons/dist/icons/check-lg';

const GLASS_STYLES = `
@keyframes cselectIn {
  from { opacity: 0; transform: scale(0.96) translateY(-6px); }
  to   { opacity: 1; transform: scale(1)    translateY(0);    }
}
@keyframes cselectOut {
  from { opacity: 1; transform: scale(1)    translateY(0);    }
  to   { opacity: 0; transform: scale(0.96) translateY(-6px); }
}

.cselect-dropdown {
  position: fixed;
  z-index: 99998;
  background: rgba(18, 18, 20, 0.82);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.072);
  border-radius: 14px;
  box-shadow:
    0 2px 0 0 rgba(255,255,255,0.04) inset,
    0 1px 0 0 rgba(255,255,255,0.08) inset,
    0 20px 60px rgba(0,0,0,0.55),
    0 4px 16px rgba(0,0,0,0.35);
  overflow: hidden;
  animation: cselectIn 0.2s cubic-bezier(0.16,1,0.3,1) both;
}

[data-theme="light"] .cselect-dropdown {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(28px) saturate(200%);
  -webkit-backdrop-filter: blur(28px) saturate(200%);
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow:
    0 2px 0 0 rgba(255,255,255,0.9) inset,
    0 1px 0 0 rgba(255,255,255,0.7) inset,
    0 20px 60px rgba(0,0,0,0.18),
    0 4px 16px rgba(0,0,0,0.1);
}

.cselect-inner {
  max-height: 260px;
  overflow-y: auto;
  padding: 5px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

[data-theme="light"] .cselect-inner {
  scrollbar-color: rgba(0,0,0,0.1) transparent;
}

.cselect-inner::-webkit-scrollbar { width: 4px; }
.cselect-inner::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
[data-theme="light"] .cselect-inner::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
}

.cselect-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 9px;
  font-size: 0.88rem;
  font-family: var(--font-body);
  cursor: pointer;
  color: var(--text-secondary);
  transition: background 0.12s ease, color 0.12s ease;
  user-select: none;
  gap: 8px;
}

.cselect-option:hover,
.cselect-option--focused {
  background: rgba(255, 255, 255, 0.07);
  color: var(--text-primary);
}

[data-theme="light"] .cselect-option:hover,
[data-theme="light"] .cselect-option--focused {
  background: rgba(0, 0, 0, 0.055);
  color: var(--text-primary);
}

.cselect-option--selected {
  color: var(--accent) !important;
  background: rgba(16, 185, 129, 0.1) !important;
  font-weight: 600;
}

[data-theme="light"] .cselect-option--selected {
  background: rgba(5, 150, 105, 0.1) !important;
}

.cselect-option--focused.cselect-option--selected {
  background: rgba(16, 185, 129, 0.18) !important;
}

[data-theme="light"] .cselect-option--focused.cselect-option--selected {
  background: rgba(5, 150, 105, 0.18) !important;
}

.cselect-option--placeholder { color: var(--text-muted); }

.cselect-option--placeholder.cselect-option--selected {
  color: var(--text-muted) !important;
  background: rgba(255,255,255,0.03) !important;
}

.cselect-divider {
  height: 1px;
  background: rgba(255,255,255,0.055);
  margin: 4px 8px;
  border-radius: 1px;
}

[data-theme="light"] .cselect-divider { background: rgba(0,0,0,0.07); }

.cselect-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.42rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  background-color: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: var(--font-body);
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  min-height: 38px;
}

.cselect-trigger:focus-visible { outline: none; }

.cselect-trigger--open,
.cselect-trigger:hover:not(.cselect-trigger--disabled) {
  border-color: var(--border-strong);
}

.cselect-trigger--open {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 2px var(--accent-subtle) !important;
}

.cselect-trigger--disabled { opacity: 0.45; cursor: not-allowed; }
.cselect-trigger--placeholder { color: var(--text-muted); }

.cselect-chevron {
  flex-shrink: 0;
  color: var(--text-muted);
  transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), color 0.15s ease;
}

.cselect-trigger--open .cselect-chevron {
  transform: rotate(180deg);
  color: var(--accent);
}
`;

let styleInjected = false;
function injectStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const el = document.createElement('style');
  el.textContent = GLASS_STYLES;
  document.head.appendChild(el);
}

export default function CustomSelect({
  value,
  onChange,
  children,
  disabled = false,
  className = '',
  style = {},
}) {
  injectStyles();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0, above: false });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);

  const options = React.Children.toArray(children)
    .filter(child => child.type === 'option')
    .map(child => ({
      value: child.props.value ?? '',
      label: child.props.children,
      disabled: child.props.disabled,
    }));

  const selectedIndex = options.findIndex(o => String(o.value) === String(value));
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
  const isPlaceholder = !selectedOption || selectedOption.value === '';
  const displayLabel = selectedOption?.label ?? '';

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = Math.min(options.length * 38 + 10, 270);
    const above = (window.innerHeight - rect.bottom) < estimatedHeight && rect.top > estimatedHeight;
    setDropPos({ top: above ? rect.top - 6 : rect.bottom + 5, left: rect.left, width: rect.width, above });
  }, [options.length]);

  useLayoutEffect(() => { if (open) computePosition(); }, [open, computePosition]);

  useEffect(() => {
    if (!open) return;
    const h = () => computePosition();
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [open, computePosition]);

  // Scroll focused option into view
  useEffect(() => {
    if (!open || focusedIndex < 0) return;
    optionRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (triggerRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return;
      closeDropdown();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const closeDropdown = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); setFocusedIndex(-1); }, 140);
  }, []);

  const openDropdown = useCallback(() => {
    setOpen(true);
    // Pre-focus the currently selected option
    setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [selectedIndex]);

  const handleToggle = () => {
    if (disabled) return;
    if (open) closeDropdown();
    else openDropdown();
  };

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange?.({ target: { value: opt.value } });
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (e) => {
    // Never intercept Ctrl/Cmd+Enter — let it bubble to the form
    if (e.ctrlKey || e.metaKey) return;

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    // Dropdown is open
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setFocusedIndex(i => {
          let next = i + 1;
          while (next < options.length && options[next]?.disabled) next++;
          return next < options.length ? next : i;
        });
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setFocusedIndex(i => {
          let prev = i - 1;
          while (prev >= 0 && options[prev]?.disabled) prev--;
          return prev >= 0 ? prev : i;
        });
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex]);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeDropdown();
        break;
      }
      case 'Tab': {
        // Close on tab so focus moves naturally to next element
        closeDropdown();
        break;
      }
      default:
        break;
    }
  };

  const dropdownStyle = {
    position: 'fixed',
    left: dropPos.left,
    width: Math.max(dropPos.width, 180),
    zIndex: 99998,
    ...(dropPos.above
      ? { bottom: window.innerHeight - dropPos.top, top: 'auto' }
      : { top: dropPos.top }),
    ...(closing ? { animation: 'cselectOut 0.14s cubic-bezier(0.4,0,1,1) both' } : {}),
  };

  const dropdown = (open || closing) ? createPortal(
    <div
      ref={dropdownRef}
      className="cselect-dropdown"
      style={dropdownStyle}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="cselect-inner">
        {options.map((opt, i) => {
          const isSelected = String(opt.value) === String(value);
          const isPlaceholderOpt = opt.value === '';
          const isFocused = i === focusedIndex;
          return (
            <React.Fragment key={`${opt.value}-${i}`}>
              {i === 0 && isPlaceholderOpt && options.length > 1 && (
                <div className="cselect-divider" style={{ marginTop: 0 }} />
              )}
              <div
                ref={el => { optionRefs.current[i] = el; }}
                className={[
                  'cselect-option',
                  isSelected ? 'cselect-option--selected' : '',
                  isPlaceholderOpt ? 'cselect-option--placeholder' : '',
                  isFocused ? 'cselect-option--focused' : '',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => setFocusedIndex(i)}
                onClick={() => handleSelect(opt)}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {isSelected && !isPlaceholderOpt && (
                  <CheckLg size={13} style={{ flexShrink: 0, color: 'var(--accent)' }} />
                )}
              </div>
              {i === 0 && isPlaceholderOpt && options.length > 1 && (
                <div className="cselect-divider" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className={[
          'cselect-trigger',
          open ? 'cselect-trigger--open' : '',
          disabled ? 'cselect-trigger--disabled' : '',
          isPlaceholder ? 'cselect-trigger--placeholder' : '',
          className,
        ].filter(Boolean).join(' ')}
        style={style}
      >
        <span style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isPlaceholder ? 'var(--text-muted)' : 'var(--text-primary)',
        }}>
          {displayLabel}
        </span>
        <ChevronDown size={14} className="cselect-chevron" />
      </div>
      {dropdown}
    </>
  );
}
