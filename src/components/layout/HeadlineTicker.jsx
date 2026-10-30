import { useEffect, useMemo, useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHeadlineStore } from '../../store/headlineStore.js';

const STYLE = {
  critical: { bg: 'bg-danger text-white', icon: AlertOctagon },
  // Amber background uses navy text for WCAG AA contrast.
  warning: { bg: 'bg-warning text-navy', icon: AlertTriangle },
  info: { bg: 'bg-primary text-white', icon: Info },
};

/** Presentational ticker – also used for the live preview in the admin headline editor. */
export function TickerBar({ headline, onDismiss, onPrev, onNext, count = 1, index = 0, preview = false }) {
  const { t } = useTranslation();
  const s = STYLE[headline.severity] || STYLE.info;
  const Icon = s.icon;
  return (
    <div className={`${s.bg} text-sm`} role={preview ? undefined : 'region'} aria-label={preview ? undefined : t('ticker.label')}>
      <div className="mx-auto max-w-7xl px-4 h-10 flex items-center gap-3">
        <Icon size={16} className="shrink-0" aria-hidden />
        <p key={headline.id} className="flex-1 min-w-0 truncate animate-slideIn" aria-live={preview ? undefined : 'polite'}>
          {headline.title && <strong className="font-semibold mr-1">{headline.title}:</strong>}
          {headline.message || t('admin.headlines.previewPlaceholder')}
        </p>
        {count > 1 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <button type="button" onClick={onPrev} className="p-1 rounded hover:bg-black/10" aria-label={t('ticker.prev')}><ChevronLeft size={14} /></button>
            <span className="text-xs opacity-80 tabular-nums">{index + 1}/{count}</span>
            <button type="button" onClick={onNext} className="p-1 rounded hover:bg-black/10" aria-label={t('ticker.next')}><ChevronRight size={14} /></button>
          </div>
        )}
        {headline.link && (
          <a href={headline.link} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1 font-semibold underline underline-offset-2">
            {t('ticker.readMore')} <ExternalLink size={12} aria-hidden />
          </a>
        )}
        {onDismiss && (
          <button type="button" onClick={onDismiss} className="shrink-0 p-1 rounded hover:bg-black/10" aria-label={t('ticker.dismiss')}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Top alert ticker. Shows admin headlines, rotates every 6s when more than one,
 * remembers dismissals in localStorage and updates live via `headline:updated`.
 */
export default function HeadlineTicker() {
  const headlines = useHeadlineStore((s) => s.headlines);
  const dismissed = useHeadlineStore((s) => s.dismissed);
  const dismiss = useHeadlineStore((s) => s.dismiss);
  const fetch = useHeadlineStore((s) => s.fetch);
  const loaded = useHeadlineStore((s) => s.loaded);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!loaded) fetch();
  }, [loaded, fetch]);

  // Critical first, then warning, then info.
  const visible = useMemo(() => {
    const order = { critical: 0, warning: 1, info: 2 };
    return headlines.filter((h) => !dismissed.includes(h.id)).sort((a, b) => order[a.severity] - order[b.severity]);
  }, [headlines, dismissed]);

  useEffect(() => {
    if (visible.length <= 1 || paused) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % visible.length), 6000);
    return () => clearInterval(id);
  }, [visible.length, paused]);

  if (!visible.length) return null;
  const i = index % visible.length;
  const h = visible[i];
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <TickerBar
        headline={h}
        count={visible.length}
        index={i}
        onPrev={() => setIndex((x) => (x - 1 + visible.length) % visible.length)}
        onNext={() => setIndex((x) => (x + 1) % visible.length)}
        onDismiss={() => dismiss(h.id)}
      />
    </div>
  );
}
