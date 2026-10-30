import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Download, ExternalLink, ScanSearch, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import VerdictChip from '../../components/common/VerdictChip.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminService } from '../../services/adminService.js';
import { formatDateTime, downloadCSV } from '../../utils/formatters.js';
import { VERDICTS, SCAN_TYPES } from '../../utils/constants.js';

export default function Scans() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const userFilter = params.get('user') || '';
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ verdict: '', type: '', q: '' });
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { data, loading, error, reload } = useAsync(() => adminService.scans({ ...filters, page, user: userFilter || undefined }), [filters, page, userFilter]);

  useEffect(() => {
    const id = setTimeout(() => setFilters((f) => ({ ...f, q })), 300);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => setPage(1), [filters]);

  // In mock mode the per-user filter is applied client-side.
  const rows = (data?.items || []).filter((s) => !userFilter || s.userId === userFilter);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await adminService.scans({ ...filters, page: 1, limit: 10000, user: userFilter || undefined });
      downloadCSV(
        all.items.map((s) => ({ id: s.id, title: s.title, type: s.type, verdict: s.verdict, score: s.score, company: s.companyName, userId: s.userId, createdAt: s.createdAt })),
        `jobkavach_scans_${new Date().toISOString().slice(0, 10)}.csv`
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader title={t('admin.scans.title')} description={t('admin.scans.subtitle', { count: data?.total ?? 0 })} actions={<Button variant="secondary" icon={Download} loading={exporting} onClick={exportCsv}>{t('admin.scans.export')}</Button>} />

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" className="input pl-8" placeholder={t('history.search')} aria-label={t('history.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={filters.verdict} onChange={(e) => setFilters((f) => ({ ...f, verdict: e.target.value }))} aria-label={t('history.filterVerdict')}>
          <option value="">{t('history.allVerdicts')}</option>
          {VERDICTS.map((v) => <option key={v} value={v}>{t(`verdict.${v}`)}</option>)}
        </select>
        <select className="input w-auto" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} aria-label={t('history.filterType')}>
          <option value="">{t('history.allTypes')}</option>
          {SCAN_TYPES.map((v) => <option key={v} value={v}>{t(`types.${v}`)}</option>)}
        </select>
        {userFilter && (
          <button type="button" className="chip bg-primary/10 text-primary" onClick={() => setParams({})}>
            {t('admin.scans.userFilter')}: <span className="mono">{userFilter}</span> <X size={12} aria-hidden />
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading && !data ? (
          <SkeletonRows rows={6} className="p-5" />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !rows.length ? (
          <EmptyState icon={ScanSearch} title={t('admin.scans.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.scans.colScan')}</th>
                  <th>{t('admin.scans.colUser')}</th>
                  <th>{t('admin.scans.colType')}</th>
                  <th>{t('admin.scans.colVerdict')}</th>
                  <th>{t('admin.scans.colWhen')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="max-w-xs">
                      <p className="font-medium text-heading truncate">{s.title}</p>
                      <p className="mono text-xs text-subtle">{s.id}</p>
                    </td>
                    <td className="mono text-xs">{s.userId}</td>
                    <td className="whitespace-nowrap">{t(`types.${s.type}`)}</td>
                    <td><VerdictChip verdict={s.verdict} score={s.score} /></td>
                    <td className="whitespace-nowrap text-xs text-subtle">{formatDateTime(s.createdAt, i18n.language)}</td>
                    <td className="text-right"><Link to={`/result/${s.id}`} className="icon-btn" aria-label={t('history.open')}><ExternalLink size={16} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
    </>
  );
}
