import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Public active headlines + admin CRUD. Saving on the server broadcasts `headline:updated`. */
export const headlinesService = {
  active: () => (USE_MOCK ? mock.headlines.active() : data(api.get('/api/headlines/active'))),
  list: () => (USE_MOCK ? mock.headlines.adminList() : data(api.get('/api/admin/headlines'))),
  create: (h) => (USE_MOCK ? mock.headlines.create(h) : data(api.post('/api/admin/headlines', h))),
  update: (id, h) => (USE_MOCK ? mock.headlines.update(id, h) : data(api.put(`/api/admin/headlines/${id}`, h))),
  remove: (id) => (USE_MOCK ? mock.headlines.remove(id) : data(api.delete(`/api/admin/headlines/${id}`))),
};
