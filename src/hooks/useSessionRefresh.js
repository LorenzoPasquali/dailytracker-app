import { useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

export function useSessionRefresh() {
  useEffect(() => {
    const refresh = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      const authToken = localStorage.getItem('authToken');

      if (!refreshToken || !authToken) return;

      let expiresAt;
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        expiresAt = payload.exp * 1000;
      } catch {
        // Token malformado — deixa o interceptor reativo cuidar
        return;
      }

      const fiveMinutes = 5 * 60 * 1000;
      if (expiresAt - Date.now() >= fiveMinutes) return;

      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
      } catch {
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);
}
