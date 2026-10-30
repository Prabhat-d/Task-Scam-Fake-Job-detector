import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import pa from './pa.json';

export const LANGUAGES = [
  { code: 'en', short: 'EN', label: 'English', speech: 'en-IN' },
  { code: 'hi', short: 'हिं', label: 'हिंदी', speech: 'hi-IN' },
  { code: 'pa', short: 'ਪੰ', label: 'ਪੰਜਾਬੀ', speech: 'pa-IN' },
];

const saved = (() => {
  try {
    return localStorage.getItem('lang');
  } catch {
    return null;
  }
})();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, pa: { translation: pa } },
  lng: LANGUAGES.some((l) => l.code === saved) ? saved : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
