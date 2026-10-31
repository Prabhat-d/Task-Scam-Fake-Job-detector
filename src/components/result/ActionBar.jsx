import { useState } from 'react';
import { FileWarning, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ReportModal from './ReportModal.jsx';
import CallHelplineButton from '../common/CallHelplineButton.jsx';
import DownloadReportButton from './DownloadReportButton.jsx';
import { scansService } from '../../services/scansService.js';
import { loc } from '../../utils/formatters.js';

/**
 * Call 1930 (most prominent) · Report · Share with family · Was this correct?
 * Desktop: inline card. Mobile: sticky at the bottom of the screen.
 */
export default function ActionBar({ scan }) {
  const { t, i18n } = useTranslation();
  const [reportOpen, setReportOpen] = useState(false);
  const [feedback, setFeedback] = useState(scan.feedback || null);

  const shareText = t('actions.shareText', { verdict: t(`verdict.${scan.verdict}`), summary: loc(scan.summary, i18n.language) });
  const waLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const sendFeedback = async (value) => {
    setFeedback(value);
    try {
      await scansService.feedback(scan.id, value);
      toast.success(t('actions.feedbackThanks'));
    } catch {
      setFeedback(null);
      toast.error(t('common.errorText'));
    }
  };

  const feedbackBtns = (
    <div className="flex items-center gap-1" role="group" aria-label={t('actions.wasCorrect')}>
      <span className="text-xs text-subtle mr-1 hidden sm:inline">{t('actions.wasCorrect')}</span>
      <button type="button" onClick={() => sendFeedback('up')} aria-pressed={feedback === 'up'} className={`icon-btn ${feedback === 'up' ? '!text-success !bg-success/10' : ''}`} aria-label={t('actions.correct')}>
        <ThumbsUp size={16} />
      </button>
      <button type="button" onClick={() => sendFeedback('down')} aria-pressed={feedback === 'down'} className={`icon-btn ${feedback === 'down' ? '!text-danger !bg-danger/10' : ''}`} aria-label={t('actions.incorrect')}>
        <ThumbsDown size={16} />
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden md:flex card p-3 items-center gap-2 flex-wrap">
        <CallHelplineButton size="lg" />
        <button type="button" className="btn btn-secondary btn-lg" onClick={() => setReportOpen(true)}>
          <FileWarning size={18} aria-hidden /> {t('actions.report')}
        </button>
        <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-lg">
          <Share2 size={18} aria-hidden /> {t('actions.share')}
        </a>
        <DownloadReportButton scan={scan} size="lg" />
        <div className="ml-auto">{feedbackBtns}</div>
      </div>

      {/* Mobile sticky bar: Call 1930 is one tap away */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line dark:bg-slatenavy/95 dark:border-ink px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <CallHelplineButton className="flex-1 h-12 text-base" iconSize={18} />
          <button type="button" className="btn btn-secondary h-12 px-3" onClick={() => setReportOpen(true)} aria-label={t('actions.report')}>
            <FileWarning size={18} />
          </button>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-secondary h-12 px-3" aria-label={t('actions.share')}>
            <Share2 size={18} />
          </a>
          <DownloadReportButton scan={scan} iconOnly className="h-12 px-3" />
        </div>
        <div className="flex justify-center mt-1">{feedbackBtns}</div>
      </div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} scan={scan} />
    </>
  );
}
