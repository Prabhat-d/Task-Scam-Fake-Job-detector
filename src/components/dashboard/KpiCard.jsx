import { useTranslation } from 'react-i18next';
import { useCountUp } from '../../hooks/useCountUp.js';
import { formatNumber } from '../../utils/formatters.js';
import Skeleton from '../common/Skeleton.jsx';

const TONES = {
  navy: { icon: 'bg-navy/5 text-navy dark:bg-white/10 dark:text-white', value: 'text-navy dark:text-white' },
  primary: { icon: 'bg-primary/10 text-primary', value: 'text-navy dark:text-white' },
  danger: { icon: 'bg-danger/10 text-danger', value: 'text-danger' },
  warning: { icon: 'bg-warning/10 text-warning', value: 'text-amber-600 dark:text-warning' },
  success: { icon: 'bg-success/10 text-success', value: 'text-emerald-600 dark:text-success' },
  teal: { icon: 'bg-teal/10 text-teal', value: 'text-teal dark:text-[#2dd4bf]' },
};

/** KPI tile with animated count-up. `format` can be 'number' | 'percent'. */
export default function KpiCard({ label, value, icon: Icon, tone = 'primary', hint, loading, format = 'number' }) {
  const { i18n } = useTranslation();
  const animated = useCountUp(format === 'percent' ? Math.round((value || 0) * 100) : value || 0);
  const tn = TONES[tone];
  return (
    <div className="card card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        {Icon && (
          <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${tn.icon}`}>
            <Icon size={16} aria-hidden />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-20 mt-2" />
      ) : (
        <p className={`mt-1 text-3xl font-bold tabular-nums tracking-tight ${tn.value}`}>
          {formatNumber(animated, i18n.language)}
          {format === 'percent' && '%'}
        </p>
      )}
      {hint && <p className="text-xs text-subtle mt-1">{hint}</p>}
    </div>
  );
}
