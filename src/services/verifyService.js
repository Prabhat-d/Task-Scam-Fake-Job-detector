import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Company (MCA) and domain verification. */
export const verifyService = {
  company: (name) => (USE_MOCK ? mock.verify.company(name) : data(api.get('/api/verify/company', { params: { name } }))),
  domain: (domain) => (USE_MOCK ? mock.verify.domain(domain) : data(api.get('/api/verify/domain', { params: { domain } }))),
};
