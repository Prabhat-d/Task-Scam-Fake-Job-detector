import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

/** Confirmation dialog for destructive actions. `onConfirm` may return a Promise. */
export default function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel, tone = 'danger' }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
      onClose?.();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant={tone} onClick={confirm} loading={busy}>{confirmLabel || t('common.delete')}</Button>
        </>
      }
    >
      <p className="text-sm text-body">{text}</p>
    </Modal>
  );
}
