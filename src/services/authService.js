import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Auth endpoints. The backend sets/clears an httpOnly cookie; the response body is the user. */
export const authService = {
  me: () => (USE_MOCK ? mock.auth.me() : data(api.get('/api/auth/me')).then((d) => d.user || d)),
  login: (body) => (USE_MOCK ? mock.auth.login(body) : data(api.post('/api/auth/login', body)).then((d) => d.user || d)),
  register: (body) => (USE_MOCK ? mock.auth.register(body) : data(api.post('/api/auth/register', body)).then((d) => d.user || d)),
  logout: () => (USE_MOCK ? mock.auth.logout() : data(api.post('/api/auth/logout'))),
};
