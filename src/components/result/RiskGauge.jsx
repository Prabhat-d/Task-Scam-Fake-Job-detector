import { useTranslation } from 'react-i18next';
import { useCountUp } from '../../hooks/useCountUp.js';
import { scoreTone } from '../../utils/formatters.js';

const COLORS = { danger: '#ef4444', warning: '#f59e0b', success: '#10b981' };

/** Radial risk gauge 0–100 (270° arc), animates on change. */
export default function RiskGauge({ score = 0, size = 148, label }) {
  const { t } = useTranslation();
  const value = useCountUp(score, 900);
  const r = 52;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const color = COLORS[scoreTone(score)];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={label || t('result.riskScore')}>
      <svg viewBox="0 0 120 120" width={size} height={size} className="-rotate-[225deg]">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} className="stroke-line dark:stroke-ink" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(arc * value) / 100} ${c}`} style={{ transition: 'stroke 0.3s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold tabular-nums tracking-tight" style={{ color }}>{value}</span>
        <span className="text-[11px] uppercase tracking-wider text-subtle font-semibold">{label || t('result.riskScore')}</span>
      </div>
    </div>
  );
}
