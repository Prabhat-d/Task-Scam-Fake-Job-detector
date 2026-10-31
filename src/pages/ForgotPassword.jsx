import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, Send, KeyRound, CheckCircle2, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthShell from './AuthShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';
import { authService } from '../services/authService.js';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Send Reset OTP Code to Email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError(t('auth.errors.emailInvalid') || 'Please enter a valid email address');
    }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      toast.success('Password reset code sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      return setError('Please enter the 6-digit verification code sent to your email.');
    }
    if (newPassword.length < 8) {
      return setError('New password must be at least 8 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setError('');
    setLoading(true);
    try {
      const res = await authService.resetPassword({
        email,
        otp: otp.trim(),
        newPassword
      });
      if (res?.success) {
        toast.success('Password successfully updated!');
        setStep(3);
      } else {
        setError(res?.message || 'Password reset failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        step === 3
          ? 'Password Reset Complete'
          : step === 2
          ? 'Create New Password'
          : t('auth.forgotTitle')
      }
      subtitle={
        step === 3
          ? 'Your account is now secure'
          : step === 2
          ? 'Enter your reset code and choose a new password'
          : t('auth.forgotSubtitle')
      }
    >
      {/* Step 1: Email Form */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
          {error && (
            <div role="alert" className="panel-danger rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          <Field
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            placeholder="Enter your registered email"
            autoComplete="email"
          />
          <Button type="submit" icon={Send} loading={loading} className="w-full">
            Send Reset Code
          </Button>
          <p className="text-sm text-center text-subtle mt-4">
            <Link to="/login" className="font-medium text-primary hover:underline inline-flex items-center gap-1">
              <ArrowLeft size={14} />
              {t('auth.backToLogin')}
            </Link>
          </p>
        </form>
      )}

      {/* Step 2: OTP & New Password Form */}
      {step === 2 && (
        <form onSubmit={handleResetPassword} noValidate className="space-y-4">
          {error && (
            <div role="alert" className="panel-danger rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <Field
            label="6-Digit Reset Code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="e.g. 548291"
            mono
          />

          <div className="relative">
            <Field
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              hint="Must be at least 8 characters"
              inputClassName="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-[30px] icon-btn h-8 w-8"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Field
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" icon={KeyRound} loading={loading} className="w-full">
            Update Password
          </Button>

          <p className="text-sm text-center text-subtle mt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Change email address
            </button>
          </p>
        </form>
      )}

      {/* Step 3: Success Screen */}
      {step === 3 && (
        <div className="space-y-5 text-center py-2 animate-fadeIn">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-heading">Password Changed!</h3>
            <p className="text-xs text-subtle max-w-xs mx-auto">
              Your password has been successfully reset. You can now log in using your new credentials.
            </p>
          </div>
          <Button to="/login" variant="primary" className="w-full">
            Proceed to Login
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
