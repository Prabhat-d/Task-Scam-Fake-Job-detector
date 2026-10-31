import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import CheckRow, { InfoRow } from './CheckRow.jsx';

/** Human domain age: days → months → years. */
function useAge() {
  const { t } = useTranslation();
  return (days) => {
    if (days == null) return '—';
    if (days < 60) return t('domain.ageDays', { count: days });
    if (days < 730) return t('domain.ageMonths', { count: Math.round(days / 30) });
    return t('domain.ageYears', { count: Math.round(days / 365) });
  };
}

/** Official domain, WHOIS age, MX records and HR email type. */
export default function DomainCard({ domain }) {
  const { t } = useTranslation();
  const age = useAge();
  const d = domain || {};
  const risky = d.emailType === 'free' || (d.ageDays != null && d.ageDays < 90) || d.matchesOfficial === false;
  const empty = !d.domain && !d.hrEmail;
  return (
    <Card title={t('domain.title')} subtitle={t('domain.subtitle')} icon={Globe} actions={!empty && <Badge tone={risky ? 'danger' : 'success'}>{risky ? t('domain.risky') : t('domain.ok')}</Badge>}>
      {empty ? (
        <p className="text-sm text-subtle">{t('domain.notProvided')}</p>
      ) : (
        <>
          <dl>
            <InfoRow label={t('domain.official')} mono>{d.officialDomain || '—'}</InfoRow>
            <InfoRow label={t('domain.checked')} mono>{d.domain || '—'}</InfoRow>
            <InfoRow label={t('domain.age')}>{age(d.ageDays)}</InfoRow>
            <InfoRow label={t('domain.hrEmail')} mono>{d.hrEmail || '—'}</InfoRow>
          </dl>
          <ul className="mt-3 pt-2 border-t divider">
            <CheckRow label={t('domain.checkOld')} ok={d.ageDays == null ? null : d.ageDays >= 180} />
            <CheckRow label={t('domain.checkMx')} ok={d.mx} />
            <CheckRow label={t('domain.checkCorporate')} ok={d.emailType == null ? null : d.emailType === 'corporate'} />
            <CheckRow label={t('domain.checkMatches')} ok={d.matchesOfficial} />
          </ul>
        </>
      )}
    </Card>
  );
}
