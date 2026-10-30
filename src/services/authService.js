import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Auth endpoints: Google OAuth, Email/Password MFA OTP, and Password Reset. */
export const authService = {
  me: () => (USE_MOCK ? mock.auth.me() : data(api.get('/api/auth/me')).then((d) => d.user || d)),
  login: (body) => (USE_MOCK ? mock.auth.login(body) : data(api.post('/api/auth/login', body))),
  register: (body) => (USE_MOCK ? mock.auth.register(body) : data(api.post('/api/auth/register', body))),
  googleLogin: (body) => (USE_MOCK ? mock.auth.login(body) : data(api.post('/api/auth/google', body))),
  verifyOtp: (body) => (USE_MOCK ? mock.auth.login(body) : data(api.post('/api/auth/verify-otp', body))),
  resendOtp: (body) => (USE_MOCK ? { success: true } : data(api.post('/api/auth/resend-otp', body))),
  forgotPassword: (body) => (USE_MOCK ? { success: true } : data(api.post('/api/auth/forgot-password', body))),
  resetPassword: (body) => (USE_MOCK ? { success: true } : data(api.post('/api/auth/reset-password', body))),
  logout: () => (USE_MOCK ? mock.auth.logout() : data(api.post('/api/auth/logout'))),
};
