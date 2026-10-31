import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Pagination({ page, pages, onChange }) {
  const { t } = useTranslation();
  if (!pages || pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 pt-4" aria-label={t('common.pagination')}>
      <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} aria-hidden /> {t('common.prev')}
      </button>
      <span className="text-xs text-subtle">{t('common.pageOf', { page, pages })}</span>
      <button type="button" className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t('common.next')} <ChevronRight size={14} aria-hidden />
      </button>
    </nav>
  );
}
