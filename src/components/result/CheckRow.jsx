import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** ✓ / ✗ / – row used by MCA and domain cards. ok: true | false | null */
export default function CheckRow({ label, ok }) {
  const { t } = useTranslation();
  const Icon = ok === true ? CheckCircle2 : ok === false ? XCircle : MinusCircle;
  const cls = ok === true ? 'text-success' : ok === false ? 'text-danger' : 'text-muted';
  return (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-body">{label}</span>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
        <Icon size={16} aria-hidden /> {ok === true ? t('common.yes') : ok === false ? t('common.no') : t('common.unknown')}
      </span>
    </li>
  );
}

/** Label/value definition row. */
export function InfoRow({ label, children, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b divider last:border-0">
      <dt className="text-xs text-subtle shrink-0">{label}</dt>
      <dd className={`text-sm text-heading text-right break-all ${mono ? 'mono' : ''}`}>{children}</dd>
    </div>
  );
}
