import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Search, Ban, CheckCircle2, ScanSearch, Users as UsersIcon } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import { initials } from '../../components/layout/UserMenu.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminService } from '../../services/adminService.js';
import { useAuthStore } from '../../store/authStore.js';
import { formatDate } from '../../utils/formatters.js';

export default function Users() {
  const { t, i18n } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [toBlock, setToBlock] = useState(null);
  const { data, loading, error, reload, setData } = useAsync(() => adminService.users({ q: query, page }), [query, page]);

  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const patch = async (u, change) => {
    setData((d) => ({ ...d, items: d.items.map((x) => (x.id === u.id ? { ...x, ...change } : x)) }));
    try {
      await adminService.updateUser(u.id, change);
      toast.success(t('admin.users.updated'));
    } catch {
      reload();
      toast.error(t('common.errorText'));
    }
  };

  return (
    <>
      <PageHeader title={t('admin.users.title')} description={t('admin.users.subtitle', { count: data?.total ?? 0 })} />
      <div className="relative max-w-sm mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" className="input pl-8" placeholder={t('admin.users.search')} aria-label={t('admin.users.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card overflow-hidden">
        {loading && !data ? (
          <SkeletonRows rows={6} className="p-5" />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data.items.length ? (
          <EmptyState icon={UsersIcon} title={t('admin.users.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.users.colUser')}</th>
                  <th>{t('admin.users.colState')}</th>
                  <th>{t('admin.users.colRole')}</th>
                  <th className="text-right">{t('admin.users.colScans')}</th>
                  <th>{t('admin.users.colJoined')}</th>
                  <th>{t('admin.users.colStatus')}</th>
                  <th className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">{initials(u.name)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-heading truncate">{u.name}</p>
                          <p className="text-xs text-subtle truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{u.state || '—'}</td>
                    <td>
                      <select
                        className="input h-8 text-xs w-24"
                        value={u.role}
                        disabled={u.id === me.id}
                        onChange={(e) => patch(u, { role: e.target.value })}
                        aria-label={t('admin.users.changeRole', { name: u.name })}
                      >
                        <option value="user">{t('admin.users.roleUser')}</option>
                        <option value="admin">{t('admin.users.roleAdmin')}</option>
                      </select>
                    </td>
                    <td className="text-right mono">{u.scans}</td>
                    <td className="whitespace-nowrap text-xs text-subtle">{formatDate(u.createdAt, i18n.language)}</td>
                    <td>{u.blocked ? <Badge tone="danger" icon={Ban}>{t('admin.users.blocked')}</Badge> : <Badge tone="success" icon={CheckCircle2}>{t('admin.users.active')}</Badge>}</td>
                    <td className="text-right whitespace-nowrap">
                      <Link to={`/admin/scans?user=${u.id}`} className="icon-btn" aria-label={t('admin.users.viewScans', { name: u.name })}><ScanSearch size={16} /></Link>
                      <button
                        type="button"
                        className={`btn btn-sm ${u.blocked ? 'btn-secondary' : 'btn-ghost text-danger'}`}
                        disabled={u.id === me.id}
                        onClick={() => (u.blocked ? patch(u, { blocked: false }) : setToBlock(u))}
                      >
                        {u.blocked ? t('admin.users.unblock') : t('admin.users.block')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
      <ConfirmDialog
        open={!!toBlock}
        onClose={() => setToBlock(null)}
        onConfirm={() => patch(toBlock, { blocked: true })}
        title={t('admin.users.blockTitle')}
        text={t('admin.users.blockText', { name: toBlock?.name })}
        confirmLabel={t('admin.users.block')}
      />
    </>
  );
}
