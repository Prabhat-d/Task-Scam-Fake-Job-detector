import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, User, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthShell from './AuthShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import GoogleAuthButton from '../components/auth/GoogleAuthButton.jsx';
import OtpVerification from '../components/auth/OtpVerification.jsx';
import { useAuthStore } from '../store/authStore.js';
import { USE_MOCK } from '../api/axios.js';
import { homeFor, returnPath } from '../utils/roles.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [mfaData, setMfaData] = useState(null); // { email }

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
      const res = await login(form);
      if (res?.mfaRequired) {
        setMfaData({
          email: res.email || form.email
        });
        return;
      }
      const user = res?.user || res;
      navigate(returnPath(location.state?.from, user) || homeFor(user), { replace: true });
    } catch (err) {
      const code = err.response?.data?.message;
      setFormError(t(`auth.errors.${code}`, { defaultValue: t('auth.errors.generic') }));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleProfile) => {
    try {
      const res = await googleLogin(googleProfile);
      const user = res?.user || res;
      navigate(returnPath(location.state?.from, user) || homeFor(user), { replace: true });
    } catch (err) {
      setFormError('Google Sign-In failed. Please try again.');
    }
  };

  const handleOtpSuccess = async (otpCode) => {
    const res = await verifyOtp({
      email: mfaData.email,
      otp: otpCode,
      purpose: 'mfa'
    });
    if (res?.success && res?.user) {
      navigate(returnPath(location.state?.from, res.user) || homeFor(res.user), { replace: true });
    } else {
      return { error: res?.message || 'Invalid OTP code' };
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthShell
      title={mfaData ? 'Two-Factor Authentication' : t('auth.loginTitle')}
      subtitle={mfaData ? 'Multi-Factor Protection' : t('auth.loginSubtitle')}
    >
      {mfaData ? (
        <OtpVerification
          email={mfaData.email}
          purpose="mfa"
          onSuccess={handleOtpSuccess}
          onBack={() => setMfaData(null)}
        />
      ) : (
        <div className="space-y-4">
          {/* Google One-Click OAuth Button */}
          <GoogleAuthButton onAuthSuccess={handleGoogleSuccess} mode="login" />

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-page px-2 text-subtle font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {formError && (
              <div role="alert" className="panel-danger rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}
            <Field
              label={t('auth.email')}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
              placeholder={t('auth.emailPlaceholder')}
            />
            <div>
              <div className="relative">
                <Field
                  label={t('auth.password')}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set('password')}
                  error={errors.password}
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
              <div className="flex justify-end mt-1.5">
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  {t('auth.forgot')}
                </Link>
              </div>
            </div>
            <Button type="submit" icon={LogIn} loading={loading} className="w-full">
              {t('auth.login')}
            </Button>
            <p className="text-sm text-center text-subtle">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </form>

          {/* Fast Demo Accounts */}
          <div className="mt-6 card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle mb-3">
              Fast Demo Accounts (Hackathon)
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={User}
                onClick={() => setForm({ email: 'user@trustmatrix.in', password: 'User@123' })}
              >
                Demo User
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={ShieldCheck}
                onClick={() => setForm({ email: 'admin@trustmatrix.in', password: 'Admin@123' })}
              >
                Demo Admin
              </Button>
            </div>
            <p className="text-xs text-subtle mt-2 mono">
              user@trustmatrix.in / User@123 · admin@trustmatrix.in / Admin@123
            </p>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
