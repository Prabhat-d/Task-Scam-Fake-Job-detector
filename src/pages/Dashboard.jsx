import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScanSearch, ShieldAlert, ShieldQuestion, ShieldCheck, Radio, Megaphone, ArrowRight, BarChart3, History as HistoryIcon, Languages } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import VerdictChip from '../components/common/VerdictChip.jsx';
import Badge from '../components/common/Badge.jsx';
import Skeleton, { SkeletonRows } from '../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../components/common/EmptyState.jsx';
import KpiCard from '../components/dashboard/KpiCard.jsx';
import { VerdictStackChart } from '../components/dashboard/Charts.jsx';
import DropZone from '../components/scan/DropZone.jsx';
import StageTracker from '../components/result/StageTracker.jsx';
import LanguageSwitcher from '../components/layout/LanguageSwitcher.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { scansService } from '../services/scansService.js';
import { liveService } from '../services/liveService.js';
import { useAuthStore } from '../store/authStore.js';
import { useHeadlineStore } from '../store/headlineStore.js';
import { useNotificationStore } from '../store/notificationStore.js';
import { timeAgo } from '../utils/timeAgo.js';
import { loc } from '../utils/formatters.js';

const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? 'dashboard.morning' : h < 17 ? 'dashboard.afternoon' : 'dashboard.evening';
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const headlines = useHeadlineStore((s) => s.headlines);
  const notifications = useNotificationStore((s) => s.items);

  const scans = useAsync(() => scansService.list({ limit: 500 }), []);
  const live = useAsync(() => liveService.sessions(), []);
  const items = useMemo(() => scans.data?.items || [], [scans.data]);

  const kpi = useMemo(
    () => ({
      total: scans.data?.total ?? items.length,
      scam: items.filter((s) => s.verdict === 'scam').length,
      suspicious: items.filter((s) => s.verdict === 'suspicious').length,
      genuine: items.filter((s) => s.verdict === 'genuine').length,
    }),
    [items, scans.data]
  );

  // Last 30 days, one row per day.
  const chart = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (29 - i));
      return { day: d.toISOString(), key: d.toDateString(), scam: 0, suspicious: 0, genuine: 0 };
    });
    items.forEach((s) => {
      const row = days.find((d) => d.key === new Date(s.createdAt).toDateString());
      if (row) row[s.verdict] += 1;
    });
    return days;
  }, [items]);

  const alerts = useMemo(() => {
    const fromHeadlines = headlines.map((h) => ({ id: h.id, severity: h.severity, title: h.message, at: h.startDate, link: h.link }));
    const fromNotifs = notifications.filter((n) => n.type === 'admin_alert').map((n) => ({ id: n.id, severity: 'info', title: loc(n.body, i18n.language) || loc(n.title, i18n.language), at: n.createdAt }));
    return [...fromHeadlines, ...fromNotifs].slice(0, 4);
  }, [headlines, notifications, i18n.language]);

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 space-y-6">
      {/* Greeting + language */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t(greetingKey(), { name: firstName })}</h1>
          <p className="text-sm text-subtle mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 card px-3 py-1.5 self-start">
          <Languages size={16} className="text-muted" aria-hidden />
          <span className="text-xs text-subtle">{t('dashboard.language')}</span>
          <LanguageSwitcher />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label={t('dashboard.kpiTotal')} value={kpi.total} icon={ScanSearch} tone="primary" loading={scans.loading} />
        <KpiCard label={t('dashboard.kpiScams')} value={kpi.scam} icon={ShieldAlert} tone="danger" loading={scans.loading} />
        <KpiCard label={t('dashboard.kpiSuspicious')} value={kpi.suspicious} icon={ShieldQuestion} tone="warning" loading={scans.loading} />
        <KpiCard label={t('dashboard.kpiGenuine')} value={kpi.genuine} icon={ShieldCheck} tone="success" loading={scans.loading} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Card title={t('dashboard.quickScan')} subtitle={t('dashboard.quickScanSub')} icon={ScanSearch} actions={<Button to="/scan" size="sm" variant="secondary">{t('dashboard.openScanner')}</Button>}>
            <DropZone compact onFiles={(files) => navigate('/scan', { state: { files } })} />
          </Card>

          <Card title={t('dashboard.recent')} icon={HistoryIcon} actions={<Link to="/history" className="text-xs font-medium text-primary hover:underline">{t('common.viewAll')}</Link>} bodyClassName="p-2 sm:p-3">
            {scans.loading ? (
              <SkeletonRows rows={5} className="p-2" />
            ) : scans.error ? (
              <ErrorState onRetry={scans.reload} />
            ) : !items.length ? (
              <EmptyState icon={ScanSearch} title={t('dashboard.noScans')} text={t('dashboard.noScansText')} action={<Button to="/scan" size="sm">{t('scan.newScan')}</Button>} />
            ) : (
              <ul>
                {items.slice(0, 5).map((s) => (
                  <li key={s.id}>
                    <Link to={`/result/${s.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-page dark:hover:bg-navy transition-colors">
                      <img src={s.thumbnail} alt="" className="h-12 w-10 rounded-md object-cover border divider bg-white shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-heading truncate">{s.title}</p>
                        <p className="text-xs text-subtle">{t(`types.${s.type}`)} · {timeAgo(s.createdAt, t)}</p>
                      </div>
                      <VerdictChip verdict={s.verdict} score={s.score} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t('dashboard.chartTitle')} subtitle={t('dashboard.chartSub')} icon={BarChart3}>
            {scans.loading ? <Skeleton className="h-[220px]" /> : <VerdictStackChart data={chart} />}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card
            title={t('dashboard.liveSessions')}
            icon={Radio}
            actions={
              live.data?.connected && (
                <Badge tone="dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot" aria-hidden /> {t('live.live')}
                </Badge>
              )
            }
          >
            {live.loading ? (
              <SkeletonRows rows={1} />
            ) : live.error ? (
              <ErrorState onRetry={live.reload} />
            ) : !live.data?.connected ? (
              <EmptyState icon={Radio} title={t('dashboard.liveNotConnected')} text={t('dashboard.liveNotConnectedText')} action={<Button to="/live" size="sm" variant="teal">{t('live.connect')}</Button>} />
            ) : !live.data.sessions.length ? (
              <EmptyState icon={Radio} title={t('dashboard.noLive')} />
            ) : (
              <ul className="space-y-3">
                {live.data.sessions.map((s) => (
                  <li key={s.id}>
                    <Link to="/live" className="block rounded-lg border divider p-3 hover:bg-page dark:hover:bg-navy">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-sm font-semibold text-heading truncate">{s.chatName}</p>
                        <Badge tone={s.risk >= 70 ? 'danger' : 'warning'}>{t('live.risk')} {s.risk}</Badge>
                      </div>
                      <StageTracker track="task" stage={s.stage} compact />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t('dashboard.alerts')} icon={Megaphone} actions={<Link to="/threat-map" className="text-xs font-medium text-primary hover:underline">{t('nav.threatMap')}</Link>}>
            {!alerts.length ? (
              <EmptyState icon={Megaphone} title={t('dashboard.noAlerts')} />
            ) : (
              <ul className="space-y-2">
                {alerts.map((a) => (
                  <li key={a.id} className={`rounded-lg p-3 ${a.severity === 'critical' ? 'panel-danger' : a.severity === 'warning' ? 'panel-warning' : 'bg-primary/5 border-l-4 border-primary'}`}>
                    <p className="text-sm text-heading">{a.title}</p>
                    <p className="text-[11px] text-subtle mt-1">{t(`severity.${a.severity}`)} · {timeAgo(a.at, t)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Button to="/threat-map" variant="ghost" size="sm" iconRight={ArrowRight} className="mt-3 w-full">{t('dashboard.seeThreats')}</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
