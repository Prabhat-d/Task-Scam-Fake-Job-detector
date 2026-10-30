import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ScanSearch, Activity, Megaphone, FileCheck2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';
import { timeAgo } from '../../utils/timeAgo.js';
import { loc } from '../../utils/formatters.js';
import { SkeletonRows } from '../common/Skeleton.jsx';
import EmptyState from '../common/EmptyState.jsx';

export const NOTIF_ICON = {
  scan_completed: { icon: ScanSearch, cls: 'text-primary bg-primary/10' },
  stage_changed: { icon: Activity, cls: 'text-danger bg-danger/10' },
  admin_alert: { icon: Megaphone, cls: 'text-warning bg-warning/10' },
  report_status: { icon: FileCheck2, cls: 'text-teal bg-teal/10' },
};

/** Bell with unread badge and a dropdown of the latest 10 notifications. */
export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="icon-btn relative"
        aria-label={t('notif.bellLabel', { count: unread })}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slatenavy">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,380px)] card shadow-lg z-50 animate-slideIn">
          <div className="flex items-center justify-between px-4 py-3 border-b divider">
            <p className="font-semibold text-heading text-sm">{t('notif.title')}</p>
            <button type="button" onClick={markAllRead} disabled={!unread} className="text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1">
              <CheckCheck size={14} aria-hidden /> {t('notif.markAll')}
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto scroll-thin">
            {loading && !items.length ? (
              <SkeletonRows rows={3} className="p-4" />
            ) : !items.length ? (
              <EmptyState icon={Bell} title={t('notif.emptyTitle')} text={t('notif.emptyText')} />
            ) : (
              <ul>
                {items.slice(0, 10).map((n) => {
                  const meta = NOTIF_ICON[n.type] || NOTIF_ICON.admin_alert;
                  const Icon = meta.icon;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markRead(n.id);
                          close();
                          if (n.link) navigate(n.link);
                        }}
                        className="w-full text-left flex gap-3 px-4 py-3 hover:bg-page dark:hover:bg-navy border-b divider last:border-0"
                      >
                        <span className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${meta.cls}`}>
                          <Icon size={16} aria-hidden />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-heading truncate">{loc(n.title, i18n.language)}</span>
                          <span className="block text-xs text-subtle truncate">{loc(n.body, i18n.language)}</span>
                          <span className="block text-[11px] text-subtle mt-0.5">{t(`notif.types.${n.type}`)} · {timeAgo(n.createdAt, t)}</span>
                        </span>
                        {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" aria-label={t('notif.unread')} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Link to="/notifications" onClick={close} className="block text-center text-sm font-medium text-primary py-2.5 border-t divider hover:bg-page dark:hover:bg-navy rounded-b-xl">
            {t('notif.viewAll')}
          </Link>
        </div>
      )}
    </div>
  );
}
