import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { toast } from 'sonner';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import googleLogo from '../assets/google-icon.svg';
import CssParticles from '../components/CssParticles';
import LanguageSelector from '../components/LanguageSelector';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event) => {
      const apiOrigin = new URL(api.defaults.baseURL).origin;
      if (event.origin !== apiOrigin) return;

      const { token, refreshToken, error } = event.data;
      if (token) {
        localStorage.setItem('authToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        toast.success(t('login.googleSuccessToast'));
        navigate('/dashboard');
      } else if (error) {
        toast.error(t('login.googleErrorToast'));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.emptyFieldsError'));
      return;
    }
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      const pendingToken = sessionStorage.getItem('pendingInviteToken');
      if (pendingToken) {
        try {
          await api.post(`/api/workspaces/invite/${pendingToken}/accept`, {}, { _silent: true });
        } catch { /* ignore */ }
        sessionStorage.removeItem('pendingInviteToken');
      }
      toast.success(t('login.successToast'));
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || t('login.invalidCredentials');
      toast.error(msg);
    }
  };

  const handleGoogleLogin = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      `${api.defaults.baseURL}/auth/google`,
      'googleLogin',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <CssParticles />

      <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10 }}><LanguageSelector variant="navbar" /></div>

      {/* Subtle gradient orb */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-15%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="animate-fade-in-up delay-1" style={{ width: '100%', maxWidth: '380px', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            letterSpacing: '-0.5px'
          }}>
            DailyTracker
          </Link>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {t('login.subtitle')}
          </p>
        </div>

        <div style={{
          padding: '2rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('login.emailLabel')}</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('login.passwordLabel')}</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button
              type="submit"
              className="w-100 py-2"
              style={{
                backgroundColor: 'var(--accent)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {t('login.submitButton')}
            </Button>
          </Form>
        </div>

        <div style={{ margin: '1.25rem 0' }}>
          <div className="d-flex align-items-center">
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <span style={{ margin: '0 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('common.or')}</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          </div>
        </div>

        <Button
          variant="outline-light"
          onClick={handleGoogleLogin}
          className="w-100 py-2 d-flex align-items-center justify-content-center"
          aria-label="Entrar com sua conta do Google"
          style={{
            border: '1px solid var(--border-default)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <img src={googleLogo} alt="" aria-hidden="true" width="16" height="16" loading="lazy" style={{ marginRight: 8 }} />
          {t('login.googleButton')}
        </Button>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          {t('login.noAccount')}{' '}
          <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{t('login.createAccount')}</Link>
        </p>
      </div>
    </div>
  );
}
