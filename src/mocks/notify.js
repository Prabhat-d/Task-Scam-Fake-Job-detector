/**
 * Mock notification delivery. A notification is either for one user (`userId`)
 * or a broadcast to an audience (all / one state / one language).
 * Read state is kept per user in `readBy`, so one user reading a broadcast
 * does not mark it read for everyone.
 */
import { getDb, saveDb } from './db.js';
import { bus } from './bus.js';

const PREF_FOR_TYPE = {
  scan_completed: 'scanCompleted',
  stage_changed: 'stageChanged',
  admin_alert: 'adminAlerts',
  report_status: 'reportStatus',
};

export const currentUser = () => {
  const db = getDb();
  return db.accounts.find((a) => a.id === db.session) || null;
};

/** True when `n` should appear for user `u` (recipient + audience + the user's notification settings). */
export function isFor(n, u) {
  if (!u) return false;
  const pref = PREF_FOR_TYPE[n.type];
  if (pref && u.notificationPrefs && u.notificationPrefs[pref] === false) return false;
  if (n.userId) return n.userId === u.id;
  if (n.senderId === u.id) return false;
  if (n.audience === 'state') return u.state === n.state;
  if (n.audience === 'language') return (u.language || 'en') === n.language;
  return true;
}

/** Shape sent to the client: `read` is resolved for this user, internal fields are dropped. */
export function forClient(n, u) {
  // eslint-disable-next-line no-unused-vars
  const { readBy = [], senderId, ...rest } = n;
  return { ...rest, read: readBy.includes(u.id) };
}

/** Store a notification and push it live to the logged-in user if it is meant for them. */
export function pushNotification(n) {
  const db = getDb();
  const item = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    readBy: [],
    createdAt: new Date().toISOString(),
    ...n,
  };
  db.notifications.unshift(item);
  db.notifications = db.notifications.slice(0, 200);
  saveDb();
  const u = currentUser();
  if (isFor(item, u)) bus.dispatch('notification:new', forClient(item, u));
  return item;
}
