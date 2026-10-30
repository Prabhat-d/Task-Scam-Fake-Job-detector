import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Monitor,
  MonitorStop,
  Camera,
  Upload,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  Phone,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Eye,
  Info,
  Radio
} from 'lucide-react';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import { liveService } from '../../services/liveService.js';
import { playAlertSound, showBrowserNotification } from '../../utils/alerts.js';
import { HELPLINE, CYBERCRIME_URL } from '../../utils/constants.js';

export default function ScreenGuardian() {
  const { t } = useTranslation();
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [lastScannedAt, setLastScannedAt] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoScanTimerRef = useRef(null);

  // Stop screen stream cleanly
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
  }, [stream]);

  // Capture frame from active video stream
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewImage(dataUrl);
    return dataUrl;
  }, []);

  // Send image frame to backend Screen Guardian AI
  const analyzeFrame = useCallback(
    async (imageDataUrl) => {
      if (!imageDataUrl || scanning) return;
      setScanning(true);
      try {
        const res = await liveService.scanScreen({ imageBase64: imageDataUrl });
        setLastAnalysis(res);
        setLastScannedAt(new Date());

        // Trigger Alerts if threat is detected
        if (res.verdict === 'CRITICAL_SCAM' || (res.riskScore && res.riskScore >= 70)) {
          playAlertSound();
          showBrowserNotification(
            '🚨 CyberShield Threat Alert',
            res.headline || 'Dangerous scam detected on your screen!'
          );
          toast.error(res.headline || 'Scam detected on screen!', {
            duration: 6000,
            style: { borderLeft: '4px solid #ef4444' }
          });
        } else if (res.verdict === 'SUSPICIOUS' || (res.riskScore && res.riskScore >= 45)) {
          toast(res.headline || 'Suspicious recruitment visible on screen', {
            icon: '⚠️',
            duration: 5000,
            style: { borderLeft: '4px solid #f59e0b' }
          });
        }
      } catch (err) {
        console.warn('[Screen Guardian] Frame scan error:', err);
      } finally {
        setScanning(false);
      }
    },
    [scanning]
  );

  // Scan current screen immediately
  const handleScanNow = useCallback(() => {
    const frame = captureFrame();
    if (frame) {
      analyzeFrame(frame);
    } else {
      toast.error(t('common.errorText') || 'Unable to grab frame from screen.');
    }
  }, [captureFrame, analyzeFrame, t]);

  // Start Screen Sharing
  const startScreenShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        toast.error('Screen capture is not supported in this browser. Please use Chrome, Edge, or Firefox.');
        return;
      }
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'window' },
        audio: false
      });

      // Handle user stopping share from browser UI bar
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          stopStream();
          toast(t('live.offline') || 'Screen monitoring stopped.', { icon: 'ℹ️' });
        };
      }

      setStream(mediaStream);
      toast.success('Live screen protection activated! Watching for scams in real time.');

      // Wait a moment for video to establish then do first scan
      setTimeout(() => {
        if (videoRef.current) {
          const firstFrame = captureFrame();
          if (firstFrame) analyzeFrame(firstFrame);
        }
      }, 1000);
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('Error starting screen share:', err);
        toast.error('Could not access screen. Please grant permission.');
      }
    }
  };

  // Attach stream to video tag
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Auto-pulse periodic scan every 6 seconds when stream is active
  useEffect(() => {
    if (stream && autoScan) {
      autoScanTimerRef.current = setInterval(() => {
        const frame = captureFrame();
        if (frame) analyzeFrame(frame);
      }, 6000);
    } else if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }
    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, [stream, autoScan, captureFrame, analyzeFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Support manual file upload (for testing screenshots)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      setPreviewImage(dataUrl);
      analyzeFrame(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Support Ctrl+V paste anywhere
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const dataUrl = evt.target.result;
              setPreviewImage(dataUrl);
              analyzeFrame(dataUrl);
              toast.success('Pasted screenshot analyzed!');
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [analyzeFrame]);

  const isThreat = lastAnalysis?.verdict === 'CRITICAL_SCAM' || (lastAnalysis?.riskScore >= 70);
  const isSuspicious = lastAnalysis?.verdict === 'SUSPICIOUS' || (lastAnalysis?.riskScore >= 40 && lastAnalysis?.riskScore < 70);
  const isGenuine = lastAnalysis?.verdict === 'GENUINE_OFFER' || (lastAnalysis?.riskScore < 40 && lastAnalysis?.riskScore > 0);

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Top Controller Bar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${stream ? 'bg-teal pulse-dot' : 'bg-muted'}`} />
              <h2 className="text-lg font-bold text-heading">
                {stream ? 'Live Screen Guardian: Active' : 'Real-Time Screen Tracking'}
              </h2>
              {stream && (
                <span className="badge badge-success text-xs font-semibold px-2 py-0.5">
                  <Radio size={12} className="animate-spin inline mr-1" />
                  Live Monitoring
                </span>
              )}
            </div>
            <p className="text-xs text-subtle">
              {stream
                ? 'CyberShield AI is actively inspecting your active screen/window for predatory task offers and Telegram scams.'
                : 'Share your screen or select your Telegram / WhatsApp / Job board window. The AI continuously analyzes it and alerts you immediately.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!stream ? (
              <>
                <Button variant="primary" icon={Monitor} onClick={startScreenShare}>
                  Start Screen Monitoring
                </Button>
                <Button
                  variant="secondary"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload a screenshot to test"
                >
                  Upload Screenshot
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="teal"
                  icon={RefreshCw}
                  loading={scanning}
                  onClick={handleScanNow}
                  title="Force an instant scan of current screen"
                >
                  Scan Screen Now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAutoScan((v) => !v)}
                  tone={autoScan ? 'success' : 'neutral'}
                >
                  {autoScan ? 'Auto-Scan: ON (6s)' : 'Auto-Scan: Paused'}
                </Button>
                <Button variant="danger" icon={MonitorStop} onClick={stopStream}>
                  Stop Protection
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Main Grid: Screen Viewport on Left | Real-time Guidance on Right */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Screen Preview & Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Screen Viewport"
            subtitle={stream ? 'Watching active application' : 'Waiting for screen share'}
            icon={Eye}
            actions={
              lastScannedAt && (
                <span className="text-[11px] text-subtle mono">
                  Scanned {lastScannedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )
            }
          >
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-line aspect-video flex items-center justify-center">
              {/* Active Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${stream ? 'block' : 'hidden'}`}
              />

              {/* Uploaded or Snapshot Preview if no active video */}
              {!stream && previewImage && (
                <img
                  src={previewImage}
                  alt="Screen capture preview"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Empty Placeholder */}
              {!stream && !previewImage && (
                <div className="text-center p-6 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-navy/40 border border-line flex items-center justify-center mx-auto text-primary">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">No Screen Shared</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Click <b>Start Screen Monitoring</b> above or press <b>Ctrl+V</b> to paste any screenshot directly.
                    </p>
                  </div>
                </div>
              )}

              {/* Cyber Radar Scanning Line Animation while scanning */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/10 via-teal/20 to-transparent animate-pulse border-b-2 border-teal" />
              )}
            </div>

            {/* Quick Status Bar */}
            <div className="mt-3 flex items-center justify-between text-xs text-subtle">
              <span className="flex items-center gap-1.5">
                <Info size={13} />
                <span>Tip: You can select a single window (e.g. Telegram or Chrome) to share.</span>
              </span>
              {scanning && <span className="text-teal font-medium animate-pulse">Analyzing screen with AI...</span>}
            </div>
          </Card>
        </div>

        {/* Right Column: Real-Time Guidance & Alerts (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Verdict Banner */}
          {lastAnalysis ? (
            <div
              className={`p-4 rounded-xl border transition-all ${
                isThreat
                  ? 'bg-danger/10 border-danger/40 text-danger'
                  : isSuspicious
                  ? 'bg-warning/10 border-warning/40 text-amber-500'
                  : isGenuine
                  ? 'bg-success/10 border-success/40 text-emerald-500'
                  : 'bg-page border-line text-heading'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 p-2 rounded-lg bg-white/10 dark:bg-black/20 shrink-0">
                    {isThreat ? (
                      <ShieldAlert size={22} className="text-danger" />
                    ) : isSuspicious ? (
                      <AlertTriangle size={22} className="text-warning" />
                    ) : isGenuine ? (
                      <ShieldCheck size={22} className="text-success" />
                    ) : (
                      <Sparkles size={22} className="text-primary" />
                    )}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm tracking-wide uppercase">
                        {lastAnalysis.verdict || 'ANALYSIS COMPLETE'}
                      </span>
                      {lastAnalysis.detectedApp && (
                        <span className="badge badge-neutral text-xs">{lastAnalysis.detectedApp}</span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/20">
                        Risk: {lastAnalysis.riskScore ?? 0}%
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-heading mt-1">
                      {lastAnalysis.headline || 'Screen Evaluated'}
                    </h3>
                    <p className="text-xs text-body mt-1 leading-relaxed">{lastAnalysis.summary}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-line bg-page text-center space-y-2">
              <Sparkles className="mx-auto text-primary" size={24} />
              <p className="text-sm font-semibold text-heading">Ready to Guard Your Screen</p>
              <p className="text-xs text-subtle max-w-md mx-auto">
                Once monitoring starts, CyberShield AI inspects the active window for task scams, fake appointment letters, and unverified recruiter chats.
              </p>
            </div>
          )}

          {/* TWO MAIN GUIDANCE CARDS: WHAT TO DO vs WHAT NOT TO DO */}
          {lastAnalysis && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* 🟢 WHAT TO DO NEXT */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={18} />
                  <h4 className="text-sm font-bold uppercase tracking-wider">What to Do Next</h4>
                </div>
                <ul className="space-y-2 text-xs text-body">
                  {(lastAnalysis.whatToDo && lastAnalysis.whatToDo.length > 0
                    ? lastAnalysis.whatToDo
                    : [
                        'Immediately stop replying to this contact or message',
                        'Verify company status on official career portals',
                        'Dial 1930 Cybercrime Helpline if money was paid',
                        'Preserve screenshot evidence for police filing'
                      ]
                  ).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap gap-2">
                  <a
                    href={`tel:${HELPLINE}`}
                    className="btn btn-danger btn-sm text-xs inline-flex items-center gap-1.5"
                  >
                    <Phone size={13} />
                    Call 1930
                  </a>
                  <a
                    href={CYBERCRIME_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm text-xs inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} />
                    Report Portal
                  </a>
                </div>
              </div>

              {/* 🔴 WHAT NOT TO DO */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <Ban size={18} />
                  <h4 className="text-sm font-bold uppercase tracking-wider">What NOT to Do</h4>
                </div>
                <ul className="space-y-2 text-xs text-body">
                  {(lastAnalysis.whatNotToDo && lastAnalysis.whatNotToDo.length > 0
                    ? lastAnalysis.whatNotToDo
                    : [
                        'Do NOT pay any registration fee or security deposit',
                        'Never share your UPI PIN or bank OTP with anyone',
                        'Do NOT download APK files or apps from Telegram',
                        'Do NOT click external shorten links or pay for combo tasks'
                      ]
                  ).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <XCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-300 font-medium">
                  ⚠️ Remember: Legitimate companies and recruitment agencies in India NEVER demand fees or payment to provide work.
                </div>
              </div>
            </div>
          )}

          {/* Detected Entities (UPI, Phones, Handles) */}
          {lastAnalysis?.detectedEntities && (
            <Card title="Detected On-Screen Indicators" subtitle="Forensic entities extracted from your screen" icon={ShieldAlert}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-page border border-line">
                  <p className="text-[10px] uppercase text-subtle font-semibold">Claimed Employer</p>
                  <p className="font-semibold text-heading mt-0.5 truncate">
                    {lastAnalysis.detectedEntities.claimedCompany || 'Not specified'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-page border border-line">
                  <p className="text-[10px] uppercase text-subtle font-semibold">Financial Demand</p>
                  <p className="font-semibold text-danger mt-0.5 truncate">
                    {lastAnalysis.detectedEntities.financialDemand || 'None detected'}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-page border border-line">
                  <p className="text-[10px] uppercase text-subtle font-semibold">Flagged UPI IDs</p>
                  <p className="font-semibold text-heading mt-0.5 truncate mono">
                    {lastAnalysis.detectedEntities.upiIds?.length > 0
                      ? lastAnalysis.detectedEntities.upiIds.join(', ')
                      : 'None'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}