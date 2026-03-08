import axios from 'axios';
import { toast } from 'sonner';

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
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Erro de rede ou sem resposta do servidor
    if (!error.response) {
      toast.error('Não foi possível conectar ao servidor. Verifique sua internet.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const backendMessage = data?.message || data?.error || (typeof data === 'string' ? data : null);

    // Exibe toast para erros (exceto 401 que é tratado pelo refresh logic abaixo)
    if (status !== 401) {
      const msg = backendMessage || (status === 500 ? 'Erro interno no servidor.' : 'Ocorreu um erro inesperado.');
      toast.error(msg);
    }

    // Tratamento de erros específicos (401 Refresh Token)
    if (status === 401 && !originalRequest._retry) {
      // Don't try to refresh if it's the login or refresh endpoint itself
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
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    } else if (status === 500) {
      toast.error('Erro interno no servidor. Tente novamente mais tarde.');
    }

    return Promise.reject(error);
  }
);

export default api;
