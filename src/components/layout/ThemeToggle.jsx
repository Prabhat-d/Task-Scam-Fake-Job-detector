import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../store/themeStore.js';
import { useAuthStore } from '../../store/authStore.js';

/** Sun/moon toggle. Persists to localStorage and (when logged in) the profile. */
export default function ThemeToggle({ withLabel = false, className = '' }) {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const dark = theme === 'dark';
  const label = dark ? t('theme.toLight') : t('theme.toDark');

  const onClick = () => {
    toggle();
    if (user) updateProfile({ theme: dark ? 'light' : 'dark' }, { silent: true });
  };

  if (withLabel) {
    return (
      <button type="button" onClick={onClick} className={`btn btn-secondary w-full justify-start ${className}`} aria-label={label}>
        {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        {dark ? t('theme.light') : t('theme.dark')}
      </button>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`icon-btn ${className}`} aria-label={label} title={label}>
      {dark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
