import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, History, Settings, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';

export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/** Avatar dropdown: Profile, History, Settings, Logout. */
export default function UserMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const items = [
    { to: '/profile', label: t('nav.profile'), icon: User },
    { to: '/history', label: t('nav.history'), icon: History },
    { to: '/profile#settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={t('nav.userMenu')} className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-line dark:hover:ring-ink">
        <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">{initials(user?.name)}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 card shadow-lg z-50 py-1 animate-slideIn">
          <div className="px-4 py-3 border-b divider">
            <p className="text-sm font-semibold text-heading truncate">{user?.name}</p>
            <p className="text-xs text-subtle truncate">{user?.email}</p>
            {user?.role === 'admin' && (
              <span className="chip bg-navy text-white mt-2 dark:bg-black/40"><ShieldCheck size={12} aria-hidden /> {t('nav.adminRole')}</span>
            )}
          </div>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={label} to={to} role="menuitem" onClick={close} className="flex items-center gap-2.5 px-4 py-2 text-sm text-body hover:bg-page dark:hover:bg-navy">
              <Icon size={16} className="text-muted dark:text-slate-400" aria-hidden /> {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              close();
              await logout();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-dangerSoft dark:hover:bg-danger/10 border-t divider mt-1"
          >
            <LogOut size={16} aria-hidden /> {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
