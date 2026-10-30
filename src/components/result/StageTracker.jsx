import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TASK_STAGES, JOB_STAGES } from '../../utils/constants.js';

/**
 * Horizontal stage tracker for the scam script.
 * track: 'task' (6 steps) or 'job' (4 steps). stage: current index (−1 = none).
 */
export default function StageTracker({ track = 'task', stage = -1, compact = false }) {
  const { t } = useTranslation();
  const stages = track === 'job' ? JOB_STAGES : TASK_STAGES;
  return (
    <div className="overflow-x-auto scroll-thin -mx-1 px-1 pb-1">
      <ol className={`flex items-start ${compact ? 'min-w-[480px]' : 'min-w-[560px]'}`} aria-label={t('result.stageTitle')}>
        {stages.map((key, i) => {
          const state = i < stage ? 'past' : i === stage ? 'current' : 'future';
          return (
            <li key={key} className="flex-1 flex flex-col items-center text-center relative" aria-current={state === 'current' ? 'step' : undefined}>
              {i > 0 && (
                <span className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${i <= stage ? 'bg-danger' : 'bg-line dark:bg-ink'}`} aria-hidden />
              )}
              <span
                className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  state === 'past'
                    ? 'bg-danger border-danger text-white'
                    : state === 'current'
                      ? 'bg-white border-danger text-danger ring-4 ring-danger/20 dark:bg-slatenavy'
                      : 'bg-white border-line text-muted dark:bg-slatenavy dark:border-ink dark:text-slate-400'
                }`}
              >
                {state === 'past' ? <Check size={14} aria-hidden /> : i + 1}
              </span>
              <span className={`mt-2 text-xs leading-tight px-1 ${state === 'current' ? 'font-bold text-danger' : state === 'past' ? 'text-heading font-medium' : 'text-subtle'}`}>
                {t(`stages.${track}.${key}`)}
              </span>
              {state === 'current' && <span className="mt-1 chip bg-danger text-white !text-[10px]">{t('result.youAreHere')}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
