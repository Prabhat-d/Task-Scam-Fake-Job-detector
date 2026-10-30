/**
 * Fake socket.io server for mock mode. Same API surface the app uses: on/off/emit/connect/disconnect.
 * It simulates: scan progress, a live Telegram chat arriving message by message, stage changes,
 * notifications, headline updates and new threat-feed items every few seconds.
 */
import { LIVE_SCRIPT, CITIES, SCAM_SCRIPTS } from './data.js';
import { getDb, saveDb } from './db.js';

/* ---------- Shared bus so mock REST handlers can "broadcast" ---------- */
const listeners = new Map();
export const bus = {
  dispatch(event, payload) {
    (listeners.get(event) || []).forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('[mock socket]', event, e);
      }
    });
  },
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const ALERTS = [
  { title: { en: 'New alert: "Review & earn" scam', hi: 'नया अलर्ट: "रिव्यू करो और कमाओ" ठगी', pa: 'ਨਵਾਂ ਅਲਰਟ: "ਰਿਵਿਊ ਕਰੋ ਤੇ ਕਮਾਓ" ਠੱਗੀ' }, body: { en: 'Fake hotel-rating tasks are spreading on WhatsApp.', hi: 'WhatsApp पर नकली होटल-रेटिंग टास्क फैल रहे हैं।', pa: 'WhatsApp \'ਤੇ ਨਕਲੀ ਹੋਟਲ-ਰੇਟਿੰਗ ਟਾਸਕ ਫੈਲ ਰਹੇ ਹਨ।' } },
  { title: { en: 'Report update', hi: 'रिपोर्ट अपडेट', pa: 'ਰਿਪੋਰਟ ਅਪਡੇਟ' }, body: { en: 'Your complaint was forwarded to the bank nodal officer.', hi: 'आपकी शिकायत बैंक नोडल अधिकारी को भेजी गई।', pa: 'ਤੁਹਾਡੀ ਸ਼ਿਕਾਇਤ ਬੈਂਕ ਨੋਡਲ ਅਫ਼ਸਰ ਨੂੰ ਭੇਜੀ ਗਈ।' }, type: 'report_status' },
];

let liveTimer = null;
let liveIndex = 0;
let lastStage = -1;

function startLive() {
  stopLive();
  liveIndex = 0;
  lastStage = -1;
  const tick = () => {
    if (liveIndex >= LIVE_SCRIPT.length) return stopLive();
    const m = LIVE_SCRIPT[liveIndex];
    const msg = { id: `lm_${Date.now()}_${liveIndex}`, ...m, at: new Date().toISOString() };
    bus.dispatch('live:message', msg);
    if (m.stage > lastStage) {
      if (lastStage >= 0) {
        bus.dispatch('live:stage_changed', { stage: m.stage, previous: lastStage, track: 'task', risk: m.risk });
        const db = getDb();
        const n = {
          id: `n_${Date.now()}`,
          type: 'stage_changed',
          title: { en: 'Live chat moved to a new stage', hi: 'लाइव चैट नए चरण में पहुँची', pa: 'ਲਾਈਵ ਚੈਟ ਨਵੇਂ ਪੜਾਅ \'ਤੇ ਪਹੁੰਚੀ' },
          body: { en: msg.text.slice(0, 80), hi: msg.text.slice(0, 80), pa: msg.text.slice(0, 80) },
          link: '/live',
          read: false,
          createdAt: new Date().toISOString(),
        };
        db.notifications.unshift(n);
        saveDb();
        bus.dispatch('notification:new', n);
      }
      lastStage = m.stage;
    }
    liveIndex += 1;
    liveTimer = setTimeout(tick, 3200 + Math.random() * 1600);
  };
  liveTimer = setTimeout(tick, 900);
}

function stopLive() {
  clearTimeout(liveTimer);
  liveTimer = null;
}

export function createMockSocket() {
  const own = [];
  const timers = [];
  let connected = false;

  const api = {
    connected: false,
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(fn);
      own.push([event, fn]);
      return api;
    },
    off(event, fn) {
      listeners.set(event, (listeners.get(event) || []).filter((f) => f !== fn));
      return api;
    },
    /** Client → server messages. */
    emit(event) {
      if (event === 'live:start') startLive();
      if (event === 'live:stop') stopLive();
      return api;
    },
    connect() {
      if (connected) return api;
      connected = true;
      api.connected = true;

      // New threat-feed item every ~5s.
      timers.push(
        setInterval(() => {
          const [city, state] = rand(CITIES);
          bus.dispatch('threat:new', {
            id: `t_${Date.now()}`,
            script: rand(SCAM_SCRIPTS).key,
            city,
            state,
            amount: Math.round((500 + Math.random() * 25000) / 100) * 100,
            at: new Date().toISOString(),
          });
        }, 5000)
      );

      // Occasional notification (every ~75s).
      timers.push(
        setInterval(() => {
          const a = rand(ALERTS);
          const n = { id: `n_${Date.now()}`, type: a.type || 'admin_alert', title: a.title, body: a.body, link: '/threat-map', read: false, createdAt: new Date().toISOString() };
          getDb().notifications.unshift(n);
          saveDb();
          bus.dispatch('notification:new', n);
        }, 75000)
      );

      // After ~40s the admin "publishes" the info headline so the ticker updates live.
      timers.push(
        setTimeout(() => {
          const db = getDb();
          const h = db.headlines.find((x) => x.id === 'h_3');
          if (h && !h.active) {
            h.active = true;
            saveDb();
            bus.dispatch('headline:updated', db.headlines.filter((x) => x.active));
          }
        }, 40000)
      );
      return api;
    },
    disconnect() {
      connected = false;
      api.connected = false;
      timers.forEach((t) => {
        clearInterval(t);
        clearTimeout(t);
      });
      own.forEach(([e, fn]) => api.off(e, fn));
      stopLive();
      return api;
    },
  };
  return api;
}
