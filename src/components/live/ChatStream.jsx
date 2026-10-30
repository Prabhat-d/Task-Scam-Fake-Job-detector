import { useEffect, useRef } from 'react';
import { AlertTriangle, ShieldAlert, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyState from '../common/EmptyState.jsx';

const LEVEL = {
  normal: { bubble: 'bg-page border-line dark:bg-navy dark:border-ink', icon: null },
  suspicious: { bubble: 'bg-warningSoft border-warning/60 dark:bg-warning/10', icon: AlertTriangle, iconCls: 'text-warning' },
  dangerous: { bubble: 'bg-dangerSoft border-danger/60 dark:bg-danger/10', icon: ShieldAlert, iconCls: 'text-danger' },
};

/** Real-time chat stream. Messages are colour-coded AND labelled (normal / suspicious / dangerous). */
export default function ChatStream({ messages = [] }) {
  const { t } = useTranslation();
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  if (!messages.length) return <EmptyState icon={MessageCircle} title={t('live.waiting')} text={t('live.waitingText')} />;

  return (
    <ol className="space-y-3" aria-live="polite" aria-relevant="additions">
      {messages.map((m) => {
        const lv = LEVEL[m.level] || LEVEL.normal;
        const Icon = lv.icon;
        return (
          <li key={m.id} className={`flex ${m.self ? 'justify-end' : 'justify-start'} animate-slideIn`}>
            <div className={`max-w-[85%] rounded-xl border px-3.5 py-2.5 ${m.self ? 'bg-primary/10 border-primary/20' : lv.bubble}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-heading">{m.self ? t('live.you') : m.from}</span>
                {!m.self && m.level !== 'normal' && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${lv.iconCls}`}>
                    {Icon && <Icon size={12} aria-hidden />} {t(`live.level.${m.level}`)}
                  </span>
                )}
                <span className="ml-auto text-[10px] text-subtle mono">{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-body">{m.text}</p>
            </div>
          </li>
        );
      })}
      <li ref={end} aria-hidden />
    </ol>
  );
}
