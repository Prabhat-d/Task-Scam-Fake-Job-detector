import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, RotateCw, ArrowLeft, FileSearch } from 'lucide-react';
import ProcessingSteps from '../components/scan/ProcessingSteps.jsx';
import Button from '../components/common/Button.jsx';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { scansService } from '../services/scansService.js';
import { PROCESSING_STEPS } from '../utils/constants.js';

/**
 * Live progress for one scan. Listens to `scan:progress` / `scan:completed` / `scan:failed`
 * and also polls GET /api/scans/:id/status every 2s as a fallback.
 */
export default function Processing() {
  const { t } = useTranslation();
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(null);
  const [thumb, setThumb] = useState(null);
  const finished = useRef(false);

  const complete = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setDone(PROCESSING_STEPS.length);
    setTimeout(() => navigate(`/result/${scanId}`, { replace: true }), 600);
  }, [navigate, scanId]);

  useSocketEvent('scan:progress', (p) => p.scanId === scanId && setDone((d) => Math.max(d, p.step)));
  useSocketEvent('scan:completed', (p) => p.scanId === scanId && complete());
  useSocketEvent('scan:failed', (p) => p.scanId === scanId && setFailed(p.message || 'failed'));

  const poll = useCallback(async () => {
    try {
      const s = await scansService.status(scanId);
      if (s.thumbnail) setThumb(s.thumbnail);
      if (typeof s.step === 'number') setDone((d) => Math.max(d, s.step));
      if (s.status === 'completed') complete();
      if (s.status === 'failed') setFailed(s.message || 'failed');
    } catch (e) {
      if (e.response?.status === 404) setFailed('notFound');
    }
  }, [scanId, complete]);

  useEffect(() => {
    if (failed) return undefined;
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [poll, failed]);

  const retry = () => {
    setFailed(null);
    setDone(0);
    finished.current = false;
  };

  const pct = Math.round((done / PROCESSING_STEPS.length) * 100);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="card w-full max-w-lg p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck size={20} className="text-primary" aria-hidden />
          <h1 className="text-lg font-bold">{failed ? t('processing.failedTitle') : t('processing.title')}</h1>
          <span className="ml-auto mono text-xs text-subtle">{scanId}</span>
        </div>

        {/* Thumbnail with animated scanning line */}
        <div className="relative mx-auto mb-6 h-48 w-40 rounded-lg overflow-hidden border divider surface-2">
          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <FileSearch size={40} className="absolute inset-0 m-auto text-muted" aria-hidden />}
          {!failed && done < PROCESSING_STEPS.length && (
            <>
              <div className="absolute inset-0 bg-primary/5" aria-hidden />
              <div className="absolute left-0 right-0 h-[3px] bg-primary shadow-[0_0_14px_3px_rgba(59,130,246,0.6)] animate-scanline" aria-hidden />
            </>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-subtle">{t('processing.progress')}</span>
            <span className="mono text-heading">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-line dark:bg-ink overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('processing.progress')}>
            <div className={`h-full transition-all duration-500 ${failed ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <ProcessingSteps done={done} failed={!!failed} />

        {failed ? (
          <div className="mt-6 panel-danger rounded-lg p-4">
            <p className="text-sm text-heading font-medium">{t(failed === 'notFound' ? 'processing.notFound' : 'processing.failedText')}</p>
            <div className="mt-3 flex gap-2">
              {failed !== 'notFound' && <Button size="sm" icon={RotateCw} onClick={retry}>{t('common.retry')}</Button>}
              <Button size="sm" variant="secondary" icon={ArrowLeft} to="/scan">{t('processing.backToScan')}</Button>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-xs text-center text-subtle">{t('processing.note')}</p>
        )}
      </div>
    </div>
  );
}
