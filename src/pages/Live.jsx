import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Send, Link2, Copy, Radio, RotateCcw, Phone, FileWarning, ShieldAlert, Bot, BellRing, MessagesSquare } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import { SkeletonRows } from '../components/common/Skeleton.jsx';
import { ErrorState } from '../components/common/EmptyState.jsx';
import ChatStream from '../components/live/ChatStream.jsx';
import LiveRiskMeter from '../components/live/LiveRiskMeter.jsx';
import StageTracker from '../components/result/StageTracker.jsx';
import NextMoveAlert from '../components/result/NextMoveAlert.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { liveService } from '../services/liveService.js';
import { getSocket } from '../socket/socket.js';
import { USE_MOCK } from '../api/axios.js';
import { HELPLINE, CYBERCRIME_URL, TASK_STAGES } from '../utils/constants.js';
import { playAlertSound, ensureNotificationPermission, showBrowserNotification } from '../utils/alerts.js';

/** Pulsing teal "Live" pill. */
function LiveBadge({ on }) {
  const { t } = useTranslation();
  return (
    <span className={`chip ${on ? 'bg-navy text-white dark:bg-black/40' : 'bg-page text-muted border border-line dark:bg-navy dark:border-ink'}`}>
      <span className={`h-2 w-2 rounded-full ${on ? 'bg-teal pulse-dot' : 'bg-muted'}`} aria-hidden />
      {on ? t('live.live') : t('live.offline')}
    </span>
  );
}

export default function Live() {
  const { t } = useTranslation();
  const session = useAsync(() => liveService.sessions(), []);
  const [connecting, setConnecting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [risk, setRisk] = useState(0);
  const [stage, setStage] = useState(-1);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');

  const connected = !!session.data?.connected;

  // Start the stream (in mock mode this replays a scripted Telegram scam chat).
  useEffect(() => {
    if (!connected) return undefined;
    const s = getSocket();
    s?.emit('live:start');
    return () => s?.emit('live:stop');
  }, [connected]);

  useSocketEvent('live:message', (m) => {
    setMessages((prev) => [...prev, m]);
    if (typeof m.risk === 'number') setRisk(m.risk);
    if (typeof m.stage === 'number') setStage((s) => Math.max(s, m.stage));
  });

  useSocketEvent('live:stage_changed', ({ stage: next, risk: r }) => {
    setStage(next);
    if (typeof r === 'number') setRisk(r);
    const name = t(`stages.task.${TASK_STAGES[next]}`);
    toast.error(t('live.stageToast', { stage: name }), { duration: 6000, style: { borderLeft: '4px solid #ef4444' } });
    playAlertSound();
    showBrowserNotification(t('live.stageNotifTitle'), t('live.stageToast', { stage: name }));
  });

  const askNotif = async () => {
    await ensureNotificationPermission();
    setNotifPerm(Notification.permission);
  };

  const connect = async () => {
    setConnecting(true);
    try {
      await liveService.connectTelegram();
      await session.reload();
      toast.success(t('live.connected'));
    } catch {
      toast.error(t('common.errorText'));
    } finally {
      setConnecting(false);
    }
  };

  const replay = () => {
    setMessages([]);
    setRisk(0);
    setStage(-1);
    getSocket()?.emit('live:start');
  };

  const copy = async (v) => {
    try {
      await navigator.clipboard.writeText(v);
      toast.success(t('common.copied'));
    } catch {
      toast.error(t('common.copyFailed'));
    }
  };

  const nextMove = stage >= 0 ? t(`nextMove.task.${Math.min(stage, 5)}`) : null;

  return (
    <div className="mx-auto max-w-7xl w-full px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{t('live.title')}</h1>
            <LiveBadge on={connected} />
          </div>
          <p className="text-sm text-subtle mt-1">{t('live.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {notifPerm === 'default' && <Button variant="secondary" size="sm" icon={BellRing} onClick={askNotif}>{t('live.enableAlerts')}</Button>}
          {USE_MOCK && connected && <Button variant="secondary" size="sm" icon={RotateCcw} onClick={replay}>{t('live.replay')}</Button>}
        </div>
      </div>

      {/* Telegram connection */}
      <Card title={t('live.botTitle')} subtitle={t('live.botSub')} icon={Bot} actions={session.data && <Badge tone={connected ? 'success' : 'neutral'}>{connected ? t('live.statusConnected') : t('live.statusNotConnected')}</Badge>}>
        {session.loading ? (
          <SkeletonRows rows={2} />
        ) : session.error ? (
          <ErrorState onRetry={session.reload} />
        ) : (
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="p-3 rounded-xl bg-white border border-line self-start">
              <QRCodeSVG value={session.data.deepLink} size={112} fgColor="#0f172a" aria-label={t('live.qrAria')} />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <ol className="text-sm text-body space-y-1 list-decimal pl-5">
                <li>{t('live.step1')}</li>
                <li>{t('live.step2')}</li>
                <li>{t('live.step3')}</li>
              </ol>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip bg-navy text-white mono dark:bg-black/40"><Send size={12} aria-hidden /> @{session.data.botUsername}</span>
                <a href={session.data.deepLink} target="_blank" rel="noreferrer" className="mono text-xs text-primary hover:underline truncate max-w-[260px] inline-flex items-center gap-1">
                  <Link2 size={12} aria-hidden /> {session.data.deepLink}
                </a>
                <button type="button" className="icon-btn h-7 w-7" onClick={() => copy(session.data.deepLink)} aria-label={t('common.copyValue', { value: session.data.deepLink })}><Copy size={13} /></button>
              </div>
            </div>
            {!connected && <Button variant="teal" icon={Radio} loading={connecting} onClick={connect}>{t('live.connect')}</Button>}
          </div>
        )}
      </Card>

      {/* Two-column: chat stream | risk panel */}
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3" title={t('live.chatTitle')} subtitle={session.data?.sessions?.[0]?.chatName} icon={MessagesSquare} actions={<LiveBadge on={connected} />} bodyClassName="p-4 h-[520px] overflow-y-auto scroll-thin">
          <ChatStream messages={messages} />
        </Card>

        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-20 self-start">
          <Card title={t('live.riskTitle')} icon={ShieldAlert}>
            <LiveRiskMeter risk={risk} />
          </Card>
          <Card title={t('result.stageTitle')}>
            <StageTracker track="task" stage={stage} compact />
            <div className="mt-4">
              <NextMoveAlert text={nextMove} />
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            <a href={`tel:${HELPLINE}`} className="btn btn-danger btn-lg col-span-2"><Phone size={18} aria-hidden /> {t('actions.call1930')}</a>
            <a href={CYBERCRIME_URL} target="_blank" rel="noreferrer" className="btn btn-secondary"><FileWarning size={16} aria-hidden /> {t('actions.reportShort')}</a>
            <Button variant="secondary" to="/scan" icon={ShieldAlert}>{t('live.scanFull')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
