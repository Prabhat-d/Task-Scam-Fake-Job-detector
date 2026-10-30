import { create } from 'zustand';
import { headlinesService } from '../services/headlinesService.js';

const KEY = 'dismissedHeadlines';
const readDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

/** Admin-published alert headlines shown in the top ticker. */
export const useHeadlineStore = create((set, get) => ({
  headlines: [],
  dismissed: readDismissed(),
  loaded: false,

  fetch: async () => {
    try {
      const headlines = await headlinesService.active();
      set({ headlines, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  /** `headline:updated` sends the full active list. */
  setHeadlines: (headlines) => set({ headlines }),

  dismiss: (id) => {
    const dismissed = [...new Set([...get().dismissed, id])];
    try {
      localStorage.setItem(KEY, JSON.stringify(dismissed));
    } catch {
      /* ignore */
    }
    set({ dismissed });
  },

  visible: () => get().headlines.filter((h) => h.active !== false && !get().dismissed.includes(h.id)),
}));
