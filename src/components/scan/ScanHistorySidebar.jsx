import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import VerdictChip from '../common/VerdictChip.jsx';
import { SkeletonRows } from '../common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../common/EmptyState.jsx';
import { groupByDate } from '../../utils/formatters.js';
import { timeAgo } from '../../utils/timeAgo.js';

/** ChatGPT-style history sidebar: search, "New scan", grouped Today / Yesterday / Last 7 days / Older. */
export default function ScanHistorySidebar({ items = [], loading, error, onRetry, onNew, onClose }) {
  const { t } = useTranslation();
  const { scanId } = useParams();
  const [q, setQ] = useState('');

  const groups = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const filtered = qq ? items.filter((s) => `${s.title} ${s.companyName}`.toLowerCase().includes(qq)) : items;
    return groupByDate(filtered);
  }, [items, q]);

  const sections = [
    ['today', t('history.groups.today')],
    ['yesterday', t('history.groups.yesterday')],
    ['week', t('history.groups.week')],
    ['older', t('history.groups.older')],
  ];

  return (
    <aside className="h-full flex flex-col surface-2 border-r divider" aria-label={t('scan.historyTitle')}>
      <div className="p-3 space-y-2 border-b divider">
        <div className="flex gap-2">
          <button type="button" onClick={onNew} className="btn btn-primary flex-1">
            <Plus size={16} aria-hidden /> {t('scan.newScan')}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="icon-btn lg:hidden" aria-label={t('common.close')}>
              <X size={18} />
            </button>
          )}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} className="input pl-8 h-9 bg-white dark:bg-slatenavy" placeholder={t('scan.searchHistory')} aria-label={t('scan.searchHistory')} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin p-2">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : error ? (
          <ErrorState onRetry={onRetry} />
        ) : !items.length ? (
          <EmptyState title={t('scan.historyEmpty')} text={t('scan.historyEmptyText')} />
        ) : (
          sections.map(([key, label]) =>
            groups[key].length ? (
              <div key={key} className="mb-3">
                <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</p>
                <ul className="space-y-0.5">
                  {groups[key].map((s) => (
                    <li key={s.id}>
                      <Link
                        to={`/result/${s.id}`}
                        className={`flex items-center gap-2.5 rounded-lg p-2 transition-colors ${scanId === s.id ? 'bg-white shadow-sm dark:bg-slatenavy' : 'hover:bg-white dark:hover:bg-slatenavy'}`}
                      >
                        <img src={s.thumbnail} alt="" className="h-10 w-8 rounded object-cover border divider shrink-0 bg-white" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-heading truncate">{s.title}</span>
                          <span className="flex items-center gap-1.5 mt-0.5">
                            <VerdictChip verdict={s.verdict} className="!px-1.5 !py-0 !text-[10px]" />
                            <span className="text-[11px] text-subtle truncate">{timeAgo(s.createdAt, t)}</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )
        )}
      </div>
    </aside>
  );
}
