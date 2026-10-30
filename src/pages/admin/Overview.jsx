import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, ScanSearch, Percent, FileWarning, PieChart as PieIcon, BarChart3, MapPin, LineChart, ShieldAlert } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import VerdictChip from '../../components/common/VerdictChip.jsx';
import Skeleton, { SkeletonRows } from '../../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import KpiCard from '../../components/dashboard/KpiCard.jsx';
import { VerdictDonut, HBarChart, TrendLineChart } from '../../components/dashboard/Charts.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminService } from '../../services/adminService.js';
import { timeAgo } from '../../utils/timeAgo.js';
import { CHART_COLORS } from '../../utils/constants.js';
import { STATE_TILES } from '../../mocks/data.js';

export default function Overview() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminService.overview(), []);
  if (error) return <div className="card"><ErrorState onRetry={reload} /></div>;
  const stateName = (code) => STATE_TILES.find((s) => s.code === code)?.name || code;

  return (
    <>
      <PageHeader title={t('admin.overview.title')} description={t('admin.overview.subtitle')} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiCard label={t('admin.overview.totalUsers')} value={data?.kpis.totalUsers} icon={Users} tone="primary" loading={loading} />
        <KpiCard label={t('admin.overview.scansToday')} value={data?.kpis.scansToday} icon={ScanSearch} tone="teal" loading={loading} />
        <KpiCard label={t('admin.overview.scamRate')} value={data?.kpis.scamRate} icon={Percent} tone="danger" loading={loading} format="percent" />
        <KpiCard label={t('admin.overview.reports')} value={data?.kpis.reports} icon={FileWarning} tone="warning" loading={loading} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mb-6">
        <Card className="xl:col-span-2" title={t('admin.overview.trend')} icon={LineChart}>
          {loading ? <Skeleton className="h-[260px]" /> : <TrendLineChart data={data.trend} />}
        </Card>
        <Card title={t('admin.overview.byVerdict')} icon={PieIcon}>
          {loading ? <Skeleton className="h-[220px]" /> : <VerdictDonut data={data.byVerdict} />}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card title={t('admin.overview.byType')} icon={BarChart3}>
          {loading ? <Skeleton className="h-[240px]" /> : <HBarChart data={data.byType.map((x) => ({ label: t(`scamTypes.${x.key}.short`), count: x.count }))} color={CHART_COLORS[0]} name={t('admin.overview.scans')} />}
        </Card>
        <Card title={t('admin.overview.byState')} icon={MapPin}>
          {loading ? <Skeleton className="h-[240px]" /> : <HBarChart data={data.byState.map((x) => ({ label: stateName(x.code), count: x.count }))} color={CHART_COLORS[1]} name={t('admin.overview.scans')} />}
        </Card>
      </div>

      <Card title={t('admin.overview.highRisk')} icon={ShieldAlert} bodyClassName="p-0">
        {loading ? (
          <SkeletonRows rows={4} className="p-5" />
        ) : !data.recentHighRisk.length ? (
          <EmptyState title={t('admin.overview.noHighRisk')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.scans.colScan')}</th>
                  <th>{t('admin.scans.colType')}</th>
                  <th>{t('admin.scans.colVerdict')}</th>
                  <th>{t('admin.scans.colWhen')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentHighRisk.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/result/${s.id}`} className="font-medium text-heading hover:text-primary">{s.title}</Link>
                      <p className="mono text-xs text-subtle">{s.id}</p>
                    </td>
                    <td className="whitespace-nowrap">{t(`types.${s.type}`)}</td>
                    <td><VerdictChip verdict={s.verdict} score={s.score} /></td>
                    <td className="whitespace-nowrap text-subtle">{timeAgo(s.createdAt, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
