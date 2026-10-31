import api, { USE_MOCK, data } from '../api/axios.js';
import * as mock from '../mocks/handlers.js';

/** Current-user settings (PATCH /api/users/me). */
export const usersService = {
  updateMe: (patch) => (USE_MOCK ? mock.users.updateMe(patch) : data(api.patch('/api/users/me', patch)).then((d) => d.user || d)),
  changePassword: (body) => (USE_MOCK ? mock.users.changePassword(body) : data(api.patch('/api/users/me/password', body))),
  deleteMe: () => (USE_MOCK ? mock.users.deleteMe() : data(api.delete('/api/users/me'))),
};
