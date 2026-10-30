import { create } from 'zustand';
import { authService } from '../services/authService.js';
import { usersService } from '../services/usersService.js';
import { connectSocket, disconnectSocket } from '../socket/socket.js';
import { useLangStore } from './langStore.js';
import { useThemeStore } from './themeStore.js';
import { useNotificationStore } from './notificationStore.js';

/**
 * Auth state. status: 'idle' (not checked yet) | 'checking' | 'ready'.
 * The socket is connected synchronously when a user is set so pages can subscribe right away.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'idle',

  /** Restore session from the httpOnly cookie via GET /api/auth/me. */
  init: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'checking' });
    try {
      const user = await authService.me();
      get().setSession(user);
    } catch {
      set({ user: null });
    } finally {
      set({ status: 'ready' });
    }
  },

  setSession: (user) => {
    if (!user) return;
    connectSocket();
    set({ user });
    // Apply the user's saved preferences (language, theme) without writing them back.
    if (user.language && user.language !== useLangStore.getState().lang) {
      useLangStore.getState().setLang(user.language, { persistToProfile: false });
    }
    if (user.theme && user.theme !== useThemeStore.getState().theme) useThemeStore.getState().setTheme(user.theme);
    useNotificationStore.getState().fetch();
  },

  login: async (credentials) => {
    const user = await authService.login(credentials);
    get().setSession(user);
    return user;
  },

  register: async (payload) => {
    const user = await authService.register(payload);
    get().setSession(user);
    return user;
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      get().clearSession();
    }
  },

  /** Clears local state only (used on logout and on any 401). */
  clearSession: () => {
    disconnectSocket();
    useNotificationStore.getState().reset();
    set({ user: null });
  },

  updateProfile: async (patch, { silent = false } = {}) => {
    try {
      const user = await usersService.updateMe(patch);
      set({ user: { ...get().user, ...user } });
      return user;
    } catch (e) {
      if (!silent) throw e;
      return null;
    }
  },
}));
