import React, { useMemo, useState } from 'react';
import { useAdminQuery, fmt } from '../useAdminQuery';
import { Card, Loading, ErrorBox } from '../Shared';
import { thStyle, tdStyle, numStyle } from '../tableStyles';

const COLUMNS = [
  { key: 'name', label: 'Usuário', num: false },
  { key: 'activeDays30', label: 'Dias ativos (30d)', num: true },
  { key: 'activeDaysTotal', label: 'Dias ativos (total)', num: true },
  { key: 'tasks', label: 'Tasks', num: true },
  { key: 'lastSeen', label: 'Último acesso', num: false },
  { key: 'createdAt', label: 'Cadastro', num: false },
  { key: 'country', label: 'País', num: false },
  { key: 'method', label: 'Login', num: false },
];

export default function UsersSection() {
  const { data, loading, error } = useAdminQuery('/admin/analytics/users', { limit: 100 });
  const [sort, setSort] = useState({ key: 'activeDays30', dir: -1 });
  const [filter, setFilter] = useState('');

  const rows = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    const filtered = q ? data.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) : data;
    return [...filtered].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * sort.dir;
    });
  }, [data, sort, filter]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: -1 }));

  return (
    <Card title="Quem mais usa">
      <input
        placeholder="Filtrar por nome ou e-mail"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ width: '100%', maxWidth: 320, marginBottom: '0.75rem', padding: '0.45rem 0.7rem', fontSize: '0.85rem', fontFamily: 'inherit', color: 'var(--text-primary)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 32 }}>#</th>
              {COLUMNS.map((c) => (
                <th key={c.key} onClick={() => toggle(c.key)} style={{ ...thStyle, cursor: 'pointer', textAlign: c.num ? 'right' : 'left', color: sort.key === c.key ? 'var(--accent)' : thStyle.color }}>
                  {c.label}{sort.key === c.key ? (sort.dir < 0 ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={u.id}>
                <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{i + 1}</td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </td>
                <td style={numStyle}>{fmt.int(u.activeDays30)}</td>
                <td style={numStyle}>{fmt.int(u.activeDaysTotal)}</td>
                <td style={numStyle}>{fmt.int(u.tasks)}</td>
                <td style={tdStyle}>{fmt.date(u.lastSeen)}</td>
                <td style={tdStyle}>{fmt.date(u.createdAt)}</td>
                <td style={tdStyle}>{u.country || '–'}</td>
                <td style={tdStyle}>{u.method}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={COLUMNS.length + 1} style={{ ...tdStyle, color: 'var(--text-muted)' }}>Nenhum usuário encontrado</td></tr>}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        "Dias ativos" conta dias com pelo menos uma chamada autenticada à API. Histórico começa quando este painel foi publicado.
      </div>
    </Card>
  );
}
