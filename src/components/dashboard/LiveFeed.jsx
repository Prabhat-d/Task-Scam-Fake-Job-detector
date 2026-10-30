import { useTranslation } from 'react-i18next';
import { MapPin, ShieldAlert } from 'lucide-react';
import { timeAgo } from '../../utils/timeAgo.js';
import EmptyState from '../common/EmptyState.jsx';

/** Live activity feed: "Prepaid-task scam detected · Noida · 2 min ago". */
export default function LiveFeed({ items = [] }) {
  const { t } = useTranslation();
  if (!items.length) return <EmptyState icon={ShieldAlert} title={t('threat.feedEmpty')} />;
  return (
    <ul className="divide-y divide-line dark:divide-ink" aria-live="polite">
      {items.map((it) => (
        <li key={it.id} className="flex items-start gap-3 py-2.5 animate-slideIn">
          <span className="mt-1 h-2 w-2 rounded-full bg-danger shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-heading">{t('threat.feedItem', { script: t(`scamTypes.${it.script}.short`) })}</p>
            <p className="text-xs text-subtle flex items-center gap-1">
              <MapPin size={12} aria-hidden /> {it.city} · {timeAgo(it.at, t)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
