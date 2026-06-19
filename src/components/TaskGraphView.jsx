import React, { useMemo, useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTranslation } from 'react-i18next';

// Obsidian-style force graph of tasks. Tasks have no task→task links in the data
// model, so connections are DERIVED: each enabled "dimension" (project, stage,
// priority, type, assignee, due date) becomes a hub node, and every task links
// to the hub it belongs to. The force layout then clusters tasks that share a
// hub. Toggling a dimension adds/removes that family of hubs + edges.

const PRIORITY_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#6b7280' };

// Due-date buckets (stable, palette-independent so buildGraph stays pure).
const DUE_COLORS = {
  overdue: '#ef4444',
  today: '#f59e0b',
  week: '#10b981',
  later: '#3b82f6',
  none: '#6b7280',
};

const ALL_DIMS = ['project', 'stage', 'priority', 'type', 'assignee', 'dueDate'];
const DEFAULT_DIMS = ['project', 'stage', 'priority'];
const STORAGE_KEY = 'graphDimensions';

// Deterministic hue from a string → stable color for assignee hubs.
function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360}, 60%, 55%)`;
}

function dueBucket(dueDate, now) {
  if (!dueDate) return 'none';
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 'none';
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday); endOfToday.setHours(23, 59, 59, 999);
  if (due < startOfToday) return 'overdue';
  if (due <= endOfToday) return 'today';
  const weekEnd = new Date(endOfToday); weekEnd.setDate(weekEnd.getDate() + 7);
  if (due <= weekEnd) return 'week';
  return 'later';
}

// Pure: builds { nodes, links } for the enabled dimensions. `labels` carries the
// already-translated hub captions (priorities, due buckets, fallbacks).
function buildGraph(tasks, projects, stages, dims, labels) {
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const stageMap = new Map(stages.map(s => [s.id, s]));
  const taskTypeMap = new Map();
  projects.forEach(p => (p.taskTypes || []).forEach(tt => {
    taskTypeMap.set(tt.id, { name: tt.name, color: tt.color || p.color });
  }));

  const enabled = new Set(dims);
  const hubs = new Map();   // id → node
  const links = [];
  const now = Date.now();

  const ensureHub = (id, label, color, dim) => {
    let hub = hubs.get(id);
    if (!hub) { hub = { id, kind: 'hub', dim, label, color, count: 0 }; hubs.set(id, hub); }
    hub.count += 1;
    return hub;
  };

  const nodes = tasks.map(task => {
    const node = {
      id: `task:${task.id}`,
      kind: 'task',
      label: task.title,
      color: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM,
      task,
    };

    if (enabled.has('project') && task.projectId != null) {
      const p = projectMap.get(task.projectId);
      const hub = ensureHub(`hub:project:${task.projectId}`, p?.name || labels.project, p?.color || '#8b5cf6', 'project');
      links.push({ source: node.id, target: hub.id });
    }
    if (enabled.has('stage') && task.stageId != null) {
      const s = stageMap.get(task.stageId) || task.stage;
      const hub = ensureHub(`hub:stage:${task.stageId}`, s?.name || labels.stage, s?.color || '#6b7280', 'stage');
      links.push({ source: node.id, target: hub.id });
    }
    if (enabled.has('priority')) {
      const pr = task.priority || 'MEDIUM';
      const hub = ensureHub(`hub:priority:${pr}`, labels.priority[pr] || pr, PRIORITY_COLORS[pr] || PRIORITY_COLORS.MEDIUM, 'priority');
      links.push({ source: node.id, target: hub.id });
    }
    if (enabled.has('type') && task.taskTypeId != null) {
      const tt = taskTypeMap.get(task.taskTypeId);
      const hub = ensureHub(`hub:type:${task.taskTypeId}`, tt?.name || labels.type, tt?.color || '#06b6d4', 'type');
      links.push({ source: node.id, target: hub.id });
    }
    if (enabled.has('assignee')) {
      const key = task.assigneeId != null ? `id:${task.assigneeId}` : `name:${task.assigneeName || 'none'}`;
      const name = task.assigneeName || labels.assignee;
      const hub = ensureHub(`hub:assignee:${key}`, name, hashColor(name), 'assignee');
      links.push({ source: node.id, target: hub.id });
    }
    if (enabled.has('dueDate')) {
      const bucket = dueBucket(task.dueDate, now);
      const hub = ensureHub(`hub:due:${bucket}`, labels.due[bucket], DUE_COLORS[bucket], 'dueDate');
      links.push({ source: node.id, target: hub.id });
    }

    return node;
  });

  return { nodes: [...nodes, ...hubs.values()], links };
}

const nodeRadius = (node) =>
  node.kind === 'hub' ? Math.min(5 + Math.sqrt(node.count) * 1.6, 16) : 3.5;

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => (cs.getPropertyValue(name).trim() || fallback);
  return {
    bg: v('--bg-base', '#050505'),
    surface: v('--bg-surface', '#0e0e10'),
    text: v('--text-primary', '#fafafa'),
    textMuted: v('--text-muted', '#a1a1aa'),
    accent: v('--accent', '#10b981'),
    border: v('--border-default', '#222225'),
  };
}

const DIM_META = [
  { key: 'project',  i18n: 'graph.dimProject' },
  { key: 'stage',    i18n: 'graph.dimStage' },
  { key: 'priority', i18n: 'graph.dimPriority' },
  { key: 'type',     i18n: 'graph.dimType' },
  { key: 'assignee', i18n: 'graph.dimAssignee' },
  { key: 'dueDate',  i18n: 'graph.dimDueDate' },
];

export default function TaskGraphView({ tasks = [], projects = [], stages = [], onEditTask, isMobile }) {
  const { t } = useTranslation();
  const fgRef = useRef(null);
  const wrapRef = useRef(null);

  const [dims, setDims] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) return saved.filter(d => ALL_DIMS.includes(d));
    } catch { /* ignore */ }
    return DEFAULT_DIMS;
  });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [palette, setPalette] = useState(() => readPalette());
  const [highlightNodes, setHighlightNodes] = useState(() => new Set());
  const [highlightLinks, setHighlightLinks] = useState(() => new Set());
  const [pinned, setPinned] = useState(null); // hub id whose cluster stays highlighted

  const toggleDim = (key) => {
    setDims(prev => {
      const next = prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Translated hub captions handed to the pure builder.
  const labels = useMemo(() => ({
    project: t('graph.unknownProject'),
    stage: t('graph.unknownStage'),
    type: t('graph.unknownType'),
    assignee: t('graph.unassigned'),
    priority: { HIGH: t('graph.priorityHigh'), MEDIUM: t('graph.priorityMedium'), LOW: t('graph.priorityLow') },
    due: {
      overdue: t('graph.dueOverdue'), today: t('graph.dueToday'),
      week: t('graph.dueWeek'), later: t('graph.dueLater'), none: t('graph.dueNone'),
    },
  }), [t]);

  const graphData = useMemo(
    () => buildGraph(tasks, projects, stages, dims, labels),
    [tasks, projects, stages, dims, labels]
  );

  // Adjacency for hover/click highlighting (rebuilt only when graph changes).
  const adjacency = useMemo(() => {
    const map = new Map();
    graphData.nodes.forEach(n => map.set(n.id, new Set()));
    graphData.links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const tg = typeof l.target === 'object' ? l.target.id : l.target;
      map.get(s)?.add(tg);
      map.get(tg)?.add(s);
    });
    return map;
  }, [graphData]);

  // ── Container sizing ──────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Theme palette tracking ────────────────────────────────────────────────
  useEffect(() => {
    const obs = new MutationObserver(() => setPalette(readPalette()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  // ── Forces: spread hubs apart, give tasks breathing room ──────────────────
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3Force('charge')?.strength(-90).distanceMax(400);
    fg.d3Force('link')?.distance(link => {
      const s = link.source, tg = link.target;
      const hubDeg = (s.kind === 'hub' ? s.count : 0) + (tg.kind === 'hub' ? tg.count : 0);
      return 30 + Math.min(hubDeg, 40); // busier hubs push their tasks further out
    });
  }, [graphData]);

  const focusGraph = useCallback(() => {
    fgRef.current?.zoomToFit(400, 60);
  }, []);

  const computeHighlight = useCallback((nodeId) => {
    const nodes = new Set();
    const links = new Set();
    if (nodeId && adjacency.has(nodeId)) {
      nodes.add(nodeId);
      adjacency.get(nodeId).forEach(n => nodes.add(n));
      graphData.links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const tg = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === nodeId || tg === nodeId) links.add(l);
      });
    }
    return { nodes, links };
  }, [adjacency, graphData]);

  const handleHover = useCallback((node) => {
    if (pinned) return; // a pinned cluster overrides hover
    const { nodes, links } = computeHighlight(node?.id);
    setHighlightNodes(nodes);
    setHighlightLinks(links);
  }, [computeHighlight, pinned]);

  const handleClick = useCallback((node) => {
    if (!node) return;
    if (node.kind === 'task') {
      onEditTask?.(node.task);
      return;
    }
    // Hub click → pin/unpin its cluster + center on it.
    if (pinned === node.id) {
      setPinned(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    } else {
      const { nodes, links } = computeHighlight(node.id);
      setPinned(node.id);
      setHighlightNodes(nodes);
      setHighlightLinks(links);
      fgRef.current?.centerAt(node.x, node.y, 600);
      fgRef.current?.zoom(2.2, 600);
    }
  }, [computeHighlight, onEditTask, pinned]);

  const handleBackgroundClick = useCallback(() => {
    setPinned(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  }, []);

  // Clear a stale pin when the underlying graph changes (dimension toggled).
  useEffect(() => {
    setPinned(null);
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  }, [graphData]);

  // ── Canvas painters ───────────────────────────────────────────────────────
  const paintNode = useCallback((node, ctx, scale) => {
    const isHub = node.kind === 'hub';
    const r = nodeRadius(node);
    const dim = highlightNodes.size > 0 && !highlightNodes.has(node.id);
    ctx.globalAlpha = dim ? 0.12 : 1;

    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();
    if (isHub) {
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeStyle = palette.bg;
      ctx.stroke();
    }
    if (pinned && pinned === node.id) {
      ctx.lineWidth = 2 / scale;
      ctx.strokeStyle = palette.accent;
      ctx.stroke();
    }

    const showLabel = isHub ? scale > 0.55 : (scale > 2.4 || highlightNodes.has(node.id));
    if (showLabel && node.label) {
      const fontSize = (isHub ? 11 : 9) / scale;
      ctx.font = `${isHub ? 600 : 400} ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isHub ? palette.text : palette.textMuted;
      const label = node.label.length > 28 ? node.label.slice(0, 27) + '…' : node.label;
      ctx.fillText(label, node.x, node.y + r + 1.5 / scale);
    }
    ctx.globalAlpha = 1;
  }, [highlightNodes, palette, pinned]);

  const paintPointerArea = useCallback((node, color, ctx) => {
    const r = nodeRadius(node) + 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const linkColor = useCallback((link) => {
    if (highlightLinks.size === 0) return palette.border;
    return highlightLinks.has(link) ? palette.accent : 'rgba(127,127,127,0.05)';
  }, [highlightLinks, palette]);

  const linkWidth = useCallback((link) => (highlightLinks.has(link) ? 1.5 : 0.5), [highlightLinks]);

  const isEmpty = tasks.length === 0;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
      {/* Toolbar: dimension toggles + reset */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        flexWrap: 'wrap', padding: isMobile ? '0.5rem' : '0.25rem 0.5rem',
      }}>
        {DIM_META.map(({ key, i18n }) => {
          const on = dims.includes(key);
          return (
            <button
              key={key}
              className="press-effect"
              onClick={() => toggleDim(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: 500,
                color: on ? 'var(--text-primary)' : 'var(--text-muted)',
                backgroundColor: on ? 'var(--bg-active)' : 'transparent',
                border: `1px solid ${on ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all var(--transition)',
                outline: 'none', fontFamily: 'inherit',
              }}
            >
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: on ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0,
              }} />
              {t(i18n)}
            </button>
          );
        })}
        <button
          className="press-effect"
          onClick={focusGraph}
          title={t('graph.resetView')}
          style={{
            marginLeft: 'auto', padding: '0.25rem 0.7rem', fontSize: '0.78rem', fontWeight: 500,
            color: 'var(--text-secondary)', backgroundColor: 'transparent',
            border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', whiteSpace: 'nowrap', outline: 'none', fontFamily: 'inherit',
          }}
        >
          {t('graph.resetView')}
        </button>
      </div>

      {isEmpty ? (
        <div style={{
          height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: '0.9rem',
        }}>
          {t('graph.empty')}
        </div>
      ) : (
        <ForceGraph2D
          ref={fgRef}
          width={size.width || undefined}
          height={size.height || undefined}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          nodeRelSize={4}
          nodeLabel={node => (node.kind === 'task' ? node.label : `${node.label} · ${node.count}`)}
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => 'replace'}
          nodePointerAreaPaint={paintPointerArea}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkDirectionalParticles={0}
          cooldownTicks={120}
          onEngineStop={focusGraph}
          onNodeHover={handleHover}
          onNodeClick={handleClick}
          onBackgroundClick={handleBackgroundClick}
          onNodeDragEnd={node => { node.fx = node.x; node.fy = node.y; }}
          enableNodeDrag
        />
      )}
    </div>
  );
}
