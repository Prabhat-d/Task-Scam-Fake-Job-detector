import { useMemo } from 'react';
import { ListChecks, XCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import { buildReasons } from '../../utils/reasons.js';
import { loc } from '../../utils/formatters.js';

const TONE = { critical: 'danger', high: 'danger', medium: 'warning', low: 'neutral' };

function ReasonItem({ item, kind }) {
  const { t, i18n } = useTranslation();
  const Icon = kind === 'against' ? XCircle : kind === 'for' ? CheckCircle2 : HelpCircle;
  const color = kind === 'against' ? 'text-danger' : kind === 'for' ? 'text-success' : 'text-subtle';
  return (
    <li className="flex gap-3 py-3 border-b divider last:border-0">
      <Icon size={18} className={`${color} shrink-0 mt-0.5`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-sm text-heading">{loc(item.title, i18n.language)}</p>
          {item.severity && <Badge tone={TONE[item.severity]} className="uppercase !text-[10px] tracking-wide">{t(`severity.${item.severity}`)}</Badge>}
        </div>
        <p className="text-sm text-subtle mt-0.5">{loc(item.detail, i18n.language)}</p>
        {item.evidence && (
          <p className="mt-1.5 text-xs break-words">
            <span className="text-subtle">{t('result.evidence')}: </span>
            <mark className="evidence mono">“{item.evidence}”</mark>
          </p>
        )}
      </div>
    </li>
  );
}

function Column({ title, items, kind, empty }) {
  const head = kind === 'against' ? 'text-danger' : kind === 'for' ? 'text-success' : 'text-subtle';
  return (
    <section aria-label={title}>
      <h3 className={`text-xs font-semibold uppercase tracking-wide mb-1 ${head}`}>
        {title} <span className="mono">({items.length})</span>
      </h3>
      {items.length ? (
        <ul>{items.map((it) => <ReasonItem key={it.id} item={it} kind={kind} />)}</ul>
      ) : (
        <p className="text-sm text-subtle py-3">{empty}</p>
      )}
    </section>
  );
}

/** "Why this verdict": every reason for and against, with the exact evidence. Sits at the bottom of the result page. */
export default function VerdictReasons({ scan }) {
  const { t, i18n } = useTranslation();
  const reasons = useMemo(() => buildReasons(scan), [scan]);
  const fakeFirst = scan.verdict !== 'genuine';
  const against = <Column title={t('reasons.against')} items={reasons.against} kind="against" empty={t('reasons.noneAgainst')} />;
  const pro = <Column title={t('reasons.for')} items={reasons.for} kind="for" empty={t('reasons.noneFor')} />;

  return (
    <Card title={t('reasons.title')} subtitle={t(`reasons.subtitle.${scan.verdict}`, { score: scan.score })} icon={ListChecks}>
      <div className={`rounded-lg px-4 py-3 mb-5 text-sm ${scan.verdict === 'scam' ? 'panel-danger' : scan.verdict === 'suspicious' ? 'bg-warning/10' : 'bg-success/10'}`}>
        <span className="font-semibold text-heading">{t('reasons.bottomLine')}: </span>
        <span className="text-body">{loc(scan.summary, i18n.language)}</span>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {fakeFirst ? against : pro}
        {fakeFirst ? pro : against}
      </div>
      {reasons.unknown.length > 0 && (
        <div className="mt-6">
          <Column title={t('reasons.unknown')} items={reasons.unknown} kind="unknown" empty="" />
        </div>
      )}
    </Card>
  );
}
