import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Megaphone, Radio } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Field from '../../components/common/Field.jsx';
import Toggle from '../../components/common/Toggle.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import EmptyState, { ErrorState } from '../../components/common/EmptyState.jsx';
import { TickerBar } from '../../components/layout/HeadlineTicker.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { headlinesService } from '../../services/headlinesService.js';
import { useHeadlineStore } from '../../store/headlineStore.js';
import { formatDate } from '../../utils/formatters.js';

const SEV_TONE = { critical: 'danger', warning: 'warning', info: 'primary' };
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const blank = () => ({ title: '', message: '', severity: 'warning', link: '', active: true, startDate: toInput(new Date()), endDate: toInput(Date.now() + 7 * 86400000) });

/** Headlines / alerts manager. Saving broadcasts `headline:updated` to every user. */
export default function Headlines() {
  const { t, i18n } = useTranslation();
  const { data, loading, error, reload, setData } = useAsync(() => headlinesService.list(), []);
  const refreshTicker = useHeadlineStore((s) => s.fetch);
  const [editing, setEditing] = useState(null); // headline object or blank()
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const open = (h) => {
    setErrors({});
    setEditing(h ? { ...h, startDate: toInput(h.startDate), endDate: toInput(h.endDate) } : blank());
  };
  const set = (k) => (e) => setEditing((h) => ({ ...h, [k]: e.target.value }));

  const save = async () => {
    const e = {};
    if (!editing.title.trim()) e.title = t('admin.headlines.errTitle');
    if (editing.message.trim().length < 10) e.message = t('admin.headlines.errMessage');
    if (editing.link && !/^https?:\/\//.test(editing.link)) e.link = t('scan.errors.badLink');
    if (editing.startDate && editing.endDate && editing.endDate < editing.startDate) e.endDate = t('admin.headlines.errDates');
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const payload = {
      ...editing,
      startDate: editing.startDate ? new Date(editing.startDate).toISOString() : null,
      endDate: editing.endDate ? new Date(`${editing.endDate}T23:59:59`).toISOString() : null,
    };
    try {
      if (editing.id) {
        const saved = await headlinesService.update(editing.id, payload);
        setData((list) => list.map((h) => (h.id === saved.id ? saved : h)));
      } else {
        const saved = await headlinesService.create(payload);
        setData((list) => [saved, ...list]);
      }
      toast.success(t('admin.headlines.published'));
      setEditing(null);
      refreshTicker();
    } catch {
      toast.error(t('common.errorText'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (h, active) => {
    setData((list) => list.map((x) => (x.id === h.id ? { ...x, active } : x)));
    try {
      await headlinesService.update(h.id, { active });
      refreshTicker();
    } catch {
      setData((list) => list.map((x) => (x.id === h.id ? { ...x, active: !active } : x)));
      toast.error(t('common.errorText'));
    }
  };

  const remove = async () => {
    await headlinesService.remove(toDelete.id);
    setData((list) => list.filter((h) => h.id !== toDelete.id));
    refreshTicker();
    toast.success(t('admin.headlines.deleted'));
  };

  return (
    <>
      <PageHeader title={t('admin.headlines.title')} description={t('admin.headlines.subtitle')} actions={<Button icon={Plus} onClick={() => open(null)}>{t('admin.headlines.new')}</Button>} />

      <div className="card overflow-hidden">
        {loading ? (
          <SkeletonRows rows={4} className="p-5" />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data.length ? (
          <EmptyState icon={Megaphone} title={t('admin.headlines.empty')} action={<Button icon={Plus} onClick={() => open(null)}>{t('admin.headlines.new')}</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin.headlines.colHeadline')}</th>
                  <th>{t('admin.headlines.colSeverity')}</th>
                  <th>{t('admin.headlines.colDates')}</th>
                  <th>{t('admin.headlines.colBy')}</th>
                  <th>{t('admin.headlines.colActive')}</th>
                  <th className="text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((h) => (
                  <tr key={h.id}>
                    <td className="max-w-md">
                      <p className="font-semibold text-heading">{h.title}</p>
                      <p className="text-xs text-subtle line-clamp-2">{h.message}</p>
                      {h.link && <a href={h.link} target="_blank" rel="noreferrer" className="mono text-[11px] text-primary hover:underline">{h.link}</a>}
                    </td>
                    <td><Badge tone={SEV_TONE[h.severity]}>{t(`severity.${h.severity}`)}</Badge></td>
                    <td className="whitespace-nowrap text-xs text-subtle">{formatDate(h.startDate, i18n.language)} → {formatDate(h.endDate, i18n.language)}</td>
                    <td className="whitespace-nowrap text-xs">{h.createdBy}</td>
                    <td><Toggle checked={!!h.active} onChange={(v) => toggleActive(h, v)} label={t('admin.headlines.colActive')} /></td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" className="icon-btn" onClick={() => open(h)} aria-label={t('common.edit')}><Pencil size={16} /></button>
                      <button type="button" className="icon-btn hover:!text-danger" onClick={() => setToDelete(h)} aria-label={t('common.delete')}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.id ? t('admin.headlines.edit') : t('admin.headlines.new')}
        description={t('admin.headlines.modalHint')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>{t('common.cancel')}</Button>
            <Button icon={Radio} loading={saving} onClick={save}>{t('admin.headlines.publish')}</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <p className="label">{t('admin.headlines.preview')}</p>
              <div className="rounded-lg overflow-hidden border divider">
                <TickerBar headline={editing} preview onDismiss={() => {}} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field className="sm:col-span-2" label={t('admin.headlines.fTitle')} value={editing.title} onChange={set('title')} error={errors.title} placeholder={t('admin.headlines.fTitlePh')} />
              <div>
                <label className="label" htmlFor="hl-sev">{t('admin.headlines.colSeverity')}</label>
                <select id="hl-sev" className="input" value={editing.severity} onChange={set('severity')}>
                  {['info', 'warning', 'critical'].map((s) => <option key={s} value={s}>{t(`severity.${s}`)}</option>)}
                </select>
              </div>
            </div>
            <Field textarea rows={3} label={t('admin.headlines.fMessage')} value={editing.message} onChange={set('message')} error={errors.message} hint={t('admin.headlines.fMessageHint', { count: editing.message.length })} maxLength={220} />
            <Field label={t('admin.headlines.fLink')} value={editing.link} onChange={set('link')} error={errors.link} placeholder={t('admin.headlines.fLinkPh')} mono />
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <Field type="date" label={t('admin.headlines.fStart')} value={editing.startDate} onChange={set('startDate')} />
              <Field type="date" label={t('admin.headlines.fEnd')} value={editing.endDate} onChange={set('endDate')} error={errors.endDate} />
              <div className="flex items-center gap-3 h-10">
                <Toggle checked={!!editing.active} onChange={(v) => setEditing((h) => ({ ...h, active: v }))} label={t('admin.headlines.colActive')} />
                <span className="text-sm text-body">{t('admin.headlines.colActive')}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} title={t('admin.headlines.deleteTitle')} text={t('admin.headlines.deleteText', { title: toDelete?.title })} />
    </>
  );
}
