import axios from 'axios';
import { toast } from 'sonner';
import i18n from '../i18n/index.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = localStorage.getItem('language') || i18n.language || 'pt-BR';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignore cancelled requests to avoid toast spam
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (!error.response) {
      toast.error(i18n.t('api.networkError'));
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const backendMessage = data?.message || data?.error || (typeof data === 'string' ? data : null);

    if (status !== 401 && !originalRequest._silent) {
      const msg = backendMessage || (status === 500 ? i18n.t('api.serverError') : i18n.t('api.unexpectedError'));
      toast.error(msg);
    }

    if (status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken: refreshToken,
          });

          const { token: newToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem('authToken', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          processQueue(null, newToken);

          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          toast.error(i18n.t('api.sessionExpired'));
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        if (!window.location.pathname.includes('/login')) {
          toast.error(i18n.t('api.sessionExpired'));
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    } else if (status === 500) {
      toast.error(i18n.t('api.internalServerError'));
    }

    return Promise.reject(error);
  }
);

export default api;
