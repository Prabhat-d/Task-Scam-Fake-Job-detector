import { useEffect, useMemo } from 'react';
import { FileText, FileType2, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatBytes } from '../../utils/formatters.js';

/** Selected file tile with thumbnail, size, upload progress bar and remove button. */
export default function FilePreview({ file, progress, onRemove, disabled }) {
  const { t } = useTranslation();
  const isImage = file.type?.startsWith('image/');
  const url = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  const Icon = file.type === 'application/pdf' ? FileType2 : FileText;

  return (
    <li className="card p-2.5 flex items-center gap-3">
      <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden border divider surface-2 flex items-center justify-center">
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <Icon size={22} className="text-muted" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-heading truncate">{file.name}</p>
        <p className="text-xs text-subtle">{formatBytes(file.size)}</p>
        {progress != null && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-line dark:bg-ink overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={t('scan.uploading')}>
              <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            {progress >= 100 ? <CheckCircle2 size={14} className="text-success" aria-hidden /> : <span className="text-[11px] mono text-subtle">{progress}%</span>}
          </div>
        )}
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} disabled={disabled} className="icon-btn h-8 w-8" aria-label={t('scan.removeFile', { name: file.name })}>
          <X size={16} />
        </button>
      )}
    </li>
  );
}
