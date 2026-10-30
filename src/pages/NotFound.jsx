import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <EmptyState icon={Compass} title={t('notFound.title')} text={t('notFound.text')} action={<Button to="/">{t('notFound.home')}</Button>} />
    </div>
  );
}
