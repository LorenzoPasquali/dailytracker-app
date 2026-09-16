import React, { useState } from 'react';
import adminApi, { ADMIN_TOKEN_KEY } from '../../services/adminApi';

export default function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi.post('/admin/login', { password });
      sessionStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
      onSuccess();
    } catch (err) {
      const status = err.response?.status;
      setError(status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : 'Senha incorreta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-base)', padding: '1rem' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Painel interno
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%', padding: '0.7rem 0.85rem', fontSize: '0.95rem', fontFamily: 'var(--font-body)',
            color: 'var(--text-primary)', background: 'var(--bg-surface)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md)', outline: 'none',
          }}
        />
        {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</div>}
        <button type="submit" disabled={busy || !password} style={{
          marginTop: '0.75rem', width: '100%', padding: '0.7rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-md)',
          cursor: busy ? 'wait' : 'pointer', opacity: busy || !password ? 0.7 : 1,
        }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
