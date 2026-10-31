import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Extracted text with every red-flag evidence highlighted.
 * The active flag's evidence gets a stronger highlight and is scrolled into view.
 */
export default function EvidencePanel({ text = '', flags = [], activeId, image }) {
  const { t } = useTranslation();
  const box = useRef(null);

  const segments = useMemo(() => {
    const ranges = [];
    flags.forEach((f) => {
      if (!f.evidence) return;
      const idx = text.toLowerCase().indexOf(f.evidence.toLowerCase());
      if (idx >= 0 && !ranges.some((r) => idx < r.end && idx + f.evidence.length > r.start)) {
        ranges.push({ start: idx, end: idx + f.evidence.length, id: f.id });
      }
    });
    ranges.sort((a, b) => a.start - b.start);
    const out = [];
    let pos = 0;
    ranges.forEach((r) => {
      if (r.start > pos) out.push({ text: text.slice(pos, r.start) });
      out.push({ text: text.slice(r.start, r.end), id: r.id });
      pos = r.end;
    });
    if (pos < text.length) out.push({ text: text.slice(pos) });
    return out;
  }, [text, flags]);

  useEffect(() => {
    if (!activeId) return;
    box.current?.querySelector(`[data-flag="${activeId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeId]);

  return (
    <div className="grid gap-3">
      {image && <img src={image} alt={t('result.uploadedImage')} className="max-h-64 w-auto rounded-lg border divider mx-auto" />}
      <div ref={box} className="max-h-80 overflow-y-auto scroll-thin rounded-lg surface-2 border divider p-4 text-sm leading-relaxed whitespace-pre-wrap text-body">
        {text ? (
          segments.map((s, i) =>
            s.id ? (
              <mark key={i} data-flag={s.id} className={`evidence ${s.id === activeId ? 'evidence-active' : ''}`}>{s.text}</mark>
            ) : (
              <span key={i}>{s.text}</span>
            )
          )
        ) : (
          <span className="text-subtle">{t('result.noText')}</span>
        )}
      </div>
    </div>
  );
}
