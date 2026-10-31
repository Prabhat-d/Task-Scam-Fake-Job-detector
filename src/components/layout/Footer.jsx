import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CallHelplineButton from '../common/CallHelplineButton.jsx';
import Logo from './Logo.jsx';
import { CYBERCRIME_URL } from '../../utils/constants.js';

/** Dark footer: About, Quick links, Safety tips, Emergency. */
export default function Footer() {
  const { t } = useTranslation();
  const quick = [
    ['/scan', t('nav.scan')],
    ['/live', t('nav.live')],
    ['/history', t('nav.history')],
    ['/threat-map', t('nav.threatMap')],
  ];
  const tips = [t('footer.tip1'), t('footer.tip2'), t('footer.tip3'), t('footer.tip4')];
  return (
    <footer className="bg-slatenavy text-slate-300 border-t border-ink mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">{t('footer.about')}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{t('footer.quickLinks')}</h3>
          <ul className="space-y-2 text-sm">
            {quick.map(([to, label]) => (
              <li key={to}><Link to={to} className="text-slate-400 hover:text-white">{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{t('footer.safetyTips')}</h3>
          <ul className="space-y-2 text-sm text-slate-400 list-disc pl-4 marker:text-teal">
            {tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">{t('footer.emergency')}</h3>
          <CallHelplineButton className="w-full sm:w-auto" />
          <a href={CYBERCRIME_URL} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 text-sm text-slate-300 hover:text-white">
            cybercrime.gov.in <ExternalLink size={14} aria-hidden />
          </a>
          <p className="mt-2 text-xs text-slate-400">{t('footer.emergencyNote')}</p>
        </div>
      </div>
      <div className="border-t border-ink">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-slate-400">© 2026 TrustMatrix · {t('footer.managedBy')} DAXDEV Team</p>
      </div>
    </footer>
  );
}
