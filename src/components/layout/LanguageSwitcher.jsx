import { useCallback, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n/index.js';
import { useLangStore } from '../../store/langStore.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';

/** EN / हिं / ਪੰ dropdown. `inline` renders as a 3-button group (mobile menu, settings). */
export default function LanguageSwitcher({ inline = false }) {
  const { t } = useTranslation();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  if (inline) {
    return (
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('lang.choose')}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={l.code === lang}
            onClick={() => setLang(l.code)}
            className={`btn btn-sm ${l.code === lang ? 'btn-primary' : 'btn-secondary'}`}
          >
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-ink hover:bg-page dark:text-slate-200 dark:hover:bg-navy"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.choose')}
        onClick={() => setOpen((o) => !o)}
      >
        <Languages size={16} className="text-muted dark:text-slate-400" aria-hidden />
        <span>{current.short}</span>
        <ChevronDown size={14} className="text-muted" aria-hidden />
      </button>
      {open && (
        <ul role="listbox" aria-label={t('lang.choose')} className="absolute right-0 mt-2 w-40 card shadow-lg py-1 z-50 animate-slideIn">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => {
                  setLang(l.code);
                  close();
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-body hover:bg-page dark:hover:bg-navy"
              >
                <span>{l.label}</span>
                {l.code === lang && <Check size={14} className="text-primary" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
