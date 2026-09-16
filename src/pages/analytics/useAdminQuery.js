import { useEffect, useState } from 'react';
import adminApi from '../../services/adminApi';

/** Fetch-on-mount hook for admin endpoints. Re-runs when `params` change (stringified). */
export function useAdminQuery(url, params) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const key = JSON.stringify(params || {});

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    adminApi.get(url, { params })
      .then((res) => { if (!cancelled) setState({ data: res.data, loading: false, error: null }); })
      .catch((err) => {
        if (cancelled) return;
        const msg = err.response?.data?.message || err.message || 'Falha ao carregar';
        setState({ data: null, loading: false, error: msg });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key]);

  return state;
}

export const fmt = {
  int: (n) => (n == null ? '–' : new Intl.NumberFormat('pt-BR').format(n)),
  pct: (x, digits = 1) => (x == null ? '–' : `${(x * 100).toFixed(digits)}%`),
  pct100: (x, digits = 0) => (x == null ? '–' : `${Number(x).toFixed(digits)}%`),
  day: (iso) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : ''),
  date: (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '–'),
  delta: (cur, prev) => {
    if (prev == null || cur == null) return null;
    if (prev === 0) return cur === 0 ? '0%' : 'novo';
    const d = ((cur - prev) / prev) * 100;
    return `${d >= 0 ? '+' : ''}${d.toFixed(0)}% vs. período anterior`;
  },
};
