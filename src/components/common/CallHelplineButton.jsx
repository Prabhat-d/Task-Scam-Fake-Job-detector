import { useEffect, useState } from 'react';
import { PhoneCall, Copy, ExternalLink, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Modal from './Modal.jsx';
import { HELPLINE, CYBERCRIME_URL } from '../../utils/constants.js';

const TEL = `tel:${HELPLINE}`;
const FALLBACK_EVENT = 'tm:call-fallback';

/**
 * After a tap on tel:1930, wait to see if a dialer took over (the page blurs or is hidden).
 * If nothing happened (desktop browser, device simulator, no calling app), show the fallback.
 * The tel: navigation itself is never blocked, so phones and desktop calling apps
 * (Phone Link, FaceTime, Skype) still work.
 */
export function watchForDialer() {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  let handedOff = false;
  const mark = () => {
    handedOff = true;
  };
  const onVis = () => document.visibilityState === 'hidden' && mark();
  window.addEventListener('blur', mark);
  window.addEventListener('pagehide', mark);
  document.addEventListener('visibilitychange', onVis);
  setTimeout(() => {
    window.removeEventListener('blur', mark);
    window.removeEventListener('pagehide', mark);
    document.removeEventListener('visibilitychange', onVis);
    if (!handedOff) window.dispatchEvent(new Event(FALLBACK_EVENT));
  }, ios ? 3000 : 1500);
}

/**
 * The one "Call 1930" button used across the app: a real <a href="tel:1930"> in danger red
 * with a phone icon. `compact` shows just the number (navbar / floating SOS).
 */
export default function CallHelplineButton({ className = '', size = 'md', compact = false, children, iconSize, ...rest }) {
  const { t } = useTranslation();
  const sizeCls = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : '';
  const icon = iconSize || (size === 'lg' ? 20 : size === 'sm' ? 14 : 16);
  return (
    <a
      href={TEL}
      className={`btn btn-danger ${sizeCls} ${className}`}
      aria-label={t('actions.call1930Aria')}
      onClick={watchForDialer}
      {...rest}
    >
      <PhoneCall size={icon} aria-hidden />
      {children ?? (compact ? HELPLINE : t('actions.call1930'))}
    </a>
  );
}

/** Mounted once (App.jsx): explains how to reach 1930 when the device could not start a call. */
export function HelplineFallback() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(FALLBACK_EVENT, show);
    return () => window.removeEventListener(FALLBACK_EVENT, show);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(HELPLINE);
      toast.success(t('actions.callFallback.copied'));
    } catch {
      toast.error(t('common.copyFailed'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      size="sm"
      title={t('actions.callFallback.title')}
      description={t('actions.callFallback.text')}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={copy}>
            <Copy size={16} aria-hidden /> {t('actions.callFallback.copy')}
          </button>
          <a href={CYBERCRIME_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {t('actions.callFallback.portal')} <ExternalLink size={16} aria-hidden />
          </a>
        </>
      }
    >
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="text-center sm:text-left flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{t('actions.callFallback.helpline')}</p>
          <a href={TEL} className="block text-5xl font-bold text-danger tracking-wider mt-1">{HELPLINE}</a>
          <p className="text-sm text-body mt-2">{t('actions.callFallback.dialManually')}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-lg bg-white p-2 border divider">
            <QRCodeSVG value={TEL} size={112} aria-label={t('actions.callFallback.qrAria')} />
          </div>
          <p className="text-xs text-subtle inline-flex items-center gap-1">
            <Smartphone size={12} aria-hidden /> {t('actions.callFallback.scan')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
