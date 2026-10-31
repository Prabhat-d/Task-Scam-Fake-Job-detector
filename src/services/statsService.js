import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Threat-map statistics (also used for the public counters on the landing page). */
export const statsService = {
  threats: () => (USE_MOCK ? mock.stats.threats() : data(api.get('/api/stats/threats'))),
};
