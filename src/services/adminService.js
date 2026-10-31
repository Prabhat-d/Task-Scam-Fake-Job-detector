import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Admin-only endpoints. */
export const adminService = {
  overview: () => (USE_MOCK ? mock.admin.overview() : data(api.get('/api/admin/overview'))),

  users: (params) => (USE_MOCK ? mock.admin.users(params) : data(api.get('/api/admin/users', { params }))),
  updateUser: (id, patch) => (USE_MOCK ? mock.admin.updateUser(id, patch) : data(api.patch(`/api/admin/users/${id}`, patch))),

  scans: (params) => (USE_MOCK ? mock.admin.scans(params) : data(api.get('/api/admin/scans', { params }))),

  entities: (params) => (USE_MOCK ? mock.admin.entities(params) : data(api.get('/api/admin/entities', { params }))),
  createEntity: (e) => (USE_MOCK ? mock.admin.createEntity(e) : data(api.post('/api/admin/entities', e))),
  updateEntity: (id, e) => (USE_MOCK ? mock.admin.updateEntity(id, e) : data(api.put(`/api/admin/entities/${id}`, e))),
  removeEntity: (id) => (USE_MOCK ? mock.admin.removeEntity(id) : data(api.delete(`/api/admin/entities/${id}`))),

  /** Upload a labelled CSV/ZIP; returns { results, metrics }. */
  evaluate: (file, onProgress) => {
    if (USE_MOCK) return mock.admin.evaluate(file, onProgress);
    const fd = new FormData();
    fd.append('file', file);
    return data(
      api.post('/api/admin/evaluate', fd, {
        timeout: 0,
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
    );
  },

  broadcast: (body) => (USE_MOCK ? mock.admin.broadcast(body) : data(api.post('/api/admin/broadcast', body))),
  broadcasts: () => (USE_MOCK ? mock.admin.broadcasts() : data(api.get('/api/admin/broadcast'))),
};
