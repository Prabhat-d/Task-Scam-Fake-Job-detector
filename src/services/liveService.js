import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Telegram live monitoring. */
export const liveService = {
  connectTelegram: () => (USE_MOCK ? mock.live.connectTelegram() : data(api.post('/api/live/connect-telegram'))),
  sessions: () => (USE_MOCK ? mock.live.sessions() : data(api.get('/api/live/sessions'))),
};
