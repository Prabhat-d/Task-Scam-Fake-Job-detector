import { Flag, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Badge from '../common/Badge.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { loc } from '../../utils/formatters.js';

const TONE = { critical: 'danger', high: 'danger', medium: 'warning', low: 'neutral' };

/** Red flags with severity, plain-language reason and the exact evidence. Click → highlight in text. */
export default function RedFlagList({ flags = [], activeId, onSelect }) {
  const { t, i18n } = useTranslation();
  if (!flags.length) return <EmptyState icon={Flag} title={t('result.noFlags')} text={t('result.noFlagsText')} />;
  return (
    <ul className="space-y-2">
      {flags.map((f) => {
        const active = f.id === activeId;
        return (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onSelect?.(active ? null : f.id)}
              aria-pressed={active}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${active ? 'border-danger bg-dangerSoft dark:bg-danger/10' : 'border-line hover:bg-page dark:border-ink dark:hover:bg-navy'}`}
            >
              <div className="flex items-start gap-3">
                <Badge tone={TONE[f.severity]} className="mt-0.5 uppercase !text-[10px] tracking-wide">{t(`severity.${f.severity}`)}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-heading">{loc(f.title, i18n.language)}</p>
                  <p className="text-sm text-subtle mt-0.5">{loc(f.explanation, i18n.language)}</p>
                  {f.evidence && (
                    <p className="mt-2 text-xs">
                      <span className="text-subtle">{t('result.evidence')}: </span>
                      <mark className="evidence mono">“{f.evidence}”</mark>
                    </p>
                  )}
                </div>
                <ChevronRight size={16} className={`text-muted shrink-0 mt-1 transition-transform ${active ? 'rotate-90' : ''}`} aria-hidden />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
