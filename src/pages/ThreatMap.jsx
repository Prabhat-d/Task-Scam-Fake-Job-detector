import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Workflow, AtSign, FileWarning, TrendingUp, TrendingDown, Map as MapIcon, Activity, LineChart, Phone } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Skeleton, { SkeletonRows } from '../components/common/Skeleton.jsx';
import { ErrorState } from '../components/common/EmptyState.jsx';
import KpiCard from '../components/dashboard/KpiCard.jsx';
import ThreatMapTiles from '../components/dashboard/ThreatMap.jsx';
import LiveFeed from '../components/dashboard/LiveFeed.jsx';
import { HourlyLineChart } from '../components/dashboard/Charts.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { statsService } from '../services/statsService.js';
import { maskEntity } from '../utils/maskUPI.js';
import { formatNumber } from '../utils/formatters.js';

/** Real-time threat dashboard. New detections stream in via `threat:new`. */
export default function ThreatMap() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload, setData } = useAsync(() => statsService.threats(), []);
  const [feed, setFeed] = useState([]);
  const [, tick] = useState(0);

  useEffect(() => {
    if (data?.feed && !feed.length) setFeed(data.feed);
  }, [data, feed.length]);

  // Re-render "x min ago" labels every 30s.
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useSocketEvent('threat:new', (item) => {
    setFeed((prev) => [item, ...prev].slice(0, 12));
    setData((d) =>
      d
        ? {
            ...d,
            counters: { ...d.counters, scamsToday: d.counters.scamsToday + 1, reportsFiled: d.counters.reportsFiled + (Math.random() < 0.3 ? 1 : 0) },
            states: d.states.map((s) => (s.code === item.state ? { ...s, count: s.count + 1 } : s)),
            hourly: d.hourly.map((h, i) => (i === d.hourly.length - 1 ? { ...h, scams: h.scams + 1 } : h)),
          }
        : d
    );
  });

  if (error) {
    return (
      <div className="mx-auto max-w-7xl w-full px-4 py-8">
        <div className="card"><ErrorState onRetry={reload} /></div>
      </div>
    );
  }

  const maxScript = Math.max(1, ...(data?.scripts || []).map((s) => s.count));

  return (
    <div className="relative flex-1">
      <div className="absolute inset-x-0 top-0 h-80 grid-pattern [mask-image:linear-gradient(to_bottom,black,transparent)] pointer-events-none" aria-hidden />
      <div className="relative mx-auto max-w-7xl w-full px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{t('threat.title')}</h1>
              <span className="chip bg-navy text-white dark:bg-black/40"><span className="h-2 w-2 rounded-full bg-teal pulse-dot" aria-hidden /> {t('live.live')}</span>
            </div>
            <p className="text-sm text-subtle mt-1">{t('threat.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label={t('threat.scamsToday')} value={data?.counters.scamsToday} icon={ShieldAlert} tone="danger" loading={loading} />
          <KpiCard label={t('threat.activeScripts')} value={data?.counters.activeScripts} icon={Workflow} tone="warning" loading={loading} />
          <KpiCard label={t('threat.flaggedUpi')} value={data?.counters.flaggedUpi} icon={AtSign} tone="navy" loading={loading} />
          <KpiCard label={t('threat.reportsFiled')} value={data?.counters.reportsFiled} icon={FileWarning} tone="teal" loading={loading} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" title={t('threat.mapTitle')} subtitle={t('threat.mapSub')} icon={MapIcon}>
            {loading ? (
              <Skeleton className="h-[380px]" />
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2"><ThreatMapTiles states={data.states} /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2">{t('threat.topCities')}</p>
                  <ol className="space-y-2">
                    {data.cities.map((c, i) => (
                      <li key={c.city} className="flex items-center gap-2 text-sm">
                        <span className="mono text-xs text-subtle w-4">{i + 1}</span>
                        <span className="flex-1 text-heading">{c.city}</span>
                        <span className="mono text-xs font-semibold text-danger">{formatNumber(c.count, i18n.language)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </Card>

          <Card title={t('threat.feedTitle')} icon={Activity} actions={<span className="h-2 w-2 rounded-full bg-teal pulse-dot" aria-hidden />} bodyClassName="px-5 py-2 max-h-[440px] overflow-y-auto scroll-thin">
            {loading ? <SkeletonRows rows={6} className="py-3" /> : <LiveFeed items={feed} />}
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2" title={t('threat.hourlyTitle')} subtitle={t('threat.hourlySub')} icon={LineChart}>
            {loading ? <Skeleton className="h-[240px]" /> : <HourlyLineChart data={data.hourly} />}
          </Card>

          <Card title={t('threat.scriptsTitle')} icon={TrendingUp}>
            {loading ? (
              <SkeletonRows rows={5} />
            ) : (
              <ul className="space-y-3">
                {data.scripts.map((s) => (
                  <li key={s.key}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-heading truncate">{t(`scamTypes.${s.key}.short`)}</span>
                      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${s.growth >= 0 ? 'text-danger' : 'text-success'}`}>
                        {s.growth >= 0 ? <TrendingUp size={12} aria-hidden /> : <TrendingDown size={12} aria-hidden />}
                        {s.growth > 0 ? '+' : ''}{s.growth}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-line dark:bg-ink overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(s.count / maxScript) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card title={t('threat.topEntities')} subtitle={t('threat.topEntitiesSub')} icon={AtSign} bodyClassName="p-0">
          {loading ? (
            <SkeletonRows rows={4} className="p-5" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('threat.colType')}</th>
                    <th>{t('threat.colValue')}</th>
                    <th className="text-right">{t('threat.colReports')}</th>
                    <th>{t('threat.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEntities.map((e) => (
                    <tr key={e.id}>
                      <td><span className="inline-flex items-center gap-1.5 text-xs">{e.type === 'phone' ? <Phone size={13} aria-hidden /> : <AtSign size={13} aria-hidden />}{t(`entity.${e.type}`)}</span></td>
                      <td className="mono">{maskEntity(e.type, e.value)}</td>
                      <td className="text-right mono font-semibold text-danger">{e.reports}</td>
                      <td>{e.verified ? <Badge tone="teal">{t('entities.verified')}</Badge> : <Badge>{t('entities.unverified')}</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
