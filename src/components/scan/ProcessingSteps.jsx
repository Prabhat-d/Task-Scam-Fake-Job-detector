import { Check, Loader2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PROCESSING_STEPS } from '../../utils/constants.js';

/** Ticking step list. `done` = number of completed steps (0–6). */
export default function ProcessingSteps({ done = 0, failed = false }) {
  const { t } = useTranslation();
  return (
    <ol className="space-y-1" aria-live="polite">
      {PROCESSING_STEPS.map((key, i) => {
        const state = i < done ? 'done' : i === done && !failed ? 'active' : i === done && failed ? 'failed' : 'pending';
        return (
          <li key={key} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${state === 'active' ? 'bg-primary/5' : ''}`}>
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                state === 'done' ? 'bg-success text-white' : state === 'active' ? 'bg-primary/10 text-primary' : state === 'failed' ? 'bg-danger text-white' : 'bg-page text-muted border border-line dark:bg-navy dark:border-ink'
              }`}
            >
              {state === 'done' ? <Check size={14} aria-hidden /> : state === 'active' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Circle size={6} fill="currentColor" aria-hidden />}
            </span>
            <span className={`text-sm ${state === 'pending' ? 'text-subtle' : 'text-heading font-medium'}`}>{t(`processing.steps.${key}`)}</span>
            <span className="ml-auto text-xs text-subtle">{t(`processing.state.${state}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
