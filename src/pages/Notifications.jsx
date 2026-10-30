import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCheck, Bell } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import SegmentedControl from '../components/common/SegmentedControl.jsx';
import { SkeletonRows } from '../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../components/common/EmptyState.jsx';
import { NOTIF_ICON } from '../components/layout/NotificationBell.jsx';
import { useNotificationStore } from '../store/notificationStore.js';
import { timeAgo } from '../utils/timeAgo.js';
import { loc, formatDateTime } from '../utils/formatters.js';

export default function Notifications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, loading, error, fetch, markAllRead, markRead } = useNotificationStore();
  const [filter, setFilter] = useState('all');
  const list = useMemo(() => (filter === 'unread' ? items.filter((n) => !n.read) : filter === 'all' ? items : items.filter((n) => n.type === filter)), [items, filter]);
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl w-full px-4 py-8">
      <PageHeader
        title={t('notif.title')}
        description={t('notif.subtitle', { count: unread })}
        actions={<Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead} disabled={!unread}>{t('notif.markAll')}</Button>}
      />
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        label={t('notif.filter')}
        className="mb-4"
        options={[
          { value: 'all', label: t('notif.all') },
          { value: 'unread', label: t('notif.unreadTab') },
          { value: 'scan_completed', label: t('notif.types.scan_completed') },
          { value: 'stage_changed', label: t('notif.types.stage_changed') },
          { value: 'admin_alert', label: t('notif.types.admin_alert') },
          { value: 'report_status', label: t('notif.types.report_status') },
        ]}
      />
      <div className="card overflow-hidden">
        {loading && !items.length ? (
          <SkeletonRows rows={5} className="p-5" />
        ) : error ? (
          <ErrorState onRetry={fetch} />
        ) : !list.length ? (
          <EmptyState icon={Bell} title={t('notif.emptyTitle')} text={t('notif.emptyText')} />
        ) : (
          <ul className="divide-y divide-line dark:divide-ink">
            {list.map((n) => {
              const meta = NOTIF_ICON[n.type] || NOTIF_ICON.admin_alert;
              const Icon = meta.icon;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      if (n.link) navigate(n.link);
                    }}
                    className={`w-full text-left flex gap-3 p-4 hover:bg-page dark:hover:bg-navy/60 ${!n.read ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <span className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${meta.cls}`}><Icon size={18} aria-hidden /></span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-heading">{loc(n.title, i18n.language)}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary" aria-label={t('notif.unread')} />}
                      </span>
                      <span className="block text-sm text-body mt-0.5">{loc(n.body, i18n.language)}</span>
                      <span className="block text-xs text-subtle mt-1" title={formatDateTime(n.createdAt, i18n.language)}>
                        {t(`notif.types.${n.type}`)} · {timeAgo(n.createdAt, t)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
