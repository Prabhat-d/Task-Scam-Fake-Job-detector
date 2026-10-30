import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, LayoutDashboard, ScanSearch, Radio, History, Map, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore.js';
import Logo from './Logo.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import NotificationBell from './NotificationBell.jsx';
import UserMenu from './UserMenu.jsx';
import { HELPLINE } from '../../utils/constants.js';
import { isAdmin } from '../../utils/roles.js';

/** Sticky white navbar with centre links, language/theme/bell/avatar on the right, hamburger on mobile. */
export default function Navbar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  const links = user
    ? [
        { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { to: '/scan', label: t('nav.scan'), icon: ScanSearch },
        { to: '/live', label: t('nav.live'), icon: Radio },
        { to: '/history', label: t('nav.history'), icon: History },
        { to: '/threat-map', label: t('nav.threatMap'), icon: Map },
        ...(isAdmin(user) ? [{ to: '/admin', label: t('nav.admin'), icon: ShieldCheck }] : []),
      ]
    : [];

  const linkCls = ({ isActive }) =>
    `relative h-16 inline-flex items-center px-1 text-sm font-medium transition-colors ${
      isActive ? 'text-navy dark:text-white after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary after:rounded-full' : 'text-muted hover:text-navy dark:text-slate-400 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line dark:bg-slatenavy/95 dark:border-ink transition-colors duration-200">
      <nav className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4" aria-label={t('nav.main')}>
        <Logo to={user ? '/dashboard' : '/'} />

        <div className="hidden lg:flex items-center gap-6 mx-auto">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls} end={l.to === '/dashboard'}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0">
          <a href={`tel:${HELPLINE}`} className="hidden xl:inline-flex btn btn-danger btn-sm mr-1" aria-label={t('actions.call1930Aria')}>
            <Phone size={14} aria-hidden /> {HELPLINE}
          </a>
          <div className="hidden sm:block"><LanguageSwitcher /></div>
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <>
              <NotificationBell />
              <div className="hidden sm:block"><UserMenu /></div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Link to="/login" className="btn btn-secondary btn-sm">{t('auth.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('auth.register')}</Link>
            </div>
          )}
          <button type="button" className="icon-btn lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="lg:hidden border-t divider bg-white dark:bg-slatenavy animate-slideIn">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-4">
            <a href={`tel:${HELPLINE}`} className="btn btn-danger w-full">
              <Phone size={16} aria-hidden /> {t('actions.call1930')}
            </a>
            {links.length > 0 && (
              <ul className="grid grid-cols-2 gap-2">
                {links.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/dashboard'}
                      className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium border ${isActive ? 'border-primary text-primary bg-primary/5' : 'border-line text-ink dark:border-ink dark:text-slate-200'}`}
                    >
                      <Icon size={16} aria-hidden /> {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
            <div>
              <p className="label">{t('lang.choose')}</p>
              <LanguageSwitcher inline />
            </div>
            <ThemeToggle withLabel />
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/profile" className="btn btn-secondary">{t('nav.profile')}</Link>
                <LogoutButton />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className="btn btn-secondary">{t('auth.login')}</Link>
                <Link to="/register" className="btn btn-primary">{t('auth.register')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function LogoutButton() {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  return (
    <button
      type="button"
      className="btn btn-secondary text-danger"
      onClick={async () => {
        await logout();
        window.location.assign('/login');
      }}
    >
      {t('nav.logout')}
    </button>
  );
}
