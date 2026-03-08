import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';

export default function AuthCallback() {
  const { t } = useTranslation();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');

    if (window.opener) {
      window.opener.postMessage({ token, refreshToken, error }, window.location.origin);
      window.close();
    } else {
      if (token) {
        localStorage.setItem('authToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/login?error=auth_failed';
      }
    }
  }, []);

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">{t('common.authenticating')}...</span>
      </Spinner>
    </Container>
  );
}
