import { useTranslation } from 'react-i18next';
import { MapPin, ShieldAlert, Newspaper, ExternalLink } from 'lucide-react';
import { timeAgo } from '../../utils/timeAgo.js';
import EmptyState from '../common/EmptyState.jsx';
import Badge from '../common/Badge.jsx';

/**
 * Threat feed. Shows scam news items ({ kind: 'news', label, date, message, location })
 * and, if the backend streams them, live detections ({ script, city, at }).
 */
export default function LiveFeed({ items = [] }) {
  const { t } = useTranslation();
  if (!items.length) return <EmptyState icon={ShieldAlert} title={t('threat.feedEmpty')} />;
  return (
    <ul className="divide-y divide-line dark:divide-ink" aria-live="polite">
      {items.map((it) =>
        it.kind === 'news' ? (
          <li key={it.id} className="py-3 animate-slideIn">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${it.severity === 'critical' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                <Newspaper size={14} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading">{it.label}</p>
                <p className="text-xs text-body mt-0.5">{it.message}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-subtle">
                  <Badge tone={it.severity === 'critical' ? 'danger' : 'warning'}>{it.date}</Badge>
                  {it.location && (
                    <span className="inline-flex items-center gap-1"><MapPin size={11} aria-hidden /> {it.location}</span>
                  )}
                  {it.link && (
                    <a href={it.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {t('ticker.readMore')} <ExternalLink size={10} aria-hidden />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </li>
        ) : (
          <li key={it.id} className="flex items-start gap-3 py-2.5 animate-slideIn">
            <span className="mt-1 h-2 w-2 rounded-full bg-danger shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-heading">{t('threat.feedItem', { script: t(`scamTypes.${it.script}.short`) })}</p>
              <p className="text-xs text-subtle flex items-center gap-1">
                <MapPin size={12} aria-hidden /> {it.city} · {timeAgo(it.at, t)}
              </p>
            </div>
          </li>
        )
      )}
    </ul>
  );
}
