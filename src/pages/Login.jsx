import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, User, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthShell from './AuthShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { USE_MOCK } from '../api/axios.js';
import { homeFor, returnPath } from '../utils/roles.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.email) e.email = t('auth.errors.emailRequired');
    else if (!EMAIL_RE.test(form.email)) e.email = t('auth.errors.emailInvalid');
    if (!form.password) e.password = t('auth.errors.passwordRequired');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form);
      navigate(returnPath(location.state?.from, user) || homeFor(user), { replace: true });
    } catch (err) {
      const code = err.response?.data?.message;
      setFormError(t(`auth.errors.${code}`, { defaultValue: t('auth.errors.generic') }));
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <div role="alert" className="panel-danger rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">{formError}</div>}
        <Field label={t('auth.email')} type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder={t('auth.emailPlaceholder')} />
        <div>
          <div className="relative">
            <Field label={t('auth.password')} type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={set('password')} error={errors.password} inputClassName="pr-10" />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-[30px] icon-btn h-8 w-8" aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">{t('auth.forgot')}</Link>
          </div>
        </div>
        <Button type="submit" icon={LogIn} loading={loading} className="w-full">{t('auth.login')}</Button>
        <p className="text-sm text-center text-subtle">
          {t('auth.noAccount')} <Link to="/register" className="font-medium text-primary hover:underline">{t('auth.register')}</Link>
        </p>
      </form>

      {USE_MOCK && (
        <div className="mt-8 card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle mb-3">{t('auth.demoAccounts')}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" icon={User} onClick={() => setForm({ email: 'user@trustmatrix.in', password: 'User@123' })}>{t('auth.demoUser')}</Button>
            <Button variant="secondary" size="sm" icon={ShieldCheck} onClick={() => setForm({ email: 'admin@trustmatrix.in', password: 'Admin@123' })}>{t('auth.demoAdmin')}</Button>
          </div>
          <p className="text-xs text-subtle mt-2 mono">user@trustmatrix.in / User@123 · admin@trustmatrix.in / Admin@123</p>
        </div>
      )}
    </AuthShell>
  );
}
