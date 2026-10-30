import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Send, History as HistoryIcon, Users, MapPin, Languages } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Field from '../../components/common/Field.jsx';
import Button from '../../components/common/Button.jsx';
import SegmentedControl from '../../components/common/SegmentedControl.jsx';
import { SkeletonRows } from '../../components/common/Skeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminService } from '../../services/adminService.js';
import { LANGUAGES } from '../../i18n/index.js';
import { STATE_TILES } from '../../mocks/data.js';
import { timeAgo } from '../../utils/timeAgo.js';
import { formatNumber } from '../../utils/formatters.js';

/** Send a notification to all users, or a selected state / language. */
export default function Broadcast() {
  const { t, i18n } = useTranslation();
  const history = useAsync(() => adminService.broadcasts(), []);
  const [form, setForm] = useState({ title: '', message: '', audience: 'all', state: 'Punjab', language: 'hi' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const send = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = t('admin.headlines.errTitle');
    if (form.message.trim().length < 10) errs.message = t('admin.headlines.errMessage');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    try {
      const sent = await adminService.broadcast({
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        state: form.audience === 'state' ? form.state : undefined,
        language: form.audience === 'language' ? form.language : undefined,
      });
      history.setData((list) => [sent, ...(list || [])]);
      toast.success(t('admin.broadcast.sent', { count: sent.reach }));
      setForm((f) => ({ ...f, title: '', message: '' }));
    } catch {
      toast.error(t('common.errorText'));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title={t('admin.broadcast.title')} description={t('admin.broadcast.subtitle')} />
      <div className="grid xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-3" title={t('admin.broadcast.compose')} icon={Send}>
          <form onSubmit={send} className="space-y-4" noValidate>
            <div>
              <p className="label">{t('admin.broadcast.audience')}</p>
              <SegmentedControl
                value={form.audience}
                onChange={(v) => setForm((f) => ({ ...f, audience: v }))}
                label={t('admin.broadcast.audience')}
                options={[
                  { value: 'all', label: t('admin.broadcast.all'), icon: Users },
                  { value: 'state', label: t('admin.broadcast.byState'), icon: MapPin },
                  { value: 'language', label: t('admin.broadcast.byLanguage'), icon: Languages },
                ]}
              />
            </div>
            {form.audience === 'state' && (
              <div>
                <label htmlFor="bc-state" className="label">{t('admin.broadcast.state')}</label>
                <select id="bc-state" className="input" value={form.state} onChange={set('state')}>
                  {STATE_TILES.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}
            {form.audience === 'language' && (
              <div>
                <label htmlFor="bc-lang" className="label">{t('admin.broadcast.language')}</label>
                <select id="bc-lang" className="input" value={form.language} onChange={set('language')}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            )}
            <Field label={t('admin.headlines.fTitle')} value={form.title} onChange={set('title')} error={errors.title} maxLength={80} />
            <Field textarea rows={4} label={t('admin.headlines.fMessage')} value={form.message} onChange={set('message')} error={errors.message} maxLength={280} hint={t('admin.headlines.fMessageHint', { count: form.message.length })} />
            <div className="flex justify-end">
              <Button type="submit" icon={Send} loading={sending}>{t('admin.broadcast.send')}</Button>
            </div>
          </form>
        </Card>

        <Card className="xl:col-span-2" title={t('admin.broadcast.recent')} icon={HistoryIcon}>
          {history.loading ? (
            <SkeletonRows rows={3} />
          ) : !history.data?.length ? (
            <EmptyState icon={Send} title={t('admin.broadcast.empty')} />
          ) : (
            <ul className="space-y-3">
              {history.data.map((b) => (
                <li key={b.id} className="rounded-lg border divider p-3">
                  <p className="text-sm font-semibold text-heading">{b.title}</p>
                  <p className="text-xs text-body mt-0.5 line-clamp-2">{b.message}</p>
                  <p className="text-[11px] text-subtle mt-1.5">
                    {b.audience === 'all' ? t('admin.broadcast.all') : b.state || LANGUAGES.find((l) => l.code === b.language)?.label} · {t('admin.broadcast.reach', { n: formatNumber(b.reach, i18n.language) })} · {timeAgo(b.createdAt, t)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
