import { useTranslation } from 'react-i18next';
import { ScanSearch, LogIn, Upload, Cpu, ShieldAlert, Send, ThumbsUp, Briefcase, Wallet, Users, FileWarning, Star, Quote, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import Skeleton from '../components/common/Skeleton.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { statsService } from '../services/statsService.js';
import { useAuthStore } from '../store/authStore.js';
import { formatNumber } from '../utils/formatters.js';

/** Decorative shield illustration (primary/teal, light). */
function ShieldArt() {
  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-sm mx-auto" aria-hidden>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" stopOpacity=".18" />
          <stop offset="1" stopColor="#0d9488" stopOpacity=".12" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="150" fill="none" stroke="#3b82f6" strokeOpacity=".12" strokeDasharray="4 8" />
      <circle cx="160" cy="160" r="115" fill="none" stroke="#0d9488" strokeOpacity=".15" />
      <path d="M160 52c28 22 62 30 92 30v78c0 58-40 92-92 110-52-18-92-52-92-110V82c30 0 64-8 92-30z" fill="url(#sg)" stroke="#3b82f6" strokeWidth="3" />
      <path d="M160 82c20 14 44 20 64 21v57c0 41-28 66-64 79-36-13-64-38-64-79v-57c20-1 44-7 64-21z" fill="#fff" className="dark:fill-slatenavy" stroke="#3b82f6" strokeOpacity=".35" />
      <path d="m130 160 22 22 40-44" fill="none" stroke="#0d9488" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="#ef4444"><circle cx="58" cy="96" r="5" /><circle cx="270" cy="230" r="4" /></g>
      <g fill="#f59e0b"><circle cx="262" cy="84" r="4" /><circle cx="48" cy="226" r="5" /></g>
      <g fill="#10b981"><circle cx="160" cy="300" r="4" /></g>
    </svg>
  );
}

function Counter({ value, label, tone }) {
  const v = useCountUp(value);
  const { i18n } = useTranslation();
  return (
    <div className="card px-4 py-3">
      <p className={`text-2xl font-bold tabular-nums ${tone}`}>{formatNumber(v, i18n.language)}</p>
      <p className="text-xs text-subtle mt-0.5">{label}</p>
    </div>
  );
}

export default function Landing() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, loading } = useAsync(() => statsService.threats(), []);

  const steps = [
    { icon: Upload, title: t('landing.step1Title'), text: t('landing.step1Text') },
    { icon: Cpu, title: t('landing.step2Title'), text: t('landing.step2Text') },
    { icon: ShieldAlert, title: t('landing.step3Title'), text: t('landing.step3Text') },
    { icon: Send, title: t('landing.step4Title'), text: t('landing.step4Text') },
  ];
  const types = [
    { icon: ThumbsUp, key: 'likeEarn', tone: 'text-danger bg-danger/10' },
    { icon: Wallet, key: 'prepaidTask', tone: 'text-danger bg-danger/10' },
    { icon: FileWarning, key: 'fakeOffer', tone: 'text-warning bg-warning/10' },
    { icon: Briefcase, key: 'dataEntry', tone: 'text-warning bg-warning/10' },
    { icon: Star, key: 'reviewRating', tone: 'text-primary bg-primary/10' },
    { icon: Users, key: 'privateGroup', tone: 'text-teal bg-teal/10' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b divider">
        <div className="absolute inset-0 grid-pattern [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-teal/10 text-teal mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal pulse-dot" aria-hidden /> {t('landing.badge')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
              {t('landing.title1')} <span className="text-primary">{t('landing.title2')}</span>
            </h1>
            <p className="mt-5 text-lg text-body max-w-xl">{t('landing.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/scan" size="lg" icon={ScanSearch}>{t('landing.ctaScan')}</Button>
              {!user && <Button to="/login" size="lg" variant="secondary" icon={LogIn}>{t('auth.login')}</Button>}
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
              {loading || !data ? (
                [0, 1, 2].map((i) => <Skeleton key={i} className="h-[68px]" rounded="rounded-xl" />)
              ) : (
                <>
                  <Counter value={data.counters.scamsToday} label={t('landing.counterScams')} tone="text-danger" />
                  <Counter value={data.counters.usersProtected} label={t('landing.counterUsers')} tone="text-teal" />
                  <Counter value={data.counters.flaggedUpi} label={t('landing.counterUpi')} tone="text-navy dark:text-white" />
                </>
              )}
            </div>
          </div>
          <ShieldArt />
        </div>
      </section>

      {/* How it works */}
      <section className="surface-2 border-b divider">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold text-center">{t('landing.howTitle')}</h2>
          <p className="text-subtle text-center mt-2">{t('landing.howSubtitle')}</p>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card card-hover p-5 relative">
                <span className="absolute top-4 right-4 mono text-xs text-subtle">0{i + 1}</span>
                <span className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon size={20} aria-hidden /></span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="text-sm text-subtle mt-1">{text}</p>
                {i < steps.length - 1 && <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-line dark:text-ink z-10" size={22} aria-hidden />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Common scam types */}
      <section className="border-b divider">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold text-center">{t('landing.typesTitle')}</h2>
          <p className="text-subtle text-center mt-2">{t('landing.typesSubtitle')}</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map(({ icon: Icon, key, tone }) => (
              <article key={key} className="card card-hover p-5">
                <span className={`h-10 w-10 rounded-lg flex items-center justify-center ${tone}`}><Icon size={20} aria-hidden /></span>
                <h3 className="mt-4 font-semibold">{t(`scamTypes.${key}.title`)}</h3>
                <p className="text-sm text-subtle mt-1">{t(`scamTypes.${key}.text`)}</p>
                <p className="mt-3 text-xs font-medium text-danger">{t(`scamTypes.${key}.sign`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="surface-2">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold text-center">{t('landing.testimonialsTitle')}</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <figure key={i} className="card p-5">
                <Quote size={20} className="text-primary/60" aria-hidden />
                <blockquote className="mt-3 text-sm text-body">{t(`landing.testimonial${i}`)}</blockquote>
                <figcaption className="mt-4 text-xs text-subtle">{t(`landing.testimonial${i}By`)}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button to="/scan" size="lg" icon={ScanSearch}>{t('landing.ctaScan')}</Button>
          </div>
        </div>
      </section>
    </>
  );
}
