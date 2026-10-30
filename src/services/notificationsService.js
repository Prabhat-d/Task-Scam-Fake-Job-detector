import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

export const notificationsService = {
  list: () => (USE_MOCK ? mock.notifications.list() : data(api.get('/api/notifications')).then((d) => d.items || d)),
  readAll: () => (USE_MOCK ? mock.notifications.readAll() : data(api.patch('/api/notifications/read-all'))),
};
