import { IndianRupee, Phone, Send, Link2, AtSign, Copy, Globe, Fingerprint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Badge from '../common/Badge.jsx';
import EmptyState from '../common/EmptyState.jsx';

export const ENTITY_ICON = { upi: AtSign, phone: Phone, telegram: Send, link: Link2, amount: IndianRupee, domain: Globe };

/** UPI IDs, phones, Telegram handles, links and amounts, with "Seen in N earlier reports". */
export default function EntityList({ entities = [] }) {
  const { t } = useTranslation();
  if (!entities.length) return <EmptyState icon={Fingerprint} title={t('entities.empty')} />;
  const copy = async (v) => {
    try {
      await navigator.clipboard.writeText(v);
      toast.success(t('common.copied'));
    } catch {
      toast.error(t('common.copyFailed'));
    }
  };
  return (
    <ul className="divide-y divide-line dark:divide-ink">
      {entities.map((e) => {
        const Icon = ENTITY_ICON[e.type] || Link2;
        return (
          <li key={`${e.type}-${e.value}`} className="flex items-center gap-3 py-2.5">
            <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${e.seenCount ? 'bg-danger/10 text-danger' : 'bg-page text-muted dark:bg-navy dark:text-slate-400'}`}>
              <Icon size={15} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-subtle">{t(`entity.${e.type}`)}</p>
              <p className="mono text-sm text-heading truncate">{e.value}</p>
            </div>
            {e.seenCount > 0 && <Badge tone="danger" className="hidden sm:inline-flex">{t('entities.seen', { count: e.seenCount })}</Badge>}
            <button type="button" className="icon-btn h-8 w-8" onClick={() => copy(e.value)} aria-label={t('common.copyValue', { value: e.value })}>
              <Copy size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
