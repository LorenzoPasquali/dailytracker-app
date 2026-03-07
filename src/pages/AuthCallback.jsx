import React, { useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

export default function AuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (window.opener) {
      window.opener.postMessage({ token, error }, window.location.origin);
      window.close();
    } else {
      if (token) {
        localStorage.setItem('authToken', token);
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/login?error=auth_failed';
      }
    }
  }, []);

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Autenticando...</span>
      </Spinner>
    </Container>
  );
}