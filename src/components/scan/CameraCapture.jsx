import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Check, ImageUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

/**
 * Camera modal: live preview → capture → retake / use photo.
 * Uses the rear camera on phones. Falls back to <input capture="environment"> if getUserMedia fails.
 */
export default function CameraCapture({ open, onClose, onCapture }) {
  const { t } = useTranslation();
  const video = useRef(null);
  const stream = useRef(null);
  const fallback = useRef(null);
  const [shot, setShot] = useState(null); // { url, blob }
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) return setError('unsupported');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => {});
      }
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'denied' : 'unavailable');
    }
  }, []);

  useEffect(() => {
    if (open && !shot) start();
    return stop;
  }, [open, shot, start, stop]);

  useEffect(() => {
    if (!open) setShot(null);
  }, [open]);

  const capture = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob((blob) => {
      stop();
      setShot({ blob, url: URL.createObjectURL(blob) });
    }, 'image/jpeg', 0.9);
  };

  const use = () => {
    const file = new File([shot.blob], `camera_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`, { type: 'image/jpeg' });
    onCapture([file]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        stop();
        onClose();
      }}
      title={t('scan.camera.title')}
      description={t('scan.camera.hint')}
      size="lg"
      footer={
        shot ? (
          <>
            <Button variant="secondary" icon={RotateCcw} onClick={() => setShot(null)}>{t('scan.camera.retake')}</Button>
            <Button icon={Check} onClick={use}>{t('scan.camera.use')}</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" icon={ImageUp} onClick={() => fallback.current?.click()}>{t('scan.camera.fromGallery')}</Button>
            <Button icon={Camera} onClick={capture} disabled={!!error}>{t('scan.camera.capture')}</Button>
          </>
        )
      }
    >
      {/* Native fallback: opens the phone camera directly */}
      <input
        ref={fallback}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            onCapture([...e.target.files]);
            onClose();
          }
        }}
      />
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-navy">
        {shot ? (
          <img src={shot.url} alt={t('scan.camera.preview')} className="h-full w-full object-contain" />
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-300">
            <Camera size={32} className="mb-3 opacity-70" aria-hidden />
            <p className="text-sm">{t(`scan.camera.errors.${error}`)}</p>
            <Button className="mt-4" variant="secondary" icon={ImageUp} onClick={() => fallback.current?.click()}>{t('scan.camera.openCameraApp')}</Button>
          </div>
        ) : (
          <>
            <video ref={video} playsInline muted className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-white/60 border-dashed" aria-hidden />
          </>
        )}
      </div>
    </Modal>
  );
}
