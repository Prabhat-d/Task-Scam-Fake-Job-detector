import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Accessible modal dialog: Esc closes, focus moves inside and returns afterwards,
 * Tab is kept inside the dialog.
 */
export default function Modal({ open, onClose, title, description, size = 'md', footer, children, initialFocusRef }) {
  const { t } = useTranslation();
  const panel = useRef(null);
  const lastFocus = useRef(null);
  // Keep the latest onClose without re-running the open/close effect on every parent render
  // (otherwise focus would jump back to the first field while typing).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    const el = initialFocusRef?.current || panel.current?.querySelector('input, textarea, select, button:not([data-close])') || panel.current;
    setTimeout(() => el?.focus(), 20);
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current?.();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocus.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`relative w-full ${widths[size]} card shadow-xl rounded-b-none sm:rounded-xl max-h-[92vh] flex flex-col animate-slideIn`}
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b divider">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-heading">{title}</h2>
            {description && <p className="text-sm text-subtle mt-0.5">{description}</p>}
          </div>
          <button type="button" data-close className="icon-btn -mr-2 -mt-1" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>
        <div className="px-5 py-4 overflow-y-auto scroll-thin">{children}</div>
        {footer && <footer className="px-5 py-3 border-t divider flex flex-wrap justify-end gap-2 surface-2 rounded-b-xl">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
