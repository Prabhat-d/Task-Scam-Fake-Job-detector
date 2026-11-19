import axios from 'axios';

/** true when the app should run fully on mock data (no backend needed). */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://scam-detector-backend-t60m.onrender.com' : 'http://localhost:5000');

/** Single configured Axios instance. Handles both Bearer JWT and httpOnly cookies for cross-origin reliability. */
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

let unauthorizedHandler = null;
/** App.jsx registers what to do on 401 (clear session + go to /login). */
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

api.interceptors.response.use(
  (res) => {
    if (res?.data?.token) {
      try {
        localStorage.setItem('token', res.data.token);
      } catch {}
    }
    return res;
  },
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401) {
      if (url.includes('/api/auth/logout')) {
        try { localStorage.removeItem('token'); } catch {}
      }
      // /auth/me returning 401 on first load just means "not logged in" – no redirect loop.
      if (!url.includes('/api/auth/me') && unauthorizedHandler) {
        try { localStorage.removeItem('token'); } catch {}
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

/** Helper that unwraps response data. */
export const data = (p) => p.then((r) => r.data);

export default api;
