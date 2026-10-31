import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Button from '../common/Button.jsx';
import { downloadScanReport } from '../../utils/dossier.js';
import { useAuthStore } from '../../store/authStore.js';

/**
 * Builds the PDF report (incident details, contacts, company, summary, reasons)
 * in the browser from the scan on screen and downloads it.
 */
export default function DownloadReportButton({ scan, iconOnly = false, className = '', ...rest }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      // The complainant is the scan owner; an admin downloading someone else's scan gets the account ID.
      const owner = !scan.userId || scan.userId === user?.id;
      await downloadScanReport(scan, owner ? user?.name : `Account ${scan.userId}`);
      toast.success(t('report.downloaded'));
    } catch (e) {
      console.error(e);
      toast.error(t('report.downloadFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      icon={FileDown}
      loading={busy}
      onClick={download}
      className={className}
      aria-label={iconOnly ? t('report.downloadFull') : undefined}
      {...rest}
    >
      {!iconOnly && t('report.downloadFull')}
    </Button>
  );
}
