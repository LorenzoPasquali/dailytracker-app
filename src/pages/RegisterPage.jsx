import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';

import googleLogo from '../assets/google-icon.svg';
import CssParticles from '../components/CssParticles';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    try {
      await api.post('/auth/register', { email, password });
      const loginResponse = await api.post('/auth/login', { email, password });
      if (loginResponse.data?.token) {
        localStorage.setItem('authToken', loginResponse.data.token);
      }
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError('Erro ao registrar. O email pode ja estar em uso.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-base)',
      overflow: 'hidden'
    }}>
      <CssParticles />

      {/* Subtle gradient orb */}
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Mobile layout */}
      <div className="d-block d-md-none" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              textDecoration: 'none'
            }}>
              DailyTracker
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Crie sua conta
            </p>
          </div>

          <div style={{
            padding: '2rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <Form onSubmit={handleRegister}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Senha</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Confirmar Senha</Form.Label>
                <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </Form.Group>
              {error && <Alert variant="danger" className="py-2" style={{ fontSize: '0.85rem' }}>{error}</Alert>}
              {success && <Alert variant="success" className="py-2" style={{ fontSize: '0.85rem' }}>{success}</Alert>}
              <Button type="submit" className="w-100 py-2" style={{
                backgroundColor: 'var(--accent)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)'
              }}>
                Criar conta
              </Button>
            </Form>
          </div>

          <div style={{ margin: '1.25rem 0' }}>
            <div className="d-flex align-items-center">
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <span style={{ margin: '0 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>ou</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            </div>
          </div>

          <Button variant="outline-light" onClick={handleGoogleLogin} className="w-100 py-2 d-flex align-items-center justify-content-center" style={{
            border: '1px solid var(--border-default)',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-md)'
          }}>
            <img src={googleLogo} alt="Google" style={{ width: 16, marginRight: 8 }} />
            Registrar com Google
          </Button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Ja tem uma conta? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Entrar</Link>
          </p>
        </div>
      </div>

      {/* Desktop layout — split screen */}
      <div className="d-none d-md-flex" style={{ position: 'relative', zIndex: 1, height: '100vh', width: '100%' }}>
        {/* Left side — branding */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '4rem',
          position: 'relative'
        }}>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            letterSpacing: '-0.5px'
          }}>
            DailyTracker
          </Link>
          <div className="animate-fade-in-up delay-1">
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
              lineHeight: 1.15,
              marginBottom: '1rem'
            }}>
              Crie sua conta{' '}
              <span style={{ color: 'var(--accent)' }}>gratuitamente</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '400px', lineHeight: 1.7 }}>
              Organize suas dailies, simplifique seu dia e mantenha tudo sob controle.
            </p>
          </div>
        </div>

        {/* Right side — form */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          padding: '2rem'
        }}>
          <div className="animate-fade-in-up delay-2" style={{ width: '100%', maxWidth: '400px' }}>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '1.5rem',
              letterSpacing: '-0.3px'
            }}>
              Inscreva-se no DailyTracker
            </p>

            <Button variant="outline-light" onClick={handleGoogleLogin} className="w-100 d-flex align-items-center justify-content-center mb-3" style={{
              padding: '0.65rem',
              border: '1px solid var(--border-default)',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <img src={googleLogo} alt="Google" style={{ width: 16, marginRight: 8 }} />
              Registrar com Google
            </Button>

            <div className="d-flex align-items-center my-3">
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <span style={{ margin: '0 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>ou</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            </div>

            <Form onSubmit={handleRegister}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Senha</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Confirmar Senha</Form.Label>
                <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </Form.Group>
              {error && <Alert variant="danger" className="py-2" style={{ fontSize: '0.85rem' }}>{error}</Alert>}
              {success && <Alert variant="success" className="py-2" style={{ fontSize: '0.85rem' }}>{success}</Alert>}
              <Button type="submit" className="w-100 py-2 mt-1" style={{
                backgroundColor: 'var(--accent)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)'
              }}>
                Criar conta
              </Button>
            </Form>

            <p style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              padding: '1rem',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)'
            }}>
              Ja tem uma conta? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
