import { ShieldAlert, ShieldCheck, ShieldQuestion, Clock, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RiskGauge from './RiskGauge.jsx';
import { loc, formatDateTime } from '../../utils/formatters.js';

const MAP = {
  scam: { panel: 'panel-danger', icon: ShieldAlert, color: 'text-danger' },
  suspicious: { panel: 'panel-warning', icon: ShieldQuestion, color: 'text-warning' },
  genuine: { panel: 'panel-success', icon: ShieldCheck, color: 'text-success' },
};

/** Big verdict banner with icon + text label (never colour alone) and the radial risk gauge. */
export default function VerdictBanner({ scan }) {
  const { t, i18n } = useTranslation();
  const m = MAP[scan.verdict] || MAP.suspicious;
  const Icon = m.icon;
  return (
    <section className={`${m.panel} rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-6`} aria-labelledby="verdict-title">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon size={28} className={m.color} aria-hidden />
          <p className={`text-xs font-bold uppercase tracking-widest ${m.color}`}>{t('result.verdictLabel')}</p>
        </div>
        <h1 id="verdict-title" className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">{t(`verdict.${scan.verdict}Long`)}</h1>
        <p className="mt-2 text-base text-body max-w-2xl">{loc(scan.summary, i18n.language)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
          <span className="inline-flex items-center gap-1"><Hash size={12} aria-hidden /><span className="mono">{scan.id}</span></span>
          <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{formatDateTime(scan.createdAt, i18n.language)}</span>
          <span>{t(`types.${scan.type}`)}</span>
        </div>
      </div>
      <RiskGauge score={scan.score} />
    </section>
  );
}
