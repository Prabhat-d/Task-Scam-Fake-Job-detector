import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, X, Send, Trash2, Phone, ExternalLink, ScanSearch, Map, Loader2, ShieldAlert } from 'lucide-react';
import VerdictChip from '../common/VerdictChip.jsx';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { looksLikeOffer, quickCheck } from '../../chat/assistant.js';
import { loc } from '../../utils/formatters.js';
import { HELPLINE, CYBERCRIME_URL } from '../../utils/constants.js';
import { getDb } from '../../mocks/db.js';
import { USE_MOCK } from '../../api/axios.js';
import { ENTITY_SEED } from '../../mocks/data.js';

const SUGGESTIONS = ['offer', 'fee', 'paid', 'news'];

/** Verdict card for a pasted offer / chat. */
function CheckCard({ check }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="rounded-lg border divider bg-white dark:bg-slatenavy p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{t('chat.checkTitle')}</p>
        <VerdictChip verdict={check.verdict} score={check.score} />
      </div>
      <p className="text-sm text-heading font-medium">{loc(check.summary, i18n.language)}</p>
      {check.flags?.length > 0 ? (
        <ul className="space-y-1">
          {check.flags.map((f, i) => (
            <li key={i} className="text-xs text-body flex gap-1.5">
              <ShieldAlert size={13} className="text-danger shrink-0 mt-0.5" aria-hidden />
              <span>
                {loc(f.title, i18n.language)}
                {f.evidence && <span className="mono text-subtle"> – “{f.evidence}”</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-subtle">{t('chat.noFlags')}</p>
      )}
      {check.nextMove && (
        <p className="text-xs rounded-md bg-warning/10 px-2 py-1.5 text-body">
          <span className="font-semibold">{t('chat.nextMove')}: </span>
          {loc(check.nextMove, i18n.language)}
        </p>
      )}
    </div>
  );
}

function Actions({ actions = [], source, onDone }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  if (!actions.length) return null;
  const go = (to, state) => {
    onDone();
    if (user) navigate(to, { state });
    else navigate('/login', { state: { from: { pathname: to } } });
  };
  const cls = 'inline-flex items-center gap-1 rounded-full border divider px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary';
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {actions.includes('call') && (
        <a href={`tel:${HELPLINE}`} className={`${cls} !border-danger/40 text-danger`}>
          <Phone size={12} aria-hidden /> {t('chat.actions.call', { n: HELPLINE })}
        </a>
      )}
      {actions.includes('portal') && (
        <a href={CYBERCRIME_URL} target="_blank" rel="noreferrer" className={cls}>
          <ExternalLink size={12} aria-hidden /> {t('chat.actions.portal')}
        </a>
      )}
      {actions.includes('scan') && (
        <button type="button" className={cls} onClick={() => go('/scan', source && looksLikeOffer(source) ? { text: source } : null)}>
          <ScanSearch size={12} aria-hidden /> {t('chat.actions.scan')}
        </button>
      )}
      {actions.includes('threats') && (
        <button type="button" className={cls} onClick={() => go('/threat-map')}>
          <Map size={12} aria-hidden /> {t('chat.actions.threats')}
        </button>
      )}
    </div>
  );
}

/**
 * Floating AI safety assistant (bottom-right on every user page).
 * Answers scam-safety questions and checks pasted job offers / chats as you type.
 */
export default function SafetyChatbot({ raised = false }) {
  const { t, i18n } = useTranslation();
  const { open, messages, thinking, toggle, setOpen, send, clear } = useChatStore();
  const [draft, setDraft] = useState('');
  const [live, setLive] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Live risk preview while a long offer is being pasted/typed.
  useEffect(() => {
    if (!looksLikeOffer(draft)) {
      setLive(null);
      return undefined;
    }
    const id = setTimeout(() => {
      let db = ENTITY_SEED;
      try {
        if (USE_MOCK) db = getDb().entities;
      } catch {
        /* use the seed list */
      }
      setLive(quickCheck(draft, db));
    }, 300);
    return () => clearTimeout(id);
  }, [draft]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const submit = (text = draft) => {
    if (!text.trim() || thinking) return;
    send(text, i18n.language);
    setDraft('');
    setLive(null);
  };

  const bottom = raised ? 'bottom-36 md:bottom-6' : 'bottom-20 lg:bottom-6';
  const showSuggestions = useMemo(() => messages.length === 1, [messages.length]);

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={t('chat.title')}
          className={`fixed right-4 ${raised ? 'bottom-[13.5rem] md:bottom-24' : 'bottom-36 lg:bottom-24'} z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(70vh,560px)] max-h-[calc(100dvh-15rem)] lg:max-h-[calc(100dvh-8rem)] card shadow-2xl flex flex-col overflow-hidden animate-slideIn`}
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-navy text-white">
            <span className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-tight">{t('chat.title')}</p>
              <p className="text-[11px] text-slate-300 truncate">{t('chat.subtitle')}</p>
            </div>
            <button type="button" onClick={clear} className="p-1.5 rounded hover:bg-white/10" aria-label={t('chat.clear')} title={t('chat.clear')}>
              <Trash2 size={16} />
            </button>
            <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-white/10" aria-label={t('chat.close')}>
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto scroll-thin px-3 py-3 space-y-3 bg-page dark:bg-navy" aria-live="polite">
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-white px-3 py-2 text-sm whitespace-pre-line break-words">{m.text}</p>
                </div>
              ) : (
                <div key={m.id} className="flex gap-2">
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bot size={14} aria-hidden />
                  </span>
                  <div className="max-w-[85%] min-w-0">
                    {m.welcome ? (
                      <p className="rounded-2xl rounded-tl-sm bg-white dark:bg-slatenavy border divider px-3 py-2 text-sm text-body">{t('chat.welcome')}</p>
                    ) : m.error ? (
                      <p className="rounded-2xl rounded-tl-sm panel-danger px-3 py-2 text-sm">{t('chat.error')}</p>
                    ) : (
                      <>
                        {m.reply?.text && (
                          <p className="rounded-2xl rounded-tl-sm bg-white dark:bg-slatenavy border divider px-3 py-2 text-sm text-body whitespace-pre-line break-words">
                            {loc(m.reply.text, i18n.language)}
                          </p>
                        )}
                        {m.reply?.check && <CheckCard check={m.reply.check} />}
                        <Actions actions={m.reply?.actions} source={m.source} onDone={() => setOpen(false)} />
                      </>
                    )}
                  </div>
                </div>
              )
            )}
            {thinking && (
              <div className="flex items-center gap-2 text-xs text-subtle pl-9">
                <Loader2 size={14} className="animate-spin" aria-hidden /> {t('chat.thinking')}
              </div>
            )}
            {showSuggestions && (
              <div className="flex flex-wrap gap-1.5 pl-9">
                {SUGGESTIONS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => submit(t(`chat.suggest.${k}`))}
                    className="rounded-full border border-primary/40 text-primary bg-white dark:bg-slatenavy px-2.5 py-1 text-xs font-medium hover:bg-primary/5"
                  >
                    {t(`chat.suggest.${k}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="border-t divider p-2.5 bg-white dark:bg-slatenavy"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {live && (
              <div className="flex items-center justify-between gap-2 px-1 pb-2 text-xs text-subtle">
                <span>{t('chat.liveCheck')}</span>
                <VerdictChip verdict={live.verdict} score={live.score} />
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={t('chat.placeholder')}
                aria-label={t('chat.placeholder')}
                className="input flex-1 resize-none max-h-32 min-h-[40px] py-2"
              />
              <button type="submit" className="btn btn-primary h-10 w-10 !p-0 shrink-0" disabled={!draft.trim() || thinking} aria-label={t('chat.send')}>
                <Send size={16} aria-hidden />
              </button>
            </div>
            <p className="text-[10px] text-subtle mt-1.5 px-1">{t('chat.disclaimer', { n: HELPLINE })}</p>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? t('chat.close') : t('chat.open')}
        className={`fixed right-4 ${bottom} z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform`}
      >
        {open ? <X size={22} aria-hidden /> : <Bot size={24} aria-hidden />}
        {!open && <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-teal ring-2 ring-white dark:ring-slatenavy pulse-dot" aria-hidden />}
      </button>
    </>
  );
}
