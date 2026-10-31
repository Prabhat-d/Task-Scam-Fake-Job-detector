import { NavLink } from 'react-router-dom';
import { LayoutGrid, Megaphone, Users, ScanSearch, Database, FlaskConical, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ADMIN_LINKS = [
  { to: '/admin', key: 'overview', icon: LayoutGrid, end: true },
  { to: '/admin/headlines', key: 'headlines', icon: Megaphone },
  { to: '/admin/users', key: 'users', icon: Users },
  { to: '/admin/scans', key: 'scans', icon: ScanSearch },
  { to: '/admin/entities', key: 'entities', icon: Database },
  { to: '/admin/evaluate', key: 'evaluate', icon: FlaskConical },
  { to: '/admin/broadcast', key: 'broadcast', icon: Send },
];

/** #f8fafc admin sidebar; horizontal scroller on small screens. */
export default function AdminSidebar() {
  const { t } = useTranslation();
  const cls = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
      isActive ? 'bg-primary text-white shadow-sm' : 'text-navy hover:bg-white dark:text-slate-200 dark:hover:bg-slatenavy'
    }`;
  return (
    <aside className="surface-2 border-b lg:border-b-0 lg:border-r divider lg:w-60 shrink-0" aria-label={t('admin.sidebar')}>
      <div className="lg:sticky lg:top-16 p-3 lg:p-4">
        <p className="hidden lg:block px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">{t('admin.panel')}</p>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto scroll-thin">
          {ADMIN_LINKS.map(({ to, key, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={cls}>
              <Icon size={16} aria-hidden /> {t(`admin.nav.${key}`)}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
