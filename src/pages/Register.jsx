import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthShell from './AuthShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import OtpVerification from '../components/auth/OtpVerification.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useLangStore } from '../store/langStore.js';
import { LANGUAGES } from '../i18n/index.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', language: lang });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [mfaData, setMfaData] = useState(null); // { email }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = t('auth.errors.nameRequired');
    if (!EMAIL_RE.test(form.email)) e.email = t('auth.errors.emailInvalid');
    if (form.phone && !PHONE_RE.test(form.phone.trim())) e.phone = t('auth.errors.phoneInvalid');
    if (form.password.length < 8 || !/\d/.test(form.password)) e.password = t('auth.errors.passwordWeak');
    if (form.confirm !== form.password) e.confirm = t('auth.errors.passwordMismatch');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirm, ...payload } = form;
      const res = await register(payload);
      if (res?.mfaRequired) {
        setMfaData({
          email: res.email || form.email
        });
        return;
      }
      setLang(form.language, { persistToProfile: false });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const code = err.response?.data?.message;
      setFormError(t(`auth.errors.${code}`, { defaultValue: t('auth.errors.generic') }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleProfile) => {
    try {
      await googleLogin(googleProfile);
      setLang(form.language, { persistToProfile: false });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError('Google Sign-Up failed. Please try again.');
    }
  };

  const handleOtpSuccess = async (otpCode) => {
    const res = await verifyOtp({
      email: mfaData.email,
      otp: otpCode,
      purpose: 'register'
    });
    if (res?.success && res?.user) {
      setLang(form.language, { persistToProfile: false });
      navigate('/dashboard', { replace: true });
    } else {
      return { error: res?.message || 'Invalid confirmation code' };
    }
  };

  return (
    <AuthShell
      title={mfaData ? 'Confirm Your Email' : t('auth.registerTitle')}
      subtitle={mfaData ? 'Email Verification Code' : t('auth.registerSubtitle')}
    >
      {mfaData ? (
        <OtpVerification
          email={mfaData.email}
          purpose="register"
          onSuccess={handleOtpSuccess}
          onBack={() => setMfaData(null)}
        />
      ) : (
        <div className="space-y-4">
          {/* Google One-Click OAuth Button */}
          <GoogleAuthButton onAuthSuccess={handleGoogleSuccess} mode="register" />

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-page px-2 text-subtle font-medium">Or register with email</span>
            </div>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {formError && (
              <div role="alert" className="panel-danger rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}
            <Field
              label={t('auth.name')}
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
              placeholder="e.g. John Doe"
            />
            <Field
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              placeholder="name@example.com"
            />
            <Field
              label={t('auth.phoneOptional')}
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
              error={errors.phone}
              placeholder="+91 98765 43210"
              mono
            />
            <div className="relative">
              <Field
                label={t('auth.password')}
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                hint={t('auth.passwordHint')}
                inputClassName="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-[30px] icon-btn h-8 w-8"
                aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Field
              label={t('auth.confirmPassword')}
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
            />
            <div>
              <label htmlFor="reg-lang" className="label">
                {t('auth.preferredLanguage')}
              </label>
              <select id="reg-lang" className="input" value={form.language} onChange={set('language')}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" icon={UserPlus} loading={loading} className="w-full">
              {t('auth.createAccount')}
            </Button>
            <p className="text-sm text-center text-subtle">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
