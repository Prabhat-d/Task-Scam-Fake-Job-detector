import { Inbox, AlertTriangle, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button.jsx';

/** Friendly empty state. */
export default function EmptyState({ icon: Icon = Inbox, title, text, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}>
      <div className="h-12 w-12 rounded-full surface-2 border divider flex items-center justify-center mb-3">
        <Icon size={22} className="text-muted dark:text-slate-400" aria-hidden />
      </div>
      <p className="font-semibold text-heading">{title}</p>
      {text && <p className="text-sm text-subtle mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Error state with a retry button. */
export function ErrorState({ onRetry, text, className = '' }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center py-8 px-4 ${className}`}>
      <div className="h-12 w-12 rounded-full bg-dangerSoft dark:bg-danger/10 flex items-center justify-center mb-3">
        <AlertTriangle size={22} className="text-danger" aria-hidden />
      </div>
      <p className="font-semibold text-heading">{t('common.errorTitle')}</p>
      <p className="text-sm text-subtle mt-1">{text || t('common.errorText')}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry} className="mt-4">
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
