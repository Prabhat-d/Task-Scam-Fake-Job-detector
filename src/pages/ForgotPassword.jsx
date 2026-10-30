import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthShell from './AuthShell.jsx';
import Field from '../components/common/Field.jsx';
import Button from '../components/common/Button.jsx';

/** UI only – shows a confirmation after a fake send. */
export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t('auth.errors.emailInvalid'));
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  return (
    <AuthShell title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      {sent ? (
        <div className="panel-success rounded-lg p-4 flex gap-3">
          <MailCheck className="text-success shrink-0" aria-hidden />
          <p className="text-sm text-body">{t('auth.forgotSent', { email })}</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" icon={Send} loading={loading} className="w-full">{t('auth.sendLink')}</Button>
        </form>
      )}
      <p className="text-sm text-center text-subtle mt-6">
        <Link to="/login" className="font-medium text-primary hover:underline">{t('auth.backToLogin')}</Link>
      </p>
    </AuthShell>
  );
}
