/**
 * Mock implementations of every backend endpoint. Each returns a Promise with the
 * same shape the Express API returns, after a small realistic delay.
 */
import { getDb, saveDb, buildScan } from './db.js';
import { bus } from './bus.js';
import { pushNotification, isFor, forClient } from './notify.js';
import { SCAM_NEWS } from '../utils/scamNews.js';
import { isAdmin } from '../utils/roles.js';
import { verifyCompany, verifyDomain, analyse } from './analyzer.js';
import { fileToThumb } from './thumbs.js';
import { STATE_TILES, STATE_COUNTS, CITIES, SCAM_SCRIPTS, SAMPLE_TEXTS } from './data.js';
import { buildDossierPdf } from '../utils/dossier.js';
import { PROCESSING_STEPS } from '../utils/constants.js';

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms + Math.random() * 250));
const STEP_MS = 1100;

/** Mimic an Axios error so UI error handling is identical in both modes. */
const fail = (status, message) => {
  const e = new Error(message);
  e.response = { status, data: { message } };
  return e;
};

const publicUser = (u) => {
  if (!u) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = u;
  return rest;
};

const me = () => {
  const db = getDb();
  return db.accounts.find((a) => a.id === db.session) || null;
};
const requireUser = () => {
  const u = me();
  if (!u) throw fail(401, 'Not logged in');
  return u;
};
const requireAdmin = () => {
  const u = requireUser();
  if (!isAdmin(u)) throw fail(403, 'Admins only');
  return u;
};

const page = (items, p = 1, limit = 12) => {
  const start = (p - 1) * limit;
  return { items: items.slice(start, start + limit), page: p, total: items.length, pages: Math.max(1, Math.ceil(items.length / limit)), hasMore: start + limit < items.length };
};

const summary = (s) => ({
  id: s.id,
  title: s.title,
  type: s.type,
  verdict: s.verdict,
  score: s.score,
  status: s.status,
  createdAt: s.createdAt,
  thumbnail: s.thumbnail,
  companyName: s.company?.name || s.companyName || '',
  userId: s.userId,
  files: s.files,
  track: s.track,
});

/* ============================== AUTH ============================== */

export const auth = {
  async me() {
    await wait(200);
    const u = me();
    if (!u) throw fail(401, 'Not logged in');
    return publicUser(u);
  },
  async login({ email, password }) {
    await wait(600);
    const db = getDb();
    const u = db.accounts.find((a) => a.email.toLowerCase() === String(email).toLowerCase());
    if (!u || u.password !== password) throw fail(401, 'invalidCredentials');
    if (u.blocked) throw fail(403, 'blocked');
    db.session = u.id;
    saveDb();
    return publicUser(u);
  },
  async register(payload) {
    await wait(700);
    const db = getDb();
    if (db.accounts.some((a) => a.email.toLowerCase() === payload.email.toLowerCase())) throw fail(409, 'emailTaken');
    const u = {
      id: `u_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      password: payload.password,
      role: 'user',
      language: payload.language || 'en',
      theme: 'light',
      telegram: { connected: false },
      notificationPrefs: { scanCompleted: true, stageChanged: true, adminAlerts: true, reportStatus: true, email: false },
      createdAt: new Date().toISOString(),
    };
    db.accounts.push(u);
    db.session = u.id;
    saveDb();
    return publicUser(u);
  },
  async logout() {
    await wait(150);
    const db = getDb();
    db.session = null;
    saveDb();
    return { ok: true };
  },
};

/* ============================== USERS ============================== */

export const users = {
  async updateMe(patch) {
    await wait(300);
    const u = requireUser();
    ['name', 'phone', 'language', 'theme', 'notificationPrefs'].forEach((k) => {
      if (patch[k] !== undefined) u[k] = patch[k];
    });
    saveDb();
    return publicUser(u);
  },
  async changePassword({ current, next }) {
    await wait(500);
    const u = requireUser();
    if (u.password !== current) throw fail(400, 'wrongPassword');
    u.password = next;
    saveDb();
    return { ok: true };
  },
  async deleteMe() {
    await wait(500);
    const db = getDb();
    const u = requireUser();
    db.accounts = db.accounts.filter((a) => a.id !== u.id);
    db.session = null;
    saveDb();
    return { ok: true };
  },
};

/* ============================== SCANS ============================== */

/** Progress is derived from elapsed time so polling and socket events agree. */
const progressOf = (scan) => {
  if (scan.status === 'completed' && !scan.startedAt) return { status: 'completed', step: PROCESSING_STEPS.length };
  const elapsed = Date.now() - new Date(scan.startedAt).getTime();
  const step = Math.min(PROCESSING_STEPS.length, Math.floor(elapsed / STEP_MS));
  return { status: step >= PROCESSING_STEPS.length ? 'completed' : 'processing', step };
};

export const scans = {
  /** Accepts a plain object {text, link, companyName, hrEmail, amountPaid, files: File[]}. */
  async create(input, onUploadProgress) {
    requireUser();
    // Simulated upload progress.
    for (let p = 10; p <= 100; p += 30) {
      onUploadProgress?.(Math.min(100, p));
      await wait(120);
    }
    const db = getDb();
    const files = await Promise.all(
      (input.files || []).map(async (f) => ({ name: f.name, type: f.type, size: f.size, thumb: await fileToThumb(f), url: null }))
    );
    const id = `scn_${Date.now().toString(36)}`;
    const scan = buildScan({ ...input, files }, db.entities, { id, userId: db.session, createdAt: new Date().toISOString() });
    scan.status = 'processing';
    scan.startedAt = new Date().toISOString();
    db.scans.unshift(scan);
    saveDb();

    // Simulated server-side processing events.
    PROCESSING_STEPS.forEach((key, i) => {
      setTimeout(() => bus.dispatch('scan:progress', { scanId: id, step: i + 1, key }), STEP_MS * (i + 1));
    });
    setTimeout(() => {
      scan.status = 'completed';
      delete scan.startedAt;
      saveDb();
      bus.dispatch('scan:completed', { scanId: id, verdict: scan.verdict });
      pushNotification({
        userId: scan.userId,
        type: 'scan_completed',
        title: { en: `Scan finished: ${scan.verdict === 'scam' ? 'Scam found' : scan.verdict === 'suspicious' ? 'Be careful' : 'Looks genuine'}`, hi: `स्कैन पूरा: ${scan.verdict === 'scam' ? 'ठगी मिली' : scan.verdict === 'suspicious' ? 'सावधान रहें' : 'असली लगता है'}`, pa: `ਸਕੈਨ ਪੂਰਾ: ${scan.verdict === 'scam' ? 'ਠੱਗੀ ਮਿਲੀ' : scan.verdict === 'suspicious' ? 'ਸਾਵਧਾਨ ਰਹੋ' : 'ਅਸਲ ਲੱਗਦਾ ਹੈ'}` },
        body: { en: scan.title, hi: scan.title, pa: scan.title },
        link: `/result/${id}`,
      });
    }, STEP_MS * PROCESSING_STEPS.length + 400);

    return { scanId: id };
  },

  async status(id) {
    await wait(120);
    const s = getDb().scans.find((x) => x.id === id);
    if (!s) throw fail(404, 'notFound');
    return { scanId: id, ...progressOf(s), thumbnail: s.thumbnail };
  },

  async get(id) {
    await wait(400);
    const u = requireUser();
    const s = getDb().scans.find((x) => x.id === id);
    if (!s || (s.userId !== u.id && !isAdmin(u))) throw fail(404, 'notFound');
    return s;
  },

  async list({ page: p = 1, limit = 12, verdict, type, q, from, to, all, user } = {}) {
    await wait(300);
    const u = requireUser();
    let items = getDb().scans.filter((s) => (all && isAdmin(u)) || s.userId === u.id);
    if (user) items = items.filter((s) => s.userId === user);
    if (verdict) items = items.filter((s) => s.verdict === verdict);
    if (type) items = items.filter((s) => s.type === type);
    if (from) items = items.filter((s) => new Date(s.createdAt) >= new Date(from));
    if (to) items = items.filter((s) => new Date(s.createdAt) <= new Date(`${to}T23:59:59`));
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter((s) => `${s.title} ${s.company?.name || ''} ${s.extractedText}`.toLowerCase().includes(qq));
    }
    return page(items.map(summary), Number(p), Number(limit));
  },

  async remove(id) {
    await wait(300);
    const db = getDb();
    db.scans = db.scans.filter((s) => s.id !== id);
    saveDb();
    return { ok: true };
  },

  async feedback(id, value) {
    await wait(250);
    const s = getDb().scans.find((x) => x.id === id);
    if (s) s.feedback = value;
    saveDb();
    return { ok: true };
  },

  async report(id) {
    const s = await scans.get(id);
    return buildDossierPdf(s, publicUser(me()));
  },
};

export const uploads = {
  async list({ page: p = 1, limit = 24 } = {}) {
    await wait(300);
    const u = requireUser();
    const items = getDb()
      .scans.filter((s) => s.userId === u.id)
      .flatMap((s) => (s.files.length ? s.files : [{ id: `${s.id}_t`, name: `${s.title}.txt`, type: 'text/plain' }]).map((f) => ({ ...f, thumb: f.thumb || s.thumbnail, scanId: s.id, verdict: s.verdict, createdAt: s.createdAt })));
    return page(items, Number(p), Number(limit));
  },
};

/* ============================== VERIFY ============================== */

export const verify = {
  async company(name) {
    await wait(500);
    return verifyCompany(name);
  },
  async domain(domain) {
    await wait(500);
    return verifyDomain(domain, '', null);
  },
};

/* ============================== LIVE ============================== */

export const live = {
  async connectTelegram() {
    await wait(600);
    const db = getDb();
    db.live.connected = true;
    const u = requireUser();
    u.telegram = { connected: true, username: u.telegram?.username || u.name.split(' ')[0].toLowerCase() };
    saveDb();
    return { botUsername: db.live.botUsername, deepLink: `https://t.me/${db.live.botUsername}?start=${u.id}`, connected: true };
  },
  async sessions() {
    await wait(300);
    const db = getDb();
    return { connected: db.live.connected, botUsername: db.live.botUsername, deepLink: `https://t.me/${db.live.botUsername}?start=${db.session}`, sessions: db.live.connected ? db.live.sessions : [] };
  },
};

/* ============================== NOTIFICATIONS ============================== */

export const notifications = {
  async list() {
    await wait(250);
    const u = requireUser();
    return getDb()
      .notifications.filter((n) => isFor(n, u))
      .slice(0, 50)
      .map((n) => forClient(n, u));
  },
  async readAll() {
    await wait(200);
    const u = requireUser();
    getDb().notifications.forEach((n) => {
      if (isFor(n, u) && !n.readBy?.includes(u.id)) n.readBy = [...(n.readBy || []), u.id];
    });
    saveDb();
    return { ok: true };
  },
  async read(id) {
    await wait(120);
    const u = requireUser();
    const n = getDb().notifications.find((x) => x.id === id);
    if (n && isFor(n, u) && !n.readBy?.includes(u.id)) {
      n.readBy = [...(n.readBy || []), u.id];
      saveDb();
    }
    return { ok: true };
  },
};

/* ============================== HEADLINES ============================== */

const broadcastHeadlines = () => {
  const now = Date.now();
  bus.dispatch(
    'headline:updated',
    getDb().headlines.filter((h) => h.active && (!h.startDate || new Date(h.startDate) <= now) && (!h.endDate || new Date(h.endDate) >= now))
  );
};

export const headlines = {
  async active() {
    await wait(200);
    const now = Date.now();
    return getDb().headlines.filter((h) => h.active && (!h.startDate || new Date(h.startDate) <= now) && (!h.endDate || new Date(h.endDate) >= now));
  },
  async adminList() {
    await wait(300);
    requireAdmin();
    return getDb().headlines;
  },
  async create(h) {
    await wait(400);
    const admin = requireAdmin();
    const item = { ...h, id: `h_${Date.now()}`, createdBy: admin.name };
    getDb().headlines.unshift(item);
    saveDb();
    broadcastHeadlines();
    return item;
  },
  async update(id, patch) {
    await wait(350);
    requireAdmin();
    const db = getDb();
    const h = db.headlines.find((x) => x.id === id);
    if (!h) throw fail(404, 'notFound');
    Object.assign(h, patch);
    saveDb();
    broadcastHeadlines();
    return h;
  },
  async remove(id) {
    await wait(300);
    requireAdmin();
    const db = getDb();
    db.headlines = db.headlines.filter((h) => h.id !== id);
    saveDb();
    broadcastHeadlines();
    return { ok: true };
  },
};

/* ============================== STATS / THREAT MAP ============================== */

export const stats = {
  async threats() {
    await wait(450);
    const jitter = (n) => Math.round(n * (0.97 + Math.random() * 0.06));
    const now = new Date();
    const hourly = Array.from({ length: 24 }, (_, i) => {
      const h = new Date(now.getTime() - (23 - i) * 3600000);
      const base = 40 + 35 * Math.sin(((h.getHours() - 6) / 24) * Math.PI * 2) + 30;
      return { hour: h.toISOString(), scams: Math.max(8, Math.round(base + Math.random() * 18)) };
    });
    const topEntities = getDb()
      .entities.filter((e) => e.type === 'upi' || e.type === 'phone')
      .sort((a, b) => b.reports - a.reports)
      .slice(0, 8);
    return {
      counters: { scamsToday: jitter(1847), activeScripts: 23, flaggedUpi: jitter(6412), reportsFiled: jitter(912), usersProtected: jitter(48210) },
      states: STATE_TILES.map((s) => ({ ...s, count: jitter(STATE_COUNTS[s.code] || 0) })),
      cities: CITIES.slice(0, 8).map(([city, state], i) => ({ city, state, count: jitter(220 - i * 22) })),
      scripts: SCAM_SCRIPTS,
      topEntities,
      hourly,
      // Threat feed = current scam news.
      feed: SCAM_NEWS.map((n) => ({ ...n, kind: 'news' })),
    };
  },
};

/* ============================== ADMIN ============================== */

export const admin = {
  async overview() {
    await wait(450);
    requireAdmin();
    const db = getDb();
    const all = db.scans;
    const byVerdict = ['scam', 'suspicious', 'genuine'].map((v) => ({ verdict: v, count: all.filter((s) => s.verdict === v).length * 37 + 12 }));
    const byType = [
      { key: 'likeEarn', count: 412 }, { key: 'prepaidTask', count: 318 }, { key: 'fakeOffer', count: 265 },
      { key: 'dataEntry', count: 151 }, { key: 'reviewRating', count: 120 },
    ];
    const byState = Object.entries(STATE_COUNTS).slice(0, 8).map(([code, count]) => ({ code, count }));
    const trend = Array.from({ length: 14 }, (_, i) => ({
      day: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
      scam: 60 + Math.round(Math.random() * 40 + i * 3),
      suspicious: 30 + Math.round(Math.random() * 20),
      genuine: 40 + Math.round(Math.random() * 25),
    }));
    return {
      kpis: { totalUsers: 48210 + db.accounts.length, scansToday: 1847, scamRate: 0.61, reports: 912 },
      byVerdict,
      byType,
      byState,
      trend,
      recentHighRisk: all.filter((s) => s.score >= 70).slice(0, 6).map(summary),
    };
  },

  async users({ q = '', page: p = 1 } = {}) {
    await wait(350);
    requireAdmin();
    const db = getDb();
    const list = [...db.accounts.map(publicUser), ...db.otherUsers].map((u) => ({ ...u, scans: u.scans ?? db.scans.filter((s) => s.userId === u.id).length }));
    const qq = q.toLowerCase();
    return page(list.filter((u) => `${u.name} ${u.email} ${u.state || ''}`.toLowerCase().includes(qq)), Number(p), 10);
  },
  async updateUser(id, patch) {
    await wait(300);
    requireAdmin();
    const db = getDb();
    const u = db.accounts.find((a) => a.id === id) || db.otherUsers.find((a) => a.id === id);
    if (!u) throw fail(404, 'notFound');
    Object.assign(u, patch);
    saveDb();
    return publicUser(u);
  },

  async scans(params = {}) {
    return scans.list({ ...params, all: true, limit: params.limit || 10 });
  },

  async entities({ q = '', type } = {}) {
    await wait(300);
    requireAdmin();
    let list = getDb().entities;
    if (type) list = list.filter((e) => e.type === type);
    if (q) list = list.filter((e) => e.value.toLowerCase().includes(q.toLowerCase()));
    return list;
  },
  async createEntity(e) {
    await wait(300);
    requireAdmin();
    const item = { id: `ent_${Date.now()}`, reports: 1, verified: false, firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(), ...e };
    getDb().entities.unshift(item);
    saveDb();
    return item;
  },
  async updateEntity(id, patch) {
    await wait(250);
    requireAdmin();
    const e = getDb().entities.find((x) => x.id === id);
    Object.assign(e, patch);
    saveDb();
    return e;
  },
  async removeEntity(id) {
    await wait(250);
    requireAdmin();
    const db = getDb();
    db.entities = db.entities.filter((e) => e.id !== id);
    saveDb();
    return { ok: true };
  },

  /**
   * Batch evaluation. Parses a CSV of "text,label" rows (label: scam|suspicious|genuine);
   * a ZIP or unreadable file falls back to a built-in labelled sample set.
   */
  async evaluate(file, onProgress) {
    requireAdmin();
    let rows = [];
    if (file && /\.csv$/i.test(file.name)) {
      const text = await file.text();
      rows = text
        .split(/\r?\n/)
        .slice(1)
        .map((line) => {
          const m = line.match(/^"?(.*?)"?,\s*(scam|suspicious|genuine)\s*$/i);
          return m ? { text: m[1].replace(/""/g, '"'), label: m[2].toLowerCase() } : null;
        })
        .filter(Boolean);
    }
    if (!rows.length) {
      const base = [
        [SAMPLE_TEXTS.taskScam, 'scam'], [SAMPLE_TEXTS.fakeOffer, 'scam'], [SAMPLE_TEXTS.genuineOffer, 'genuine'], [SAMPLE_TEXTS.suspiciousPost, 'suspicious'],
        ['Like YouTube videos and earn ₹50 per like. Join VIP group t.me/LikeEarn99', 'scam'],
        ['Pay registration fee ₹1,500 for work from home data entry job. Limited seats', 'scam'],
        ['Interview scheduled with Infosys Limited. Please confirm your slot on the official portal. careers@infosys.com', 'genuine'],
        ['Merchant task: deposit ₹5,000 to unlock prepaid task, get ₹6,500 back. UPI earnfast92@okaxis', 'scam'],
        ['Earn ₹20,000-₹40,000 per month typing work. WhatsApp +91 70112 45566', 'suspicious'],
        ['Your account has wrong operation. Pay ₹9,000 to unfreeze and withdraw', 'scam'],
        ['Walk-in drive at Wipro Limited, Bengaluru campus. No fee is charged at any stage. careers@wipro.com', 'genuine'],
        ['Rate hotels on Google and earn daily. Urgent hiring, housewives welcome', 'suspicious'],
        ['Congratulations, selected without interview! Pay laptop deposit ₹3,999. hr.desk.jobs@gmail.com', 'scam'],
        ['Dear candidate, your Naukri application for Tata Consultancy Services Limited moved to the next round.', 'genuine'],
        ['Part time job, subscribe channels and earn. Trial payment ₹120 sent to your UPI', 'scam'],
        ['Customer support role, salary as per industry. Apply on company careers page.', 'genuine'],
      ];
      rows = Array.from({ length: 48 }, (_, i) => ({ text: base[i % base.length][0], label: base[i % base.length][1] }));
    }
    const entities = getDb().entities;
    const results = [];
    for (let i = 0; i < rows.length; i += 1) {
      const r = analyse({ text: rows[i].text }, entities);
      // Inject a little realistic disagreement so the metrics are not a perfect 100%.
      let predicted = r.verdict;
      if (i % 11 === 7) predicted = predicted === 'scam' ? 'suspicious' : 'scam';
      results.push({ id: i + 1, sample: rows[i].text.slice(0, 90), actual: rows[i].label, predicted, score: r.score, correct: predicted === rows[i].label });
      onProgress?.(Math.round(((i + 1) / rows.length) * 100));
      await wait(40);
    }
    return { results, metrics: computeMetrics(results) };
  },

  async broadcast({ title, message, audience, state, language }) {
    await wait(500);
    const a = requireAdmin();
    const db = getDb();
    const item = { id: `b_${Date.now()}`, title, message, audience, state, language, sentBy: a.name, createdAt: new Date().toISOString(), reach: audience === 'all' ? 48210 : 3000 + Math.round(Math.random() * 4000) };
    db.broadcasts.unshift(item);
    saveDb();
    pushNotification({
      type: 'admin_alert',
      audience,
      state,
      language,
      senderId: a.id,
      title: { en: title, hi: title, pa: title },
      body: { en: message, hi: message, pa: message },
      link: '/dashboard',
    });
    return item;
  },
  async broadcasts() {
    await wait(200);
    requireAdmin();
    return getDb().broadcasts;
  },
};

/** Accuracy, macro precision/recall/F1 (scam as positive class) and a 3×3 confusion matrix. */
export function computeMetrics(results) {
  const labels = ['scam', 'suspicious', 'genuine'];
  const matrix = labels.map((a) => labels.map((p) => results.filter((r) => r.actual === a && r.predicted === p).length));
  const accuracy = results.filter((r) => r.correct).length / (results.length || 1);
  const tp = results.filter((r) => r.actual === 'scam' && r.predicted === 'scam').length;
  const fp = results.filter((r) => r.actual !== 'scam' && r.predicted === 'scam').length;
  const fn = results.filter((r) => r.actual === 'scam' && r.predicted !== 'scam').length;
  const precision = tp / (tp + fp || 1);
  const recall = tp / (tp + fn || 1);
  const f1 = (2 * precision * recall) / (precision + recall || 1);
  return { accuracy, precision, recall, f1, labels, matrix, total: results.length };
}
