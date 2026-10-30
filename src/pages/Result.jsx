import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Flag, Route, Fingerprint, FileText, ScanSearch } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import VerdictBanner from '../components/result/VerdictBanner.jsx';
import StageTracker from '../components/result/StageTracker.jsx';
import NextMoveAlert from '../components/result/NextMoveAlert.jsx';
import RedFlagList from '../components/result/RedFlagList.jsx';
import EvidencePanel from '../components/result/EvidencePanel.jsx';
import MCACard from '../components/result/MCACard.jsx';
import DomainCard from '../components/result/DomainCard.jsx';
import EntityList from '../components/result/EntityList.jsx';
import ExplanationCard from '../components/result/ExplanationCard.jsx';
import ActionBar from '../components/result/ActionBar.jsx';
import FilesGallery from '../components/result/FilesGallery.jsx';
import VerdictReasons from '../components/result/VerdictReasons.jsx';
import DownloadReportButton from '../components/result/DownloadReportButton.jsx';
import { useAuthStore } from '../store/authStore.js';
import { isAdmin } from '../utils/roles.js';
import { useAsync } from '../hooks/useAsync.js';
import { scansService } from '../services/scansService.js';

function ResultSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <Skeleton className="h-44" rounded="rounded-xl" />
      <Skeleton className="h-28" rounded="rounded-xl" />
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-72" rounded="rounded-xl" />
        <Skeleton className="h-72" rounded="rounded-xl" />
      </div>
    </div>
  );
}

export default function Result() {
  const { t } = useTranslation();
  const { scanId } = useParams();
  const { data: scan, loading, error, reload } = useAsync(() => scansService.get(scanId), [scanId]);
  const [activeFlag, setActiveFlag] = useState(null);
  const image = useMemo(() => scan?.files?.find((f) => f.thumb || f.url), [scan]);
  const user = useAuthStore((s) => s.user);
  // Admins reviewing another user's scan go back to the admin scan list.
  const backTo = isAdmin(user) && scan && scan.userId !== user.id ? '/admin/scans' : '/history';

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-6 sm:py-8 pb-36 md:pb-10">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-subtle hover:text-primary">
          <ArrowLeft size={14} aria-hidden /> {t('result.back')}
        </Link>
        {scan && !loading && <DownloadReportButton scan={scan} size="sm" />}
      </div>

      {loading ? (
        <ResultSkeleton />
      ) : error ? (
        error.response?.status === 404 ? (
          <EmptyState icon={ScanSearch} title={t('result.notFound')} action={<Button to="/scan">{t('scan.newScan')}</Button>} />
        ) : (
          <ErrorState onRetry={reload} />
        )
      ) : (
        <div className="space-y-6">
          <VerdictBanner scan={scan} />
          <ActionBar scan={scan} />

          {scan.verdict !== 'genuine' && scan.stage >= 0 && (
            <Card title={t('result.stageTitle')} subtitle={t(`result.track.${scan.track}`)} icon={Route}>
              <StageTracker track={scan.track} stage={scan.stage} />
              <div className="mt-5">
                <NextMoveAlert text={scan.nextMove} />
              </div>
            </Card>
          )}

          <div className="grid lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3" title={t('result.flagsTitle', { count: scan.redFlags.length })} subtitle={t('result.flagsSub')} icon={Flag}>
              <RedFlagList flags={scan.redFlags} activeId={activeFlag} onSelect={setActiveFlag} />
            </Card>
            <Card className="lg:col-span-2" title={t('result.extractedTitle')} subtitle={t('result.extractedSub')} icon={FileText}>
              <EvidencePanel text={scan.extractedText} flags={scan.redFlags} activeId={activeFlag} image={image?.thumb || image?.url} />
            </Card>
          </div>

          <ExplanationCard explanation={scan.explanation} />

          <div className="grid md:grid-cols-2 gap-6">
            <MCACard company={scan.company} />
            <DomainCard domain={scan.domain} />
          </div>

          <Card title={t('entities.title')} subtitle={t('entities.subtitle')} icon={Fingerprint}>
            <EntityList entities={scan.entities} />
          </Card>

          <FilesGallery files={scan.files} />

          <VerdictReasons scan={scan} />
        </div>
      )}
    </div>
  );
}
