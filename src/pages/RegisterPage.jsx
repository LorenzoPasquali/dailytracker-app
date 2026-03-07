import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Google } from 'react-bootstrap-icons';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';

import ParticlesBackground from '../components/ParticlesBackground';
import googleLogo from '../assets/google-icon.svg';

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
      setError('As senhas não coincidem.');
      return;
    }

    try {
      await api.post('/auth/register', { email, password });
      const loginResponse = await api.post('/auth/login', { email, password });
      if (loginResponse.data?.token) {
        localStorage.setItem('authToken', loginResponse.data.token);
      }
      setSuccess('Conta criada com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Erro ao registrar. O email pode já estar em uso.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  };

  const darkInputStyle = {
    backgroundColor: '#0d1117',
    color: 'white',
    borderColor: '#252b31ff'
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <ParticlesBackground variant="home" />

      <div className="d-block d-md-none">
        <Container fluid className="d-flex flex-column align-items-center justify-content-center text-light" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
          <h1 className="text-center mb-4 fs-3 fw-normal">Criar conta no DailyTracker</h1>
          <div style={{ width: '100%', maxWidth: '350px', padding: '2rem', backgroundColor: 'rgba(22, 27, 34, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', borderRadius: '12px' }}>
            <Form onSubmit={handleRegister}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={darkInputStyle} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Senha</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={darkInputStyle} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Confirmar Senha</Form.Label>
                <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={darkInputStyle} />
              </Form.Group>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="d-grid gap-2">
                <Button variant="success" type="submit">Criar conta</Button>
              </div>
            </Form>
          </div>

          <div className="text-center mt-3" style={{ maxWidth: '350px', width: '100%' }}>
            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1 border-secondary" />
              <span className="mx-2 text-secondary">ou</span>
              <hr className="flex-grow-1 border-secondary" />
            </div>
            <Button variant="outline-light" onClick={handleGoogleLogin} className="w-100 py-2 d-flex align-items-center justify-content-center">
              <img src={googleLogo} alt="Google" style={{ width: 18, marginRight: 8 }} />
              Registrar com Google
            </Button>
          </div>

          <div className="text-center mt-4 p-3 border border-secondary" style={{ maxWidth: '350px', width: '100%', borderRadius: '6px' }}>
            Já tem uma conta? <Link to="/login" className="text-primary text-decoration-none">Entrar</Link>
          </div>
        </Container>
      </div>

      <div className="d-none d-md-flex" style={{ position: 'relative', zIndex: 1, height: '100vh', width: '100%' }}>
        <div className="flex-column text-start text-light" style={{ flex: 1, padding: '3rem', justifyContent: 'flex-center', paddingTop: '10rem' }}>
          <h1 className="fw-bold fs-2 mb-2">Crie sua conta de graça</h1>
          <p className="fs-6 mb-0" style={{ color: '#b0b0b0' }}>
            Organize suas Dailies, simplifique seu dia e mantenha tudo sob controle.
          </p>
        </div>

        <div className="d-flex flex-column justify-content-center align-items-center" style={{ flex: 1, background: 'rgba(13, 17, 23, 0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderLeft: '1px solid rgba(59, 130, 246, 0.2)', minHeight: '100vh', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <Form onSubmit={handleRegister}>
              <div className="text-center mb-3">
                <p className="fw-semibold text-light text-start mb-1 fs-5">Inscreva-se no DailyTracker</p>
              </div>
              <Button variant="outline-light" onClick={handleGoogleLogin} className="w-100 d-flex align-items-center justify-content-center mb-3" style={{ padding: '0.6rem' }}>
                <img src={googleLogo} alt="Google" style={{ width: 18, marginRight: 8 }} />
                Registrar com Google
              </Button>
              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1 border-secondary" />
                <span className="mx-2 text-secondary" style={{ fontSize: '0.8em' }}>ou</span>
                <hr className="flex-grow-1 border-secondary" />
              </div>
              <Form.Group className="mb-3">
                <Form.Label className="text-light fw-semibold" style={{ fontSize: '0.9em' }}>Email*</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={darkInputStyle} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="text-light fw-semibold" style={{ fontSize: '0.9em' }}>Senha*</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={darkInputStyle} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="text-light fw-semibold" style={{ fontSize: '0.9em' }}>Confirmar Senha</Form.Label>
                <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={darkInputStyle} />
              </Form.Group>

              {error && <Alert variant="danger" className="mt-3 p-2 text-center" style={{ fontSize: '0.9em' }}>{error}</Alert>}
              {success && <Alert variant="success" className="mt-3 p-2 text-center" style={{ fontSize: '0.9em' }}>{success}</Alert>}

              <div className="d-grid gap-2 mt-4">
                <Button variant="success" type="submit" className="py-2">Criar conta</Button>
              </div>
            </Form>
            <div className="mt-4 p-3 rounded" style={{ border: '1px solid rgba(48, 54, 61, 0.5)', fontSize: '0.9em', background: 'rgba(33, 38, 45, 0.6)', backdropFilter: 'blur(8px)' }}>
              <p className="text-secondary mb-0 text-center">Já tem uma conta? <Link to="/login" className="text-primary text-decoration-none">Entrar</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}