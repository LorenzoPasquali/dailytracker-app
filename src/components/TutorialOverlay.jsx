import React, { useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const TOOLTIP_W = 340;
const TOOLTIP_H = 185;
const SPOT_PAD = 10;
const MARGIN = 14;

function getSpot(targetId) {
  if (!targetId) return null;
  const el = document.querySelector(`[data-tutorial-id="${targetId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: r.left - SPOT_PAD,
    y: r.top - SPOT_PAD,
    w: r.width + SPOT_PAD * 2,
    h: r.height + SPOT_PAD * 2,
  };
}

function getTooltipPos(spot) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!spot) {
    return { x: (vw - TOOLTIP_W) / 2, y: (vh - TOOLTIP_H) / 2, arrow: null };
  }

  const clampX = (x) => Math.min(Math.max(x, MARGIN), vw - TOOLTIP_W - MARGIN);
  const clampY = (y) => Math.min(Math.max(y, MARGIN), vh - TOOLTIP_H - MARGIN);
  const cx = spot.x + spot.w / 2;
  const cy = spot.y + spot.h / 2;

  // Try bottom
  if (spot.y + spot.h + TOOLTIP_H + MARGIN <= vh) {
    return { x: clampX(cx - TOOLTIP_W / 2), y: spot.y + spot.h + MARGIN, arrow: 'top' };
  }
  // Try top
  if (spot.y - TOOLTIP_H - MARGIN >= 0) {
    return { x: clampX(cx - TOOLTIP_W / 2), y: spot.y - TOOLTIP_H - MARGIN, arrow: 'bottom' };
  }
  // Try right
  if (spot.x + spot.w + TOOLTIP_W + MARGIN <= vw) {
    return { x: spot.x + spot.w + MARGIN, y: clampY(cy - TOOLTIP_H / 2), arrow: 'left' };
  }
  // Try left
  if (spot.x - TOOLTIP_W - MARGIN >= 0) {
    return { x: spot.x - TOOLTIP_W - MARGIN, y: clampY(cy - TOOLTIP_H / 2), arrow: 'right' };
  }
  // Fallback center
  return { x: (vw - TOOLTIP_W) / 2, y: (vh - TOOLTIP_H) / 2, arrow: null };
}

export default function TutorialOverlay({ steps, currentStep, onNext, onSkip }) {
  const { t } = useTranslation();
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const [spot, setSpot] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, arrow: null });
  const [opacity, setOpacity] = useState(0);

  const recalc = useCallback(() => {
    const newSpot = getSpot(step.target);
    setSpot(newSpot);
    setTooltipPos(getTooltipPos(newSpot));
  }, [step]);

  useLayoutEffect(() => {
    setOpacity(0);
    // Small delay so DOM has settled (accordion opening, etc.)
    const t1 = setTimeout(() => {
      recalc();
      setOpacity(1);
    }, 60);

    window.addEventListener('resize', recalc);
    return () => {
      clearTimeout(t1);
      window.removeEventListener('resize', recalc);
    };
  }, [currentStep, recalc]);

  // SVG rect values for the cutout
  const svgX = spot ? spot.x : window.innerWidth / 2;
  const svgY = spot ? spot.y : window.innerHeight / 2;
  const svgW = spot ? spot.w : 0;
  const svgH = spot ? spot.h : 0;

  const arrowStyle = {
    position: 'absolute',
    width: 0,
    height: 0,
  };

  const arrowEl = tooltipPos.arrow === 'top' ? (
    <div style={{
      ...arrowStyle,
      top: -8,
      left: TOOLTIP_W / 2 - 8,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderBottom: '8px solid var(--bg-elevated)',
    }} />
  ) : tooltipPos.arrow === 'bottom' ? (
    <div style={{
      ...arrowStyle,
      bottom: -8,
      left: TOOLTIP_W / 2 - 8,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderTop: '8px solid var(--bg-elevated)',
    }} />
  ) : tooltipPos.arrow === 'left' ? (
    <div style={{
      ...arrowStyle,
      left: -8,
      top: TOOLTIP_H / 2 - 8,
      borderTop: '8px solid transparent',
      borderBottom: '8px solid transparent',
      borderRight: '8px solid var(--bg-elevated)',
    }} />
  ) : tooltipPos.arrow === 'right' ? (
    <div style={{
      ...arrowStyle,
      right: -8,
      top: TOOLTIP_H / 2 - 8,
      borderTop: '8px solid transparent',
      borderBottom: '8px solid transparent',
      borderLeft: '8px solid var(--bg-elevated)',
    }} />
  ) : null;

  const content = (
    <>
      {/* SVG Spotlight Overlay */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 10000,
          pointerEvents: 'all',
        }}
        aria-hidden="true"
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={svgX}
              y={svgY}
              width={svgW}
              height={svgH}
              rx="10"
              fill="black"
              style={{
                transition: 'x 300ms ease, y 300ms ease, width 300ms ease, height 300ms ease',
              }}
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Tooltip Balloon */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label={t(`tutorial.${step.id}.title`)}
        style={{
          position: 'fixed',
          left: tooltipPos.x,
          top: tooltipPos.y,
          width: TOOLTIP_W,
          zIndex: 10001,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          opacity,
          transition: 'opacity 200ms ease',
        }}
      >
        {arrowEl}

        {/* Progress dots + Skip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStep ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: i === currentStep ? 'var(--accent)' : 'var(--border-strong)',
                  transition: 'all 300ms ease',
                }}
              />
            ))}
          </div>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              fontFamily: 'inherit',
              letterSpacing: '0.01em',
            }}
          >
            {t('tutorial.skip')}
          </button>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '0.98rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 0.35rem 0',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.3px',
        }}>
          {t(`tutorial.${step.id}.title`)}
        </h3>

        {/* Body */}
        <p style={{
          fontSize: '0.86rem',
          color: 'var(--text-secondary)',
          margin: '0 0 1rem 0',
          lineHeight: 1.55,
        }}>
          {t(`tutorial.${step.id}.body`)}
        </p>

        {/* Next / Start button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onNext}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--bg-base)',
              fontWeight: 600,
              fontSize: '0.85rem',
              padding: '0.45rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
            }}
          >
            {isLast ? t('tutorial.start') : t('tutorial.next')}
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
