import Modal from './Modal.jsx';

/** Simple image/file viewer. */
export default function Lightbox({ file, onClose }) {
  return (
    <Modal open={!!file} onClose={onClose} title={file?.name} size="lg">
      {file && (file.url || file.thumb) ? (
        <img src={file.url || file.thumb} alt={file.name} className="mx-auto max-h-[70vh] rounded-lg border divider" />
      ) : null}
    </Modal>
  );
}
