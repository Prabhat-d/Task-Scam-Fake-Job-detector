import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import CheckRow, { InfoRow } from './CheckRow.jsx';
import { formatDate } from '../../utils/formatters.js';

const STATUS_TONE = { active: 'success', struck_off: 'danger', not_found: 'danger', not_provided: 'neutral' };

/** Company verification against the MCA registry. */
export default function MCACard({ company }) {
  const { t, i18n } = useTranslation();
  const c = company || { status: 'not_provided' };
  return (
    <Card title={t('mca.title')} subtitle={t('mca.subtitle')} icon={Building2} actions={<Badge tone={STATUS_TONE[c.status]}>{t(`mca.status.${c.status}`)}</Badge>}>
      {c.status === 'not_provided' ? (
        <p className="text-sm text-subtle">{t('mca.notProvided')}</p>
      ) : (
        <>
          <dl>
            <InfoRow label={t('mca.name')}>{c.name || c.queried || '—'}</InfoRow>
            <InfoRow label={t('mca.cin')} mono>{c.cin || '—'}</InfoRow>
            <InfoRow label={t('mca.incorporated')}>{c.incorporated ? formatDate(c.incorporated, i18n.language) : '—'}</InfoRow>
            <InfoRow label={t('mca.state')}>{c.state || '—'}</InfoRow>
          </dl>
          <ul className="mt-3 pt-2 border-t divider">
            <CheckRow label={t('mca.checkRegistered')} ok={c.status !== 'not_found'} />
            <CheckRow label={t('mca.checkActive')} ok={c.status === 'not_found' ? false : c.status === 'active'} />
            <CheckRow label={t('mca.checkName')} ok={c.status === 'not_found' ? false : !!c.nameMatch} />
          </ul>
        </>
      )}
    </Card>
  );
}
