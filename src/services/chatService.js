import api, { USE_MOCK, data } from '../api/axios.js';
import { localReply } from '../chat/assistant.js';
import { getDb } from '../mocks/db.js';
import { ENTITY_SEED } from '../mocks/data.js';

/** Known scam UPI IDs / numbers used by the local offer check. */
const entityDb = () => {
  try {
    return USE_MOCK ? getDb().entities : ENTITY_SEED;
  } catch {
    return ENTITY_SEED;
  }
};

/**
 * Safety chatbot. With a backend: POST /api/chat { message, history, language } → { reply, check?, actions? }.
 * Mock mode, or if the backend has no chat endpoint, the built-in assistant answers.
 */
export const chatService = {
  ask: async ({ message, history = [], language = 'en' }) => {
    if (!USE_MOCK) {
      try {
        const res = await data(api.post('/api/chat', { message, history: history.slice(-10), language }, { timeout: 20000 }));
        if (res?.reply || res?.check) {
          return { text: typeof res.reply === 'string' ? { en: res.reply, hi: res.reply, pa: res.reply } : res.reply, check: res.check, actions: res.actions };
        }
      } catch {
        /* fall back to the built-in assistant */
      }
    }
    await new Promise((r) => setTimeout(r, 450 + Math.random() * 350));
    return localReply(message, entityDb());
  },
};
