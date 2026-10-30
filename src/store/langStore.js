import { create } from 'zustand';
import i18n from '../i18n/index.js';

/** Selected UI language; persisted in localStorage and (when logged in) in the user profile. */
export const useLangStore = create((set) => ({
  lang: i18n.resolvedLanguage || i18n.language || 'en',
  setLang: (lang, { persistToProfile = true } = {}) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('lang', lang);
    } catch {
      /* ignore */
    }
    set({ lang });
    if (persistToProfile) {
      // Lazy import avoids a circular dependency (authStore -> langStore).
      import('./authStore.js').then(({ useAuthStore }) => {
        if (useAuthStore.getState().user) useAuthStore.getState().updateProfile({ language: lang }, { silent: true });
      });
    }
  },
}));
