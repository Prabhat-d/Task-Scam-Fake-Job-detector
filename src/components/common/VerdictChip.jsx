import { ShieldAlert, ShieldCheck, ShieldQuestion, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from './Badge.jsx';

const MAP = {
  scam: { tone: 'danger', icon: ShieldAlert },
  suspicious: { tone: 'warning', icon: ShieldQuestion },
  genuine: { tone: 'success', icon: ShieldCheck },
  processing: { tone: 'primary', icon: Loader2 },
};

/** Verdict chip: icon + text, so colour is never the only signal. */
export default function VerdictChip({ verdict, score, className = '' }) {
  const { t } = useTranslation();
  const v = MAP[verdict] || MAP.suspicious;
  return (
    <Badge tone={v.tone} icon={v.icon} className={className}>
      {t(`verdict.${verdict}`)}
      {score != null && <span className="mono font-semibold opacity-80">· {score}</span>}
    </Badge>
  );
}
