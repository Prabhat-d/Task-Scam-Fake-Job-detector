import { create } from 'zustand';
import { notificationsService } from '../services/notificationsService.js';

export const useNotificationStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  unreadCount: () => get().items.filter((n) => !n.read).length,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const items = await notificationsService.list();
      set({ items, loading: false });
    } catch (error) {
      set({ loading: false, error });
    }
  },

  /** Called from the socket bridge on `notification:new`. */
  add: (n) => set({ items: [n, ...get().items.filter((x) => x.id !== n.id)] }),

  markAllRead: async () => {
    const prev = get().items;
    set({ items: prev.map((n) => ({ ...n, read: true })) });
    try {
      await notificationsService.readAll();
    } catch {
      set({ items: prev });
    }
  },

  markRead: (id) => set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) }),

  reset: () => set({ items: [], loading: false, error: null }),
}));
