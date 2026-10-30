import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, KeyRound, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import { authService } from '../../services/authService.js';

export default function OtpVerification({
  email,
  purpose = 'mfa',
  previewOtp = null,
  onSuccess,
  onBack
}) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [currentPreviewOtp, setCurrentPreviewOtp] = useState(previewOtp);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  const inputsRef = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // 60-second countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleDigitChange = (index, value) => {
    setError('');
    // Allow only numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    // Auto-advance to next box if digit entered
    if (cleaned && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (cleaned && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Go back to previous box on Backspace
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);

    // Focus last entered box
    const nextIdx = Math.min(pasteData.length, 5);
    inputsRef.current[nextIdx]?.focus();

    if (pasteData.length === 6) {
      handleVerify(pasteData);
    }
  };

  const handleVerify = async (codeToVerify) => {
    const code = codeToVerify || digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await onSuccess(code);
      if (res && res.error) {
        setError(res.error);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await authService.resendOtp({ email, purpose });
      if (res.previewOtp) {
        setCurrentPreviewOtp(res.previewOtp);
      }
      setTimeLeft(60);
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
      toast.success('A new 6-digit code has been sent to your email.');
    } catch (err) {
      toast.error('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const fillPreviewOtp = () => {
    if (!currentPreviewOtp) return;
    const split = currentPreviewOtp.split('');
    setDigits(split);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleVerify(currentPreviewOtp);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Icon & Title */}
      <div className="text-center space-y-1.5">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 border border-primary/20">
          <KeyRound size={22} />
        </div>
        <h3 className="text-lg font-bold text-heading">
          {purpose === 'reset_password'
            ? 'Password Reset Verification'
            : purpose === 'register'
            ? 'Verify Your Email'
            : 'Two-Factor Authentication (MFA)'}
        </h3>
        <p className="text-xs text-subtle max-w-xs mx-auto">
          We dispatched a secure 6-digit code to{' '}
          <span className="font-semibold text-heading mono">{email}</span>
        </p>
      </div>

      {/* Demo / Developer Preview Helper Pill */}
      {currentPreviewOtp && (
        <div className="p-3 rounded-xl bg-teal/10 border border-teal/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-teal shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-teal block">
                MFA Dispatcher Active
              </span>
              <span className="text-body text-xs">
                Email Code: <b className="mono font-bold text-heading tracking-widest">{currentPreviewOtp}</b>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={fillPreviewOtp}
            className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5 inline-flex items-center gap-1 shrink-0"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? 'Filled!' : 'Auto-Fill'}
          </button>
        </div>
      )}

      {/* 6 Digit Input Boxes */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-12 w-10 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-xl border border-line bg-page text-heading shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mono dark:border-ink"
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-danger text-center font-medium animate-shake">
            {error}
          </p>
        )}
      </div>

      {/* Verify Button */}
      <Button
        type="button"
        icon={ShieldCheck}
        loading={loading}
        disabled={digits.some((d) => !d)}
        onClick={() => handleVerify()}
        className="w-full"
      >
        Verify & Continue
      </Button>

      {/* Resend & Timer */}
      <div className="flex items-center justify-between text-xs text-subtle pt-2 border-t border-line">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 font-medium hover:text-heading"
        >
          <ArrowLeft size={13} />
          Change email
        </button>

        <div>
          {timeLeft > 0 ? (
            <span className="mono text-[11px]">Resend in {timeLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
