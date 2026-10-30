/** Short two-tone alert beep generated with Web Audio (no audio file needed). */
export function playAlertSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.17);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* audio blocked – ignore */
  }
}

/** Ask for browser notification permission once (remembered in localStorage). */
export async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  if (localStorage.getItem('notifAsked')) return false;
  localStorage.setItem('notifAsked', '1');
  return (await Notification.requestPermission()) === 'granted';
}

export function showBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.svg' });
    } catch {
      /* some mobile browsers only allow SW notifications */
    }
  }
}

/** Read text aloud in the chosen language with the Web Speech API. Returns a stop function. */
export function speak(text, langTag, { onEnd } = {}) {
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langTag;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith(langTag.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = 0.95;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return () => window.speechSynthesis.cancel();
}
