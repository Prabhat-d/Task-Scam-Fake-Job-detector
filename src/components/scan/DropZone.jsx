import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ACCEPTED_FILES, MAX_FILE_SIZE } from '../../utils/constants.js';

/** Drag-and-drop area (images, PDF, DOCX, TXT; max 10 MB each). Dashed primary border on drag-over. */
export default function DropZone({ onFiles, compact = false }) {
  const { t } = useTranslation();
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: ACCEPTED_FILES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    noClick: false,
    onDropAccepted: onFiles,
    onDropRejected: (rejections) => {
      rejections.forEach(({ file, errors }) => {
        const tooBig = errors.some((e) => e.code === 'file-too-large');
        toast.error(tooBig ? t('scan.errors.tooBig', { name: file.name }) : t('scan.errors.badType', { name: file.name }));
      });
    },
  });

  return (
    <div
      {...getRootProps({
        className: `group relative flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
          compact ? 'px-4 py-6' : 'px-6 py-12'
        } ${isDragActive ? 'border-primary bg-primary/5' : 'border-line bg-page hover:border-primary/60 dark:border-ink dark:bg-navy'}`,
        'aria-label': t('scan.dropAria'),
      })}
    >
      <input {...getInputProps()} />
      <span className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
        <UploadCloud size={24} aria-hidden />
      </span>
      <p className="font-semibold text-heading">{isDragActive ? t('scan.dropActive') : t('scan.dropTitle')}</p>
      <p className="text-sm text-subtle mt-1">
        {t('scan.dropOr')}{' '}
        <button type="button" onClick={(e) => { e.stopPropagation(); open(); }} className="font-medium text-primary hover:underline">
          {t('scan.browse')}
        </button>
      </p>
      <p className="text-xs text-subtle mt-2">{t('scan.dropHint')}</p>
    </div>
  );
}
