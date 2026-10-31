import { create } from 'zustand';
import { notificationsService } from '../services/notificationsService.js';

/** Only notifications with an id, a known type and a title are shown (drops malformed socket payloads). */
const KNOWN_TYPES = ['scan_completed', 'stage_changed', 'admin_alert', 'report_status'];
const isValid = (n) => n && n.id && KNOWN_TYPES.includes(n.type) && n.title;
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

/**
 * Notifications come only from the server: GET /api/notifications on login,
 * then `notification:new` socket events. Nothing is generated on the client.
 */
export const useNotificationStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  unreadCount: () => get().items.filter((n) => !n.read).length,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const list = (await notificationsService.list()).filter(isValid);
      // Keep anything that arrived over the socket while the request was in flight.
      const ids = new Set(list.map((n) => n.id));
      const live = get().items.filter((n) => !ids.has(n.id));
      set({ items: [...live, ...list].sort(byNewest), loading: false });
    } catch (error) {
      set({ loading: false, error });
    }
  },

  /** Called from the socket bridge on `notification:new`. */
  add: (n) => {
    if (!isValid(n)) return;
    set({ items: [{ read: false, ...n }, ...get().items.filter((x) => x.id !== n.id)] });
  },

  markAllRead: async () => {
    const prev = get().items;
    set({ items: prev.map((n) => ({ ...n, read: true })) });
    try {
      await notificationsService.readAll();
    } catch {
      set({ items: prev });
    }
  },

  markRead: async (id) => {
    const target = get().items.find((n) => n.id === id);
    if (!target || target.read) return;
    set({ items: get().items.map((n) => (n.id === id ? { ...n, read: true } : n)) });
    try {
      await notificationsService.read(id);
    } catch {
      /* stays read locally; the next fetch corrects it */
    }
  },

  reset: () => set({ items: [], loading: false, error: null }),
}));
