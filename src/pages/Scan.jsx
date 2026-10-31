import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { UploadCloud, Camera, Type, Link2, ScanSearch, PanelLeft, ChevronDown, Building2, Mail, IndianRupee, Lock, Sparkles } from 'lucide-react';
import SegmentedControl from '../components/common/SegmentedControl.jsx';
import Button from '../components/common/Button.jsx';
import Field from '../components/common/Field.jsx';
import DropZone from '../components/scan/DropZone.jsx';
import CameraCapture from '../components/scan/CameraCapture.jsx';
import FilePreview from '../components/scan/FilePreview.jsx';
import ScanHistorySidebar from '../components/scan/ScanHistorySidebar.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { scansService } from '../services/scansService.js';
import { SAMPLE_TEXTS } from '../mocks/data.js';
import { USE_MOCK } from '../api/axios.js';

const EMPTY = { text: '', link: '', companyName: '', hrEmail: '', amountPaid: '' };

/** ChatGPT-style scanner: history sidebar on the left, input on the right. */
export default function Scan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const history = useAsync(() => scansService.list({ limit: 200 }), []);

  const [tab, setTab] = useState('upload');
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showExtra, setShowExtra] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Files dropped on the dashboard "Quick scan" card arrive via router state.
  useEffect(() => {
    if (location.state?.files?.length) {
      setFiles(location.state.files);
      navigate(location.pathname, { replace: true, state: null });
    } else if (location.state?.text) {
      // Text handed over from the safety chatbot ("Run a full scan").
      setForm((f) => ({ ...f, text: location.state.text }));
      setTab('text');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const addFiles = (incoming) => {
    setFiles((prev) => {
      const key = (f) => `${f.name}_${f.size}`;
      const seen = new Set(prev.map(key));
      return [...prev, ...incoming.filter((f) => !seen.has(key(f)))].slice(0, 10);
    });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hasInput = files.length || form.text.trim() || form.link.trim();

  const reset = () => {
    setFiles([]);
    setForm(EMPTY);
    setErrors({});
    setProgress(null);
    setTab('upload');
    setSidebarOpen(false);
  };

  const validate = () => {
    const e = {};
    if (form.link && !/^(https?:\/\/|www\.|t\.me\/)\S+/i.test(form.link.trim())) e.link = t('scan.errors.badLink');
    if (form.hrEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hrEmail.trim())) e.hrEmail = t('auth.errors.emailInvalid');
    if (form.amountPaid && (Number.isNaN(Number(form.amountPaid)) || Number(form.amountPaid) < 0)) e.amountPaid = t('scan.errors.badAmount');
    setErrors(e);
    if (Object.keys(e).length) setShowExtra(true);
    return !Object.keys(e).length;
  };

  const analyse = async () => {
    if (!hasInput) return toast.error(t('scan.errors.empty'));
    if (!validate()) return;
    setSubmitting(true);
    setProgress(files.length ? 0 : null);
    try {
      const { scanId } = await scansService.create({ ...form, files }, files.length ? setProgress : undefined);
      navigate(`/scan/${scanId}/processing`);
    } catch (err) {
      toast.error(err.response?.data?.message || t('scan.errors.failed'));
      setProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { value: 'upload', label: t('scan.tabs.upload'), icon: UploadCloud },
    { value: 'camera', label: t('scan.tabs.camera'), icon: Camera },
    { value: 'text', label: t('scan.tabs.text'), icon: Type },
    { value: 'link', label: t('scan.tabs.link'), icon: Link2 },
  ];

  return (
    <div className="flex-1 flex min-h-0 relative">
      {/* History sidebar: fixed column on desktop, slide-over on mobile */}
      <div className="hidden lg:block w-72 shrink-0 h-[calc(100vh-4rem)] sticky top-16">
        <ScanHistorySidebar items={history.data?.items} loading={history.loading} error={history.error} onRetry={history.reload} onNew={reset} />
      </div>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-80 max-w-[85vw] h-full shadow-xl animate-slideIn">
            <ScanHistorySidebar items={history.data?.items} loading={history.loading} error={history.error} onRetry={history.reload} onNew={reset} onClose={() => setSidebarOpen(false)} />
          </div>
          <button type="button" className="flex-1 bg-navy/40" onClick={() => setSidebarOpen(false)} aria-label={t('common.close')} />
        </div>
      )}

      {/* Main input area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 pb-28 lg:pb-10">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('scan.title')}</h1>
              <p className="text-sm text-subtle mt-1">{t('scan.subtitle')}</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
              <PanelLeft size={14} aria-hidden /> {t('scan.historyTitle')}
            </button>
          </div>

          <SegmentedControl value={tab} onChange={setTab} options={tabs} label={t('scan.inputType')} className="w-full sm:w-auto mb-4" />

          <div className="card p-4 sm:p-5 space-y-4">
            {tab === 'upload' && <DropZone onFiles={addFiles} />}

            {tab === 'camera' && (
              <div className="rounded-xl border-2 border-dashed border-line dark:border-ink bg-page dark:bg-navy px-6 py-10 text-center">
                <span className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3"><Camera size={24} aria-hidden /></span>
                <p className="font-semibold text-heading">{t('scan.camera.cta')}</p>
                <p className="text-sm text-subtle mt-1">{t('scan.camera.ctaText')}</p>
                <Button className="mt-4" icon={Camera} onClick={() => setCameraOpen(true)}>{t('scan.camera.open')}</Button>
              </div>
            )}

            {tab === 'text' && (
              <div>
                <Field
                  textarea
                  rows={9}
                  label={t('scan.textLabel')}
                  placeholder={t('scan.textPlaceholder')}
                  value={form.text}
                  onChange={set('text')}
                  hint={t('scan.textHint', { count: form.text.length })}
                />
                {USE_MOCK && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs text-subtle inline-flex items-center gap-1"><Sparkles size={12} aria-hidden />{t('scan.trySample')}</span>
                    {[['taskScam', 'scan.samples.task'], ['fakeOffer', 'scan.samples.offer'], ['genuineOffer', 'scan.samples.genuine']].map(([k, label]) => (
                      <button key={k} type="button" className="chip bg-page border border-line text-ink hover:border-primary dark:bg-navy dark:border-ink dark:text-slate-300" onClick={() => setForm((f) => ({ ...f, text: SAMPLE_TEXTS[k] }))}>
                        {t(label)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'link' && (
              <Field label={t('scan.linkLabel')} placeholder={t('scan.linkPlaceholder')} value={form.link} onChange={set('link')} error={errors.link} hint={t('scan.linkHint')} mono inputMode="url" />
            )}

            {/* Selected files (from upload or camera) */}
            {files.length > 0 && (
              <div>
                <p className="label">{t('scan.selectedFiles', { count: files.length })}</p>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {files.map((f, i) => (
                    <FilePreview key={`${f.name}_${f.size}`} file={f} progress={progress} disabled={submitting} onRemove={() => setFiles((x) => x.filter((_, j) => j !== i))} />
                  ))}
                </ul>
              </div>
            )}

            {/* Optional details */}
            <div className="border-t divider pt-3">
              <button type="button" onClick={() => setShowExtra((s) => !s)} aria-expanded={showExtra} className="w-full flex items-center justify-between text-sm font-medium text-heading py-1">
                <span>{t('scan.optional')}</span>
                <ChevronDown size={16} className={`text-muted transition-transform ${showExtra ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {showExtra && (
                <div className="grid sm:grid-cols-3 gap-3 mt-3 animate-slideIn">
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-[38px] text-muted" aria-hidden />
                    <Field label={t('scan.company')} placeholder={t('scan.companyPlaceholder')} value={form.companyName} onChange={set('companyName')} inputClassName="pl-8" />
                  </div>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-[38px] text-muted" aria-hidden />
                    <Field label={t('scan.hrEmail')} placeholder={t('scan.hrEmailPlaceholder')} value={form.hrEmail} onChange={set('hrEmail')} error={errors.hrEmail} inputClassName="pl-8" type="email" mono />
                  </div>
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-[38px] text-muted" aria-hidden />
                    <Field label={t('scan.amountPaid')} placeholder="0" value={form.amountPaid} onChange={set('amountPaid')} error={errors.amountPaid} inputClassName="pl-8" inputMode="numeric" mono />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <p className="text-xs text-subtle inline-flex items-center gap-1.5"><Lock size={12} aria-hidden /> {t('scan.privacy')}</p>
              <Button size="lg" icon={ScanSearch} onClick={analyse} loading={submitting} disabled={!hasInput}>
                {t('scan.analyse')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(f) => { addFiles(f); setTab('upload'); }} />
    </div>
  );
}
