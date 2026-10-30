import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { List, LayoutGrid, Search, Trash2, Download, ExternalLink, FileText, History as HistoryIcon, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import SegmentedControl from '../components/common/SegmentedControl.jsx';
import VerdictChip from '../components/common/VerdictChip.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import Lightbox from '../components/common/Lightbox.jsx';
import Skeleton, { SkeletonRows } from '../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../components/common/EmptyState.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { scansService } from '../services/scansService.js';
import { uploadsService } from '../services/uploadsService.js';
import { formatDateTime, formatBytes } from '../utils/formatters.js';
import { VERDICTS, SCAN_TYPES } from '../utils/constants.js';

const FILTERS0 = { verdict: '', type: '', from: '', to: '', q: '' };

export default function History() {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState(FILTERS0);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  // Debounce search input.
  useEffect(() => {
    const id = setTimeout(() => setFilters((f) => ({ ...f, q })), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Reset paging when filters or view change.
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [filters, view]);

  const req = useAsync(
    () => (view === 'list' ? scansService.list({ ...filters, page, limit: 10 }) : uploadsService.list({ page, limit: 24 })),
    [view, filters, page]
  );

  // Append pages for "load more".
  useEffect(() => {
    if (req.data) setItems((prev) => (page === 1 ? req.data.items : [...prev, ...req.data.items.filter((x) => !prev.some((p) => p.id === x.id))]));
  }, [req.data, page]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const active = Object.entries(filters).some(([k, v]) => k !== 'q' && v);

  const remove = async () => {
    await scansService.remove(toDelete.id);
    setItems((prev) => prev.filter((x) => x.id !== toDelete.id));
    toast.success(t('history.deleted'));
  };

  const download = (f) => {
    const href = f.url || f.thumb;
    if (!href) return toast.error(t('history.noOriginal'));
    const a = document.createElement('a');
    a.href = href;
    a.download = f.name;
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8">
      <PageHeader
        title={t('history.title')}
        description={t('history.subtitle')}
        actions={
          <SegmentedControl
            value={view}
            onChange={setView}
            label={t('history.view')}
            options={[
              { value: 'list', label: t('history.listView'), icon: List },
              { value: 'grid', label: t('history.gridView'), icon: LayoutGrid },
            ]}
          />
        }
      />

      {view === 'list' && (
        <div className="card p-3 sm:p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" className="input pl-8" placeholder={t('history.search')} aria-label={t('history.search')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input" value={filters.verdict} onChange={set('verdict')} aria-label={t('history.filterVerdict')}>
            <option value="">{t('history.allVerdicts')}</option>
            {VERDICTS.map((v) => <option key={v} value={v}>{t(`verdict.${v}`)}</option>)}
          </select>
          <select className="input" value={filters.type} onChange={set('type')} aria-label={t('history.filterType')}>
            <option value="">{t('history.allTypes')}</option>
            {SCAN_TYPES.map((v) => <option key={v} value={v}>{t(`types.${v}`)}</option>)}
          </select>
          <label className="block">
            <span className="sr-only">{t('history.from')}</span>
            <input type="date" className="input" value={filters.from} onChange={set('from')} aria-label={t('history.from')} />
          </label>
          <div className="flex gap-2">
            <label className="flex-1">
              <span className="sr-only">{t('history.to')}</span>
              <input type="date" className="input" value={filters.to} onChange={set('to')} aria-label={t('history.to')} />
            </label>
            {active && (
              <button type="button" className="icon-btn h-10 w-10 border divider" onClick={() => { setFilters(FILTERS0); setQ(''); }} aria-label={t('history.clearFilters')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {req.error && !items.length ? (
        <div className="card"><ErrorState onRetry={req.reload} /></div>
      ) : req.loading && !items.length ? (
        view === 'list' ? (
          <div className="card p-4"><SkeletonRows rows={6} /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" rounded="rounded-xl" />)}</div>
        )
      ) : !items.length ? (
        <div className="card">
          <EmptyState icon={HistoryIcon} title={active || filters.q ? t('history.noMatch') : t('history.empty')} text={t('history.emptyText')} action={<Button to="/scan">{t('scan.newScan')}</Button>} />
        </div>
      ) : view === 'list' ? (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-line dark:divide-ink">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-page dark:hover:bg-navy/60 transition-colors">
                <Link to={`/result/${s.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <img src={s.thumbnail} alt="" className="h-14 w-11 rounded-md object-cover border divider bg-white shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-heading truncate">{s.title}</p>
                    <p className="text-xs text-subtle mt-0.5">
                      {t(`types.${s.type}`)} · {formatDateTime(s.createdAt, i18n.language)} · <span className="mono">{s.id}</span>
                    </p>
                  </div>
                </Link>
                <VerdictChip verdict={s.verdict} score={s.score} className="hidden sm:inline-flex" />
                <div className="flex items-center">
                  <Link to={`/result/${s.id}`} className="icon-btn" aria-label={t('history.open')}><ExternalLink size={16} /></Link>
                  {s.files?.[0] && (
                    <button type="button" className="icon-btn" onClick={() => download(s.files[0])} aria-label={t('history.download')}><Download size={16} /></button>
                  )}
                  <button type="button" className="icon-btn hover:!text-danger" onClick={() => setToDelete(s)} aria-label={t('common.delete')}><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((f) => (
            <li key={f.id} className="card card-hover overflow-hidden group">
              <button type="button" className="block w-full aspect-[4/5] surface-2 relative" onClick={() => (f.thumb ? setLightbox(f) : null)} aria-label={f.name}>
                {f.thumb ? <img src={f.thumb} alt="" className="h-full w-full object-cover" /> : <FileText size={28} className="absolute inset-0 m-auto text-muted" aria-hidden />}
                <span className="absolute top-2 left-2"><VerdictChip verdict={f.verdict} className="!text-[10px] shadow-sm" /></span>
              </button>
              <div className="p-2.5">
                <p className="text-xs font-medium text-heading truncate" title={f.name}>{f.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-subtle">{formatBytes(f.size) || formatDateTime(f.createdAt, i18n.language)}</span>
                  <div className="flex">
                    <Link to={`/result/${f.scanId}`} className="icon-btn h-7 w-7" aria-label={t('history.open')}><ExternalLink size={13} /></Link>
                    <button type="button" className="icon-btn h-7 w-7" onClick={() => download(f)} aria-label={t('history.download')}><Download size={13} /></button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {req.data?.hasMore && (
        <div className="flex justify-center mt-6">
          <Button variant="secondary" loading={req.loading} onClick={() => setPage((p) => p + 1)}>{t('history.loadMore')}</Button>
        </div>
      )}

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} title={t('history.deleteTitle')} text={t('history.deleteText', { title: toDelete?.title })} />
      <Lightbox file={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
