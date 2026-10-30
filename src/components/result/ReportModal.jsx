import { useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { buildDossierText } from '../../utils/dossier.js';
import { scansService } from '../../services/scansService.js';
import { downloadBlob } from '../../utils/formatters.js';
import { useAuthStore } from '../../store/authStore.js';
import { CYBERCRIME_URL } from '../../utils/constants.js';

/** Auto-filled incident dossier for cybercrime.gov.in with Copy and Download PDF. */
export default function ReportModal({ open, onClose, scan }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [downloading, setDownloading] = useState(false);
  const text = useMemo(() => (scan ? buildDossierText(scan, user) : ''), [scan, user]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('report.copied'));
    } catch {
      toast.error(t('common.copyFailed'));
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await scansService.report(scan.id);
      downloadBlob(blob, `JobKavach_${scan.id}.pdf`);
    } catch {
      toast.error(t('report.downloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('report.title')}
      description={t('report.description')}
      footer={
        <>
          <Button variant="secondary" icon={Copy} onClick={copy}>{t('report.copy')}</Button>
          <Button variant="secondary" icon={Download} onClick={download} loading={downloading}>{t('report.downloadPdf')}</Button>
          <Button href={CYBERCRIME_URL} target="_blank" rel="noreferrer" iconRight={ExternalLink}>{t('report.openPortal')}</Button>
        </>
      }
    >
      <ol className="mb-4 grid sm:grid-cols-3 gap-2 text-xs">
        {[1, 2, 3].map((i) => (
          <li key={i} className="flex gap-2 rounded-lg surface-2 border divider p-2.5">
            <CheckCircle2 size={14} className="text-teal shrink-0 mt-0.5" aria-hidden />
            <span className="text-body">{t(`report.step${i}`)}</span>
          </li>
        ))}
      </ol>
      <pre className="mono text-xs leading-relaxed whitespace-pre-wrap rounded-lg border divider surface-2 p-4 max-h-[45vh] overflow-y-auto scroll-thin text-body">{text}</pre>
    </Modal>
  );
}
