import axios from 'axios';

/**
 * Axios instance for the hidden /analytics dashboard. Kept separate from services/api.js so its
 * 401 handling never touches the user session (authToken/refreshToken) or redirects to /login.
 * The admin token lives in sessionStorage and dies with the tab.
 */
export const ADMIN_TOKEN_KEY = 'adminToken';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

adminApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if ((status === 401 || status === 403) && !url.includes('/admin/login')) {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      window.dispatchEvent(new Event('admin-logout'));
    }
    return Promise.reject(error);
  }
);

export default adminApi;
