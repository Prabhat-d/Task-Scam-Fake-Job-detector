import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, SlidersHorizontal, KeyRound, Bell, Send, Trash2, Save, Radio, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import Toggle from '../components/common/Toggle.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import LanguageSwitcher from '../components/layout/LanguageSwitcher.jsx';
import ThemeToggle from '../components/layout/ThemeToggle.jsx';
import { initials } from '../components/layout/UserMenu.jsx';
import { useAuthStore } from '../store/authStore.js';
import { usersService } from '../services/usersService.js';
import { liveService } from '../services/liveService.js';
import { formatDate } from '../utils/formatters.js';

const PREF_KEYS = ['scanCompleted', 'stageChanged', 'adminAlerts', 'reportStatus', 'email'];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [info, setInfo] = useState({ name: user.name, phone: user.phone || '' });
  const [infoErr, setInfoErr] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const [prefs, setPrefs] = useState(user.notificationPrefs || {});
  const [deleting, setDeleting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  const saveInfo = async (e) => {
    e.preventDefault();
    const errs = {};
    if (info.name.trim().length < 2) errs.name = t('auth.errors.nameRequired');
    if (info.phone && !/^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/.test(info.phone.trim())) errs.phone = t('auth.errors.phoneInvalid');
    setInfoErr(errs);
    if (Object.keys(errs).length) return;
    setSavingInfo(true);
    try {
      await updateProfile(info);
      toast.success(t('profile.saved'));
    } catch {
      toast.error(t('common.errorText'));
    } finally {
      setSavingInfo(false);
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.current) errs.current = t('auth.errors.passwordRequired');
    if (pw.next.length < 8 || !/\d/.test(pw.next)) errs.next = t('auth.errors.passwordWeak');
    if (pw.confirm !== pw.next) errs.confirm = t('auth.errors.passwordMismatch');
    setPwErr(errs);
    if (Object.keys(errs).length) return;
    setSavingPw(true);
    try {
      await usersService.changePassword({ current: pw.current, next: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      toast.success(t('profile.passwordChanged'));
    } catch (err) {
      const code = err.response?.data?.message;
      if (code === 'wrongPassword') setPwErr({ current: t('auth.errors.wrongPassword') });
      else toast.error(t('common.errorText'));
    } finally {
      setSavingPw(false);
    }
  };

  const togglePref = async (k, v) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    try {
      await updateProfile({ notificationPrefs: next });
    } catch {
      setPrefs(prefs);
      toast.error(t('common.errorText'));
    }
  };

  const connectTelegram = async () => {
    setConnecting(true);
    try {
      const res = await liveService.connectTelegram();
      await updateProfile({});
      toast.success(t('live.connected'));
      window.open(res.deepLink, '_blank', 'noopener');
    } catch {
      toast.error(t('common.errorText'));
    } finally {
      setConnecting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await usersService.deleteMe();
      clearSession();
      toast.success(t('profile.deleted'));
      navigate('/', { replace: true });
    } finally {
      setDeleting(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="mx-auto max-w-4xl w-full px-4 py-8 space-y-6">
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />

      <div className="card p-5 flex items-center gap-4">
        <span className="h-14 w-14 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center">{initials(user.name)}</span>
        <div className="min-w-0">
          <p className="font-semibold text-heading truncate">{user.name}</p>
          <p className="text-sm text-subtle truncate">{user.email}</p>
          <p className="text-xs text-subtle mt-0.5">{t('profile.memberSince', { date: formatDate(user.createdAt, i18n.language) })}</p>
        </div>
      </div>

      <Card title={t('profile.personal')} icon={User}>
        <form onSubmit={saveInfo} className="grid sm:grid-cols-2 gap-4" noValidate>
          <Field label={t('auth.name')} value={info.name} onChange={(e) => setInfo((s) => ({ ...s, name: e.target.value }))} error={infoErr.name} />
          <Field label={t('auth.phoneOptional')} value={info.phone} onChange={(e) => setInfo((s) => ({ ...s, phone: e.target.value }))} error={infoErr.phone} mono type="tel" />
          <Field label={t('auth.email')} value={user.email} disabled hint={t('profile.emailHint')} />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" icon={Save} loading={savingInfo}>{t('common.save')}</Button>
          </div>
        </form>
      </Card>

      <section id="settings" className="scroll-mt-24">
        <Card title={t('profile.preferences')} icon={SlidersHorizontal}>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="label">{t('auth.preferredLanguage')}</p>
              <LanguageSwitcher inline />
            </div>
            <div>
              <p className="label">{t('profile.theme')}</p>
              <ThemeToggle withLabel />
            </div>
          </div>
        </Card>
      </section>

      <Card title={t('profile.notifications')} icon={Bell}>
        <ul className="divide-y divide-line dark:divide-ink">
          {PREF_KEYS.map((k) => (
            <li key={k} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-heading">{t(`profile.prefs.${k}`)}</p>
                <p className="text-xs text-subtle">{t(`profile.prefs.${k}Hint`)}</p>
              </div>
              <Toggle checked={!!prefs[k]} onChange={(v) => togglePref(k, v)} label={t(`profile.prefs.${k}`)} />
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('profile.telegram')} icon={Send}>
        {user.telegram?.connected ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-body inline-flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success" aria-hidden />
              {t('profile.telegramConnected')} <span className="mono text-heading">@{user.telegram.username}</span>
            </p>
            <Button to="/live" variant="secondary" size="sm" icon={Radio}>{t('nav.live')}</Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-subtle">{t('profile.telegramText')}</p>
            <Button variant="teal" icon={Send} loading={connecting} onClick={connectTelegram}>{t('live.connect')}</Button>
          </div>
        )}
      </Card>

      <Card title={t('profile.password')} icon={KeyRound}>
        <form onSubmit={savePw} className="grid sm:grid-cols-3 gap-4" noValidate>
          <Field label={t('profile.currentPassword')} type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))} error={pwErr.current} />
          <Field label={t('profile.newPassword')} type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))} error={pwErr.next} />
          <Field label={t('auth.confirmPassword')} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))} error={pwErr.confirm} />
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" variant="secondary" icon={KeyRound} loading={savingPw}>{t('profile.changePassword')}</Button>
          </div>
        </form>
      </Card>

      <section className="rounded-xl border border-danger/40 p-5 bg-dangerSoft/50 dark:bg-danger/5">
        <h2 className="text-sm font-semibold text-danger">{t('profile.dangerZone')}</h2>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-body">{t('profile.deleteText')}</p>
          <Button variant="danger" icon={Trash2} loading={deleting} onClick={() => setConfirmDelete(true)}>{t('profile.deleteAccount')}</Button>
        </div>
      </section>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={deleteAccount} title={t('profile.deleteConfirmTitle')} text={t('profile.deleteConfirmText')} confirmLabel={t('profile.deleteAccount')} />
    </div>
  );
}
