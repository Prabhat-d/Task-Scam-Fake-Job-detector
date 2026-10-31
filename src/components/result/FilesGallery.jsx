import { useState } from 'react';
import { FileText, Images } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card.jsx';
import Lightbox from '../common/Lightbox.jsx';
import { formatBytes } from '../../utils/formatters.js';

/** Uploaded files for this scan; images open in a lightbox. */
export default function FilesGallery({ files = [] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  if (!files.length) return null;
  return (
    <Card title={t('result.filesTitle')} icon={Images}>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {files.map((f) => (
          <li key={f.id || f.name}>
            <button type="button" onClick={() => (f.thumb || f.url) && setOpen(f)} className="w-full text-left group" disabled={!f.thumb && !f.url}>
              <div className="aspect-[4/5] rounded-lg border divider surface-2 overflow-hidden flex items-center justify-center">
                {f.thumb || f.url ? (
                  <img src={f.thumb || f.url} alt={f.name} className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform" />
                ) : (
                  <FileText size={28} className="text-muted" aria-hidden />
                )}
              </div>
              <p className="mt-1.5 text-xs text-heading truncate">{f.name}</p>
              <p className="text-[11px] text-subtle">{formatBytes(f.size)}</p>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox file={open} onClose={() => setOpen(null)} />
    </Card>
  );
}
