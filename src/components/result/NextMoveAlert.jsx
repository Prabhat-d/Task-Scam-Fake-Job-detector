import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loc } from '../../utils/formatters.js';

/** "What they'll ask next" warning card (warningSoft). */
export default function NextMoveAlert({ text }) {
  const { t, i18n } = useTranslation();
  if (!text) return null;
  return (
    <div className="panel-warning rounded-xl p-4 flex gap-3" role="alert">
      <AlertTriangle size={22} className="text-warning shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-warning">{t('result.nextMove')}</p>
        <p className="mt-1 font-semibold text-heading">{loc(text, i18n.language)}</p>
      </div>
    </div>
  );
}
