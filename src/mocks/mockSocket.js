/**
 * Fake socket.io server for mock mode. Same API surface the app uses: on/off/emit/connect/disconnect.
 * It only emits events caused by something real in the demo: scan progress, the live Telegram
 * chat arriving message by message, stage changes, admin broadcasts and headline edits.
 * No random or placeholder notifications are generated.
 */
import { LIVE_SCRIPT } from './data.js';
import { getDb } from './db.js';
import { bus } from './bus.js';
import { pushNotification } from './notify.js';

export { bus };

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
        pushNotification({
          userId: getDb().session,
          type: 'stage_changed',
          title: { en: 'Live chat moved to a new stage', hi: 'लाइव चैट नए चरण में पहुँची', pa: "ਲਾਈਵ ਚੈਟ ਨਵੇਂ ਪੜਾਅ 'ਤੇ ਪਹੁੰਚੀ" },
          body: { en: msg.text.slice(0, 80), hi: msg.text.slice(0, 80), pa: msg.text.slice(0, 80) },
          link: '/live',
        });
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
  let connected = false;

  const api = {
    connected: false,
    on(event, fn) {
      bus.on(event, fn);
      own.push([event, fn]);
      return api;
    },
    off(event, fn) {
      bus.off(event, fn);
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
      return api;
    },
    disconnect() {
      connected = false;
      api.connected = false;
      own.forEach(([e, fn]) => api.off(e, fn));
      stopLive();
      return api;
    },
  };
  return api;
}
