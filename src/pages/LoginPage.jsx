import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import ParticlesBackground from '../components/ParticlesBackground';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

import googleLogo from '../assets/google-icon.svg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event) => {
      const apiOrigin = new URL(api.defaults.baseURL).origin;
      if (event.origin !== apiOrigin) {
        return;
      }

      const { token, error } = event.data;

      if (token) {
        localStorage.setItem('authToken', token);
        navigate('/dashboard');
      } else if (error) {
        setError('Falha na autenticação com o Google.');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, preencha o email e a senha.');
      return;
    }
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;
      localStorage.setItem('authToken', token);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciais inválidas. Por favor, tente novamente.');
    }
  };

  const handleGoogleLogin = () => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const url = `${api.defaults.baseURL}/auth/google`;

    window.open(
      url,
      'googleLogin',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ParticlesBackground variant="login" />
      <Container fluid className="d-flex flex-column align-items-center justify-content-center text-light" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

        <h1 className="text-center mb-4 fs-3 fw-normal">Entrar no DailyTracker</h1>

        <div style={{ width: '100%', maxWidth: '350px', padding: '2rem', backgroundColor: 'rgba(22, 27, 34, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', borderRadius: '12px' }}>
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Nome de usuário ou email</Form.Label>
              <Form.Control type="email" placeholder="" value={email} onChange={(e) => setEmail(e.target.value)} style={{ backgroundColor: '#0d1117', color: 'white', borderColor: '#252b31ff' }} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <div className="d-flex justify-content-between align-items-center">
                <Form.Label className="mb-0">Senha</Form.Label>
              </div>
              <Form.Control type="password" placeholder="" value={password} onChange={(e) => setPassword(e.target.value)} style={{ backgroundColor: '#0d1117', color: 'white', borderColor: '#252b31ff' }} />
            </Form.Group>
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            <div className="d-grid gap-2">
              <Button variant="success" type="submit" className="py-2">Entrar</Button>
            </div>
          </Form>
        </div>

        <div className="text-center mt-3" style={{ maxWidth: '350px', width: '100%' }}>
          <div className="d-flex align-items-center my-3">
            <hr className="flex-grow-1 border-secondary" />
            <span className="mx-2 text-secondary">ou</span>
            <hr className="flex-grow-1 border-secondary" />
          </div>
          <Button
            variant="outline-light"
            onClick={handleGoogleLogin}
            className="w-100 py-2 d-flex align-items-center justify-content-center"
          >
            <img src={googleLogo} alt="Google" style={{ width: 18, marginRight: 8 }} />
            Continuar com Google
          </Button>
        </div>

        <div className="text-center mt-4 p-3 border border-secondary" style={{ maxWidth: '350px', width: '100%', backgroundColor: 'transparent', borderRadius: '6px' }}>
          Novo no DailyTracker? <Link to="/register" className="text-primary text-decoration-none">Crie uma conta</Link>
        </div>
      </Container>
    </div>
  );
}