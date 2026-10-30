import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-3" role="status">
      <ShieldCheck size={36} className="text-primary animate-pulse" aria-hidden />
      <p className="text-sm text-subtle">{t('common.loading')}</p>
    </div>
  );
}
