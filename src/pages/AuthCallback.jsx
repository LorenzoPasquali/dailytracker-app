import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import axios from 'axios';
import api from '../services/api';

export default function AuthCallback() {
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      if (window.opener) {
        window.opener.postMessage({ error }, window.location.origin);
        window.close();
      } else {
        window.location.href = '/login?error=auth_failed';
      }
      return;
    }

    // Exchange HttpOnly cookies for tokens via backend endpoint
    axios.post(`${api.defaults.baseURL}/auth/consume-cookies`, {}, { withCredentials: true })
      .then(({ data }) => {
        if (window.opener) {
          window.opener.postMessage(
            { token: data.token, refreshToken: data.refreshToken },
            window.location.origin
          );
          window.close();
        } else {
          localStorage.setItem('authToken', data.token);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          window.location.href = '/dashboard';
        }
      })
      .catch(() => {
        if (window.opener) {
          window.opener.postMessage({ error: 'auth_failed' }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/login?error=auth_failed';
        }
      });
  }, []);

  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">{t('common.authenticating')}...</span>
      </Spinner>
    </Container>
  );
}
