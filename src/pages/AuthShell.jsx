import { ShieldCheck, ScanSearch, PhoneCall, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Two-column auth layout: form on the left, trust panel on the right (desktop). */
export default function AuthShell({ title, subtitle, children }) {
  const { t } = useTranslation();
  const points = [
    { icon: ScanSearch, text: t('auth.point1') },
    { icon: ShieldCheck, text: t('auth.point2') },
    { icon: Languages, text: t('auth.point3') },
    { icon: PhoneCall, text: t('auth.point4') },
  ];
  return (
    <div className="flex-1 grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-subtle mt-1 mb-6">{subtitle}</p>}
          {children}
        </div>
      </div>
      <div className="hidden lg:flex surface-2 border-l divider grid-pattern items-center justify-center p-12">
        <div className="card p-8 max-w-md">
          <span className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck size={26} className="text-primary" aria-hidden />
          </span>
          <h2 className="text-xl font-bold">{t('auth.panelTitle')}</h2>
          <p className="text-sm text-subtle mt-1">{t('auth.panelText')}</p>
          <ul className="mt-6 space-y-3">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-body">
                <Icon size={18} className="text-teal shrink-0 mt-0.5" aria-hidden /> {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
