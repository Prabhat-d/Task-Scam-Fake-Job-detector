import { useTranslation } from 'react-i18next';
import RiskGauge from '../result/RiskGauge.jsx';
import { scoreTone } from '../../utils/formatters.js';

/** Animated risk meter with a coloured + labelled status line. */
export default function LiveRiskMeter({ risk = 0 }) {
  const { t } = useTranslation();
  const tone = scoreTone(risk);
  const label = tone === 'danger' ? t('verdict.scam') : tone === 'warning' ? t('verdict.suspicious') : t('live.looksSafe');
  const bar = { danger: 'bg-danger', warning: 'bg-warning', success: 'bg-success' }[tone];
  return (
    <div className="flex items-center gap-5">
      <RiskGauge score={risk} size={128} label={t('live.risk')} />
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-subtle">{t('live.currentRisk')}</p>
        <p className={`text-lg font-bold ${tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-amber-600 dark:text-warning' : 'text-success'}`}>{label}</p>
        <div className="mt-2 h-2 rounded-full bg-line dark:bg-ink overflow-hidden">
          <div className={`h-full ${bar} transition-all duration-700`} style={{ width: `${risk}%` }} />
        </div>
      </div>
    </div>
  );
}
