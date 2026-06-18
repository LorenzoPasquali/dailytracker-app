import { motion, useAnimation } from 'motion/react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';

/*
 * Animated sidebar icons, adapted from pqoqubbw/icons (MIT) to this project's
 * JS/JSX stack: TypeScript stripped, the `cn` helper dropped, and the shared
 * forwardRef + imperative-handle plumbing factored into `useAnimatedIcon`.
 *
 * Each icon exposes `startAnimation()` / `stopAnimation()` so a parent row can
 * drive it on row-level hover; left uncontrolled, the icon animates on its own
 * hover. SVG path data is kept verbatim from upstream (Lucide shapes).
 */
function useAnimatedIcon(ref, onMouseEnter, onMouseLeave, start, stop) {
  const controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation: () => start(controls),
      stopAnimation: () => stop(controls),
    };
  });

  const handleMouseEnter = useCallback(
    (e) => {
      if (isControlledRef.current) onMouseEnter?.(e);
      else start(controls);
    },
    [controls, onMouseEnter, start]
  );

  const handleMouseLeave = useCallback(
    (e) => {
      if (isControlledRef.current) onMouseLeave?.(e);
      else stop(controls);
    },
    [controls, onMouseLeave, stop]
  );

  return { controls, handleMouseEnter, handleMouseLeave };
}

const startAnimate = (c) => c.start('animate');
const stopNormal = (c) => c.start('normal');

const SVG_BASE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
  viewBox: '0 0 24 24',
  xmlns: 'http://www.w3.org/2000/svg',
};

// ── Home (Monitor) ───────────────────────────────────────────────────────
const HOME_PATH_VARIANTS = {
  normal: { pathLength: 1, opacity: 1 },
  animate: { opacity: [0, 1], pathLength: [0, 1] },
};
export const HomeIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <motion.path animate={controls} d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" transition={{ duration: 0.6, opacity: { duration: 0.2 } }} variants={HOME_PATH_VARIANTS} />
      </svg>
    </div>
  );
});
HomeIcon.displayName = 'HomeIcon';

// ── Layers (Cadastros) ─────────────────────────────────────────────────────
const LAYERS_SPRING = { type: 'spring', stiffness: 100, damping: 14, mass: 1 };
const layersStart = async (c) => { await c.start('firstState'); await c.start('secondState'); };
const layersStop = (c) => c.start('normal');
export const LayersIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, layersStart, layersStop);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
        <motion.path animate={controls} d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" transition={LAYERS_SPRING} variants={{ normal: { y: 0 }, firstState: { y: -9 }, secondState: { y: 0 } }} />
        <motion.path animate={controls} d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" transition={LAYERS_SPRING} variants={{ normal: { y: 0 }, firstState: { y: -5 }, secondState: { y: 0 } }} />
      </svg>
    </div>
  );
});
LayersIcon.displayName = 'LayersIcon';

// ── TrendingUp (Análise) ────────────────────────────────────────────────────
const TREND_SVG_VARIANTS = {
  normal: { translateX: 0, translateY: 0 },
  animate: { translateX: [0, 2, 0], translateY: [0, -2, 0], transition: { duration: 0.5 } },
};
const TREND_LINE_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, transition: { duration: 0.4, opacity: { duration: 0.1 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], pathOffset: [1, 0], transition: { duration: 0.4, opacity: { duration: 0.1 } } },
};
const TREND_ARROW_VARIANTS = {
  normal: { opacity: 1, pathLength: 1, transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } } },
  animate: { opacity: [0, 1], pathLength: [0, 1], pathOffset: [0.5, 0], transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } } },
};
export const TrendingUpIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <motion.svg {...SVG_BASE} width={size} height={size} animate={controls} initial="normal" variants={TREND_SVG_VARIANTS}>
        <motion.polyline animate={controls} initial="normal" points="22 7 13.5 15.5 8.5 10.5 2 17" variants={TREND_LINE_VARIANTS} />
        <motion.polyline animate={controls} initial="normal" points="16 7 22 7 22 13" variants={TREND_ARROW_VARIANTS} />
      </motion.svg>
    </div>
  );
});
TrendingUpIcon.displayName = 'TrendingUpIcon';

// ── PlugZap (Integrações) ───────────────────────────────────────────────────
const ZAP_VARIANT = {
  normal: { opacity: 1 },
  animate: { opacity: [1, 0.4, 1], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' } },
};
export const PlugZapIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z" />
        <path d="m2 22 3-3" />
        <path d="M7.5 13.5 10 11" />
        <path d="M10.5 16.5 13 14" />
        <motion.path animate={controls} d="m18 3-4 4h6l-4 4" initial="normal" variants={ZAP_VARIANT} />
      </svg>
    </div>
  );
});
PlugZapIcon.displayName = 'PlugZapIcon';

// ── ChartColumnIncreasing (Relatórios) ──────────────────────────────────────
const CHART_LINE_VARIANTS = {
  visible: { pathLength: 1, opacity: 1 },
  hidden: { pathLength: 0, opacity: 0 },
};
const chartStart = async (c) => {
  await c.start((i) => ({ pathLength: 0, opacity: 0, transition: { delay: i * 0.1, duration: 0.3 } }));
  await c.start((i) => ({ pathLength: 1, opacity: 1, transition: { delay: i * 0.1, duration: 0.3 } }));
};
const chartStop = (c) => c.start('visible');
export const ChartColumnIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, chartStart, chartStop);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <motion.path animate={controls} custom={1} d="M13 17V9" initial="visible" variants={CHART_LINE_VARIANTS} />
        <motion.path animate={controls} custom={2} d="M18 17V5" initial="visible" variants={CHART_LINE_VARIANTS} />
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <motion.path animate={controls} custom={0} d="M8 17v-3" initial="visible" variants={CHART_LINE_VARIANTS} />
      </svg>
    </div>
  );
});
ChartColumnIcon.displayName = 'ChartColumnIcon';

// ── ClipboardCheck (Resumo diário) ──────────────────────────────────────────
const CHECK_VARIANTS = {
  normal: { pathLength: 1, opacity: 0, transition: { duration: 0.3 } },
  animate: { pathLength: [0, 1], opacity: [0, 1], transition: { pathLength: { duration: 0.3, ease: 'easeInOut' }, opacity: { duration: 0.3, ease: 'easeInOut' } } },
};
export const ClipboardCheckIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <rect height="4" rx="1" ry="1" width="8" x="8" y="2" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <motion.path animate={controls} d="m9 14 2 2 4-4" initial="normal" style={{ transformOrigin: 'center' }} variants={CHECK_VARIANTS} />
      </svg>
    </div>
  );
});
ClipboardCheckIcon.displayName = 'ClipboardCheckIcon';

// ── Bell (Notificações) ─────────────────────────────────────────────────────
const BELL_VARIANTS = {
  normal: { rotate: 0 },
  animate: { rotate: [0, -10, 10, -10, 0] },
};
export const BellIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <motion.svg {...SVG_BASE} width={size} height={size} animate={controls} transition={{ duration: 0.5, ease: 'easeInOut' }} variants={BELL_VARIANTS}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </motion.svg>
    </div>
  );
});
BellIcon.displayName = 'BellIcon';

// ── Bot (MCP) ───────────────────────────────────────────────────────────────
const BOT_EYE_VARIANTS = {
  normal: { y1: 13, y2: 15 },
  animate: { y1: [13, 14, 13], y2: [15, 14, 15], transition: { duration: 0.5, ease: 'easeInOut', delay: 0.2 } },
};
export const BotIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <path d="M12 8V4H8" />
        <rect height="12" rx="2" width="16" x="4" y="8" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <motion.line animate={controls} initial="normal" variants={BOT_EYE_VARIANTS} x1={15} x2={15} />
        <motion.line animate={controls} initial="normal" variants={BOT_EYE_VARIANTS} x1={9} x2={9} />
      </svg>
    </div>
  );
});
BotIcon.displayName = 'BotIcon';

// ── Folders (Projetos) ──────────────────────────────────────────────────────
const FOLDERS_SPRING = { type: 'spring', stiffness: 250, damping: 25 };
export const FoldersIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <motion.path animate={controls} d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z" transition={FOLDERS_SPRING} variants={{ normal: { translateX: 0, translateY: 0 }, animate: { translateX: -2, translateY: 2 } }} />
        <motion.path animate={controls} d="M2 8v11a2 2 0 0 0 2 2h14" transition={FOLDERS_SPRING} variants={{ normal: { translateX: 0, translateY: 0, opacity: 1, scale: 1 }, animate: { translateX: 2, translateY: -2, opacity: 0, scale: 0.9 } }} />
      </svg>
    </div>
  );
});
FoldersIcon.displayName = 'FoldersIcon';

// ── LayoutGrid (Etapas) ─────────────────────────────────────────────────────
const GRID_TIMING = { duration: 0.8, ease: 'easeInOut', times: [0, 0.4, 0.6, 1] };
const GRID_RECT_VARIANTS = [
  { normal: { translateX: 0, translateY: 0 }, animate: { translateX: [0, 11, 11, 0], translateY: [0, 0, 0, 0], transition: GRID_TIMING } },
  { normal: { translateX: 0, translateY: 0 }, animate: { translateX: [0, 0, 0, 0], translateY: [0, 11, 11, 0], transition: GRID_TIMING } },
  { normal: { translateX: 0, translateY: 0 }, animate: { translateX: [0, -11, -11, 0], translateY: [0, 0, 0, 0], transition: GRID_TIMING } },
  { normal: { translateX: 0, translateY: 0 }, animate: { translateX: [0, 0, 0, 0], translateY: [0, -11, -11, 0], transition: GRID_TIMING } },
];
export const LayoutGridIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={GRID_RECT_VARIANTS[0]} width="7" x="3" y="3" />
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={GRID_RECT_VARIANTS[1]} width="7" x="14" y="3" />
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={GRID_RECT_VARIANTS[2]} width="7" x="14" y="14" />
        <motion.rect animate={controls} height="7" initial="normal" rx="1" variants={GRID_RECT_VARIANTS[3]} width="7" x="3" y="14" />
      </svg>
    </div>
  );
});
LayoutGridIcon.displayName = 'LayoutGridIcon';

// ── Tag (Tipos de tarefa) — no animated upstream counterpart, so this swings
// the tag like a label hanging from its hole (origin at the eyelet ~30%/30%).
const TAG_VARIANTS = {
  normal: { rotate: 0 },
  animate: { rotate: [0, -12, 8, -5, 0] },
};
export const TagIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, startAnimate, stopNormal);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <motion.svg {...SVG_BASE} width={size} height={size} animate={controls} transition={{ duration: 0.6, ease: 'easeInOut' }} variants={TAG_VARIANTS} style={{ transformOrigin: '30% 30%' }}>
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
      </motion.svg>
    </div>
  );
});
TagIcon.displayName = 'TagIcon';

// ── PanelLeft (Recolher sidebar) ────────────────────────────────────────────
const PANEL_SPRING = { type: 'spring', stiffness: 250, damping: 16 };
const panelStart = async (c) => { await c.start('firstState'); await c.start('secondState'); };
const panelStop = (c) => c.start('normal');
export const PanelLeftIcon = forwardRef(({ onMouseEnter, onMouseLeave, className, size = 16, ...props }, ref) => {
  const { controls, handleMouseEnter, handleMouseLeave } = useAnimatedIcon(ref, onMouseEnter, onMouseLeave, panelStart, panelStop);
  return (
    <div className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg {...SVG_BASE} width={size} height={size}>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <motion.path animate={controls} d="M9 3v18" transition={PANEL_SPRING} variants={{ normal: { x: 0 }, firstState: { x: -3 }, secondState: { x: 0 } }} />
      </svg>
    </div>
  );
});
PanelLeftIcon.displayName = 'PanelLeftIcon';
