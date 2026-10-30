import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HELPLINE } from '../../utils/constants.js';

/** Floating "Call 1930" button on mobile so help is always one tap away. */
export default function SosButton() {
  const { t } = useTranslation();
  return (
    <a
      href={`tel:${HELPLINE}`}
      className="lg:hidden fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 h-12 pl-4 pr-5 rounded-full bg-danger text-white font-semibold shadow-lg shadow-danger/30"
      aria-label={t('actions.call1930Aria')}
    >
      <Phone size={18} aria-hidden /> {HELPLINE}
    </a>
  );
}
