import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import {
  parseISO, isWithinInterval, startOfDay, endOfDay,
  subDays, startOfMonth, endOfMonth,
  format, eachDayOfInterval, eachWeekOfInterval, endOfWeek, min, max,
} from 'date-fns';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-bootstrap-icons/dist/icons/calendar';
import DateFilterModal from './DateFilterModal';

const STATUS_COLORS = { PLANNED: '#8b949e', DOING: '#f59e0b', DONE: '#10b981' };
const PRIORITY_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#8b949e' };
const TICK_STYLE = { fill: '#6b7280', fontSize: 11, fontFamily: 'var(--font-body)' };
const GRID_COLOR = 'rgba(255,255,255,0.05)';

const cardStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem',
};

const chartTitleStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginBottom: '1rem',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '0.5rem 0.75rem',
      fontFamily: 'var(--font-body)',
      fontSize: '0.82rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      {label && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.35rem', fontSize: '0.75rem' }}>{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', lineHeight: 1.6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color || entry.fill, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      {label}
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '1rem' }}>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

const PRESET_KEYS = ['7d', '30d', 'all'];

export default function ReportsView({ tasks, projects }) {
  const { t } = useTranslation();

  const PRESETS = [
    { key: '7d',  label: t('reports.preset7d')  },
    { key: '30d', label: t('reports.preset30d') },
    { key: 'all', label: t('reports.presetAll') },
  ];
  const [showDateModal, setShowDateModal]   = useState(false);
  const [preset, setPreset]                 = useState('30d');
  const [customRange, setCustomRange]       = useState([null, null]);

  // ── Lookup maps ──────────────────────────────────────────────────────────────
  const projectMap = useMemo(() => {
    const m = {};
    projects.forEach(p => { m[p.id] = p; });
    return m;
  }, [projects]);

  const taskTypeMap = useMemo(() => {
    const m = {};
    projects.forEach(p => {
      (p.taskTypes || []).forEach(tt => { m[tt.id] = { ...tt, projectColor: p.color }; });
    });
    return m;
  }, [projects]);

  // ── Date range ───────────────────────────────────────────────────────────────
  // Custom range takes priority over preset; preset 'all' → no filter (null)
  const dateRange = useMemo(() => {
    const [start, end] = customRange;
    if (start) return { start: startOfDay(start), end: endOfDay(end ?? start) };
    const now = new Date();
    if (preset === '7d')  return { start: startOfDay(subDays(now, 6)),  end: endOfDay(now) };
    if (preset === '30d') return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    if (preset === 'month') return { start: startOfMonth(now), end: endOfMonth(now) };
    return null; // 'all'
  }, [preset, customRange]);

  const isCustomActive = customRange[0] !== null;

  const handlePresetClick = (key) => {
    setPreset(key);
    setCustomRange([null, null]);
  };

  const handleCustomApply = (range) => {
    setCustomRange(range);
  };

  const filteredTasks = useMemo(() => {
    if (!dateRange) return tasks;
    return tasks.filter(task => {
      const d = parseISO(task.createdAt);
      return isWithinInterval(d, dateRange);
    });
  }, [tasks, dateRange]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const total    = filteredTasks.length;
  const done     = filteredTasks.filter(task => task.status === 'DONE').length;
  const doing    = filteredTasks.filter(task => task.status === 'DOING').length;
  const planned  = filteredTasks.filter(task => task.status === 'PLANNED').length;
  const rate     = total > 0 ? Math.round((done / total) * 100) : 0;

  // ── Chart 1: Status donut ────────────────────────────────────────────────────
  const statusData = [
    { name: t('kanban.planned'), value: planned, color: STATUS_COLORS.PLANNED },
    { name: t('kanban.doing'),   value: doing,   color: STATUS_COLORS.DOING   },
    { name: t('kanban.done'),    value: done,    color: STATUS_COLORS.DONE    },
  ].filter(d => d.value > 0);

  // ── Chart 2: Priority bars ───────────────────────────────────────────────────
  const priorityData = [
    { name: t('taskForm.priorityHigh'),   value: filteredTasks.filter(task => task.priority === 'HIGH').length,   color: PRIORITY_COLORS.HIGH   },
    { name: t('taskForm.priorityMedium'), value: filteredTasks.filter(task => task.priority === 'MEDIUM').length, color: PRIORITY_COLORS.MEDIUM },
    { name: t('taskForm.priorityLow'),    value: filteredTasks.filter(task => task.priority === 'LOW').length,    color: PRIORITY_COLORS.LOW    },
  ];

  // ── Chart 3: By project (stacked status) ─────────────────────────────────────
  const projectData = useMemo(() => {
    const map = {};
    filteredTasks.forEach(task => {
      const key = task.projectId ?? '__none__';
      if (!map[key]) {
        const p = task.projectId ? projectMap[task.projectId] : null;
        map[key] = { name: p?.name ?? t('reports.noProject'), color: p?.color ?? '#8b949e', PLANNED: 0, DOING: 0, DONE: 0 };
      }
      map[key][task.status]++;
    });
    return Object.values(map).sort((a, b) => (b.PLANNED + b.DOING + b.DONE) - (a.PLANNED + a.DOING + a.DONE));
  }, [filteredTasks, projectMap]);

  // ── Chart 4: By task type ────────────────────────────────────────────────────
  const typeData = useMemo(() => {
    const map = {};
    filteredTasks.forEach(task => {
      const key = task.taskTypeId ?? '__none__';
      if (!map[key]) {
        const tt = task.taskTypeId ? taskTypeMap[task.taskTypeId] : null;
        map[key] = { name: tt?.name ?? t('reports.noType'), color: tt?.projectColor ?? 'var(--accent)', value: 0 };
      }
      map[key].value++;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filteredTasks, taskTypeMap]);

  // ── Chart 5: Timeline ────────────────────────────────────────────────────────
  const timelineData = useMemo(() => {
    if (tasks.length === 0) return [];

    // Determine the display window
    let rangeStart, rangeEnd;
    if (dateRange) {
      rangeStart = dateRange.start;
      rangeEnd   = dateRange.end;
    } else {
      // 'all' — derive from actual task dates, capped at a readable span
      const dates = tasks.map(task => parseISO(task.createdAt));
      rangeStart = startOfDay(min(dates));
      rangeEnd   = endOfDay(max(dates));
    }

    const spanDays = Math.round((rangeEnd - rangeStart) / 86400000);
    const byWeek   = spanDays > 60;

    if (byWeek) {
      const weeks = eachWeekOfInterval({ start: rangeStart, end: rangeEnd }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const weekEnd = endOfDay(endOfWeek(weekStart, { weekStartsOn: 1 }));
        const bucket  = tasks.filter(task => {
          const d = parseISO(task.createdAt);
          return isWithinInterval(d, { start: weekStart, end: weekEnd });
        });
        return {
          date:  format(weekStart, "dd/MM"),
          total: bucket.length,
          done:  bucket.filter(task => task.status === 'DONE').length,
        };
      });
    }

    return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(day => {
      const bucket = tasks.filter(task => {
        const d = parseISO(task.createdAt);
        return isWithinInterval(d, { start: startOfDay(day), end: endOfDay(day) });
      });
      return {
        date:  format(day, "dd/MM"),
        total: bucket.length,
        done:  bucket.filter(task => task.status === 'DONE').length,
      };
    });
  }, [tasks, dateRange]);

  const projBarHeight = Math.max(200, projectData.length * 44);
  const typeBarHeight = Math.max(200, typeData.length * 38);

  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingRight: '0.25rem' }}>

      {/* ── Date filter bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {PRESETS.map(opt => {
          const active = !isCustomActive && preset === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handlePresetClick(opt.key)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
                background: active ? 'var(--accent-subtle)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all var(--transition)',
                outline: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          );
        })}

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', flexShrink: 0 }} />

        {/* Custom date range button */}
        <button
          onClick={() => setShowDateModal(true)}
          title={t('dashboard.filterByDate')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            fontSize: '0.82rem',
            fontWeight: isCustomActive ? 600 : 400,
            color: isCustomActive ? 'var(--accent)' : 'var(--text-muted)',
            backgroundColor: isCustomActive ? 'var(--accent-subtle)' : 'transparent',
            border: `1px solid ${isCustomActive ? 'var(--accent)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all var(--transition)',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        >
          <Calendar size={13} />
          {customRange[0]
            ? (customRange[1]
                ? `${format(customRange[0], 'dd/MM')} - ${format(customRange[1], 'dd/MM')}`
                : format(customRange[0], 'dd/MM/yyyy'))
            : t('dashboard.filterByDate')}
        </button>
      </div>

      <DateFilterModal
        show={showDateModal}
        handleClose={() => setShowDateModal(false)}
        onApplyFilter={handleCustomApply}
        initialDateRange={customRange}
      />

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <KpiCard label={t('reports.kpiTotal')}      value={total}        color="var(--text-primary)"   />
        <KpiCard label={t('kanban.planned')}         value={planned}      color={STATUS_COLORS.PLANNED} />
        <KpiCard label={t('kanban.doing')}           value={doing}        color={STATUS_COLORS.DOING}   />
        <KpiCard label={t('kanban.done')}            value={done}         color={STATUS_COLORS.DONE}    />
        <KpiCard label={t('reports.kpiCompletion')} value={`${rate}%`}   color="var(--accent)"         />
      </div>

      {/* ── Row 1: Status donut + Priority bars ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

        {/* Status donut */}
        <div style={cardStyle}>
          <div style={chartTitleStyle}>{t('reports.chartByStatus')}</div>
          {statusData.length === 0 ? <EmptyState label={t('reports.emptyState')} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority */}
        <div style={cardStyle}>
          <div style={chartTitleStyle}>{t('reports.chartByPriority')}</div>
          {total === 0 ? <EmptyState label={t('reports.emptyState')} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name={t('reports.tasks')} radius={[4, 4, 0, 0]} maxBarSize={64}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 2: By project + By type ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

        {/* By project */}
        <div style={cardStyle}>
          <div style={chartTitleStyle}>Por Projeto</div>
          {projectData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={projBarHeight}>
              <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} width={88} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
                <Bar dataKey="PLANNED" name="Planejado"    stackId="s" fill={STATUS_COLORS.PLANNED} maxBarSize={28} />
                <Bar dataKey="DOING"   name="Em Progresso" stackId="s" fill={STATUS_COLORS.DOING}   maxBarSize={28} />
                <Bar dataKey="DONE"    name="Feito"        stackId="s" fill={STATUS_COLORS.DONE}    maxBarSize={28} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By task type */}
        <div style={cardStyle}>
          <div style={chartTitleStyle}>Por Tipo de Tarefa</div>
          {typeData.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={typeBarHeight}>
              <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} horizontal={false} />
                <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={TICK_STYLE} axisLine={false} tickLine={false} width={88} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Tarefas" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Timeline — full width ────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: '1rem' }}>
        <div style={chartTitleStyle}>
          Tarefas ao longo do tempo
          {!dateRange && timelineData.length > 60 && (
            <span style={{ marginLeft: '0.5rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              · agrupado por semana
            </span>
          )}
        </div>
        {timelineData.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="date" tick={TICK_STYLE} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
              <Area type="monotone" dataKey="total" name="Criadas"    stroke="#10b981" fill="url(#gradTotal)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="done"  name="Concluídas" stroke="#f59e0b" fill="url(#gradDone)"  strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
