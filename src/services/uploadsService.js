import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Image/file upload history. */
export const uploadsService = {
  list: (params = {}) => (USE_MOCK ? mock.uploads.list(params) : data(api.get('/api/uploads', { params }))),
};
