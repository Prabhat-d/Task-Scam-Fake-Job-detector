import axios from 'axios';

/** true when the app should run fully on mock data (no backend needed). */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/** Single configured Axios instance. The auth token lives in an httpOnly cookie. */
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

let unauthorizedHandler = null;
/** App.jsx registers what to do on 401 (clear session + go to /login). */
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    // /auth/me returning 401 on first load just means "not logged in" – no redirect loop.
    if (error.response?.status === 401 && !url.includes('/api/auth/me') && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

/** Helper that unwraps response data. */
export const data = (p) => p.then((r) => r.data);

export default api;
