import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Button } from 'react-bootstrap';
import { toast } from 'sonner';
import api from '../services/api';

export default function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAuthenticated = !!localStorage.getItem('authToken');

  useEffect(() => {
    const init = async () => {
      try {
        if (isAuthenticated) {
          // Authenticated: accept immediately
          await api.post(`/api/workspaces/invite/${token}/accept`, {}, { _silent: true });
          toast.success('Você entrou no workspace!');
          navigate('/dashboard');
        } else {
          // Not authenticated: show preview
          const res = await api.get(`/api/workspaces/invite/${token}`, { _silent: true });
          setPreview(res.data);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Link de convite inválido ou expirado.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const handleAuthRedirect = (path) => {
    sessionStorage.setItem('pendingInviteToken', token);
    navigate(path);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--bg-base)'
      }}>
        <Spinner animation="border" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-base)',
      padding: '1rem',
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}>
          DailyTracker
        </div>

        {error ? (
          <div>
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => navigate('/')}
            >
              Ir para página inicial
            </Button>
          </div>
        ) : preview ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              Você foi convidado para:
            </p>
            <p style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.25rem',
            }}>
              {preview.workspaceName}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.75rem' }}>
              por {preview.creatorEmail}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button
                size="sm"
                onClick={() => handleAuthRedirect('/register')}
                style={{
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                  color: 'var(--bg-base)',
                  fontWeight: 600,
                }}
              >
                Criar conta
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => handleAuthRedirect('/login')}
              >
                Fazer login
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
