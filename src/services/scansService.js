import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/**
 * Scan endpoints.
 * create() takes { files: File[], text, link, companyName, hrEmail, amountPaid } and sends multipart.
 */
export const scansService = {
  create: (input, onUploadProgress) => {
    if (USE_MOCK) return mock.scans.create(input, onUploadProgress);
    const fd = new FormData();
    (input.files || []).forEach((f) => fd.append('files[]', f));
    ['text', 'link', 'companyName', 'hrEmail', 'amountPaid'].forEach((k) => input[k] && fd.append(k, input[k]));
    return data(
      api.post('/api/scans', fd, {
        onUploadProgress: (e) => e.total && onUploadProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
    );
  },
  get: (id) => (USE_MOCK ? mock.scans.get(id) : data(api.get(`/api/scans/${id}`))),
  status: (id) => (USE_MOCK ? mock.scans.status(id) : data(api.get(`/api/scans/${id}/status`))),
  /** params: { page, verdict, type, q, from, to } → { items, page, pages, total, hasMore } */
  list: (params = {}) => (USE_MOCK ? mock.scans.list(params) : data(api.get('/api/scans', { params }))),
  remove: (id) => (USE_MOCK ? mock.scans.remove(id) : data(api.delete(`/api/scans/${id}`))),
  feedback: (id, value) => (USE_MOCK ? mock.scans.feedback(id, value) : data(api.post(`/api/scans/${id}/feedback`, { value }))),
  /** Incident dossier as a PDF Blob. */
  report: (id) => (USE_MOCK ? mock.scans.report(id) : data(api.get(`/api/scans/${id}/report`, { responseType: 'blob' }))),
};
