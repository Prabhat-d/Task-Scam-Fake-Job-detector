import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Database, BadgeCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Field from '../../components/common/Field.jsx';
import Toggle from '../../components/common/Toggle.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import { ENTITY_ICON } from '../../components/result/EntityList.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminService } from '../../services/adminService.js';
import { timeAgo } from '../../utils/timeAgo.js';

const TYPES = ['upi', 'phone', 'telegram', 'domain'];

/** Scam entity database: UPI IDs, phones, Telegram handles, domains. */
export default function Entities() {
  const { t } = useTranslation();
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload, setData } = useAsync(() => adminService.entities({ q: query, type }), [query, type]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const save = async () => {
    if (editing.value.trim().length < 3) return setErr(t('admin.entities.errValue'));
    setSaving(true);
    try {
      if (editing.id) {
        const saved = await adminService.updateEntity(editing.id, editing);
        setData((list) => list.map((e) => (e.id === saved.id ? saved : e)));
      } else {
        const saved = await adminService.createEntity({ type: editing.type, value: editing.value.trim(), verified: editing.verified });
        setData((list) => [saved, ...list]);
      }
      toast.success(t('admin.entities.saved'));
      setEditing(null);
    } catch {
      toast.error(t('common.errorText'));
    } finally {
      setSaving(false);
    }
  };

  const toggleVerified = async (e, verified) => {
    setData((list) => list.map((x) => (x.id === e.id ? { ...x, verified } : x)));
    try {
      await adminService.updateEntity(e.id, { verified });
    } catch {
      reload();
    }
  };

  const remove = async () => {
    await adminService.removeEntity(toDelete.id);
    setData((list) => list.filter((e) => e.id !== toDelete.id));
    toast.success(t('admin.entities.removed'));
  };

  return (
    <>
      <PageHeader
        title={t('admin.entities.title')}
        description={t('admin.entities.subtitle')}
        actions={<Button icon={Plus} onClick={() => { setErr(''); setEditing({ type: 'upi', value: '', verified: true }); }}>{t('admin.entities.add')}</Button>}
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" className="input pl-8" placeholder={t('admin.entities.search')} aria-label={t('admin.entities.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label={t('admin.entities.colType')}>
          <option value="">{t('admin.entities.allTypes')}</option>
          {TYPES.map((x) => <option key={x} value={x}>{t(`entity.${x}`)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading && !data ? (
          <SkeletonRows rows={6} className="p-5" />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data.length ? (
          <EmptyState icon={Database} title={t('admin.entities.empty')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.entities.colType')}</th>
                  <th>{t('admin.entities.colValue')}</th>
                  <th className="text-right">{t('admin.entities.colReports')}</th>
                  <th>{t('admin.entities.colLastSeen')}</th>
                  <th>{t('admin.entities.colVerified')}</th>
                  <th className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e) => {
                  const Icon = ENTITY_ICON[e.type];
                  return (
                    <tr key={e.id}>
                      <td><span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Icon size={14} className="text-muted" aria-hidden /> {t(`entity.${e.type}`)}</span></td>
                      <td className="mono">{e.value}</td>
                      <td className="text-right mono font-semibold text-danger">{e.reports}</td>
                      <td className="whitespace-nowrap text-xs text-subtle">{timeAgo(e.lastSeen, t)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Toggle checked={!!e.verified} onChange={(v) => toggleVerified(e, v)} label={t('admin.entities.colVerified')} />
                          {e.verified && <Badge tone="teal" icon={BadgeCheck} className="hidden xl:inline-flex">{t('entities.verified')}</Badge>}
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <button type="button" className="icon-btn" onClick={() => { setErr(''); setEditing({ ...e }); }} aria-label={t('common.edit')}><Pencil size={16} /></button>
                        <button type="button" className="icon-btn hover:!text-danger" onClick={() => setToDelete(e)} aria-label={t('common.delete')}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="sm"
        title={editing?.id ? t('admin.entities.edit') : t('admin.entities.add')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button loading={saving} onClick={save}>{t('common.save')}</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label htmlFor="ent-type" className="label">{t('admin.entities.colType')}</label>
              <select id="ent-type" className="input" value={editing.type} disabled={!!editing.id} onChange={(e) => setEditing((x) => ({ ...x, type: e.target.value }))}>
                {TYPES.map((x) => <option key={x} value={x}>{t(`entity.${x}`)}</option>)}
              </select>
            </div>
            <Field label={t('admin.entities.colValue')} value={editing.value} onChange={(e) => setEditing((x) => ({ ...x, value: e.target.value }))} error={err} mono placeholder={t(`admin.entities.ph.${editing.type}`)} />
            <label className="flex items-center gap-3">
              <Toggle checked={!!editing.verified} onChange={(v) => setEditing((x) => ({ ...x, verified: v }))} label={t('admin.entities.markVerified')} />
              <span className="text-sm text-body">{t('admin.entities.markVerified')}</span>
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} title={t('admin.entities.removeTitle')} text={t('admin.entities.removeText', { value: toDelete?.value })} confirmLabel={t('admin.entities.remove')} />
    </>
  );
}
