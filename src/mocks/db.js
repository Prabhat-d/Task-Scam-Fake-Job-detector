/**
 * In-browser mock database, persisted to localStorage so the demo survives reloads.
 * Call resetMockDb() from the console to start fresh.
 */
import { analyse } from './analyzer.js';
import { MOCK_ACCOUNTS, MOCK_OTHER_USERS, SAMPLE_TEXTS, ENTITY_SEED, HEADLINE_SEED } from './data.js';
import { chatThumb, letterThumb, postThumb } from './thumbs.js';

// Bump DB_VERSION whenever the seed shape changes; older saved data is then reseeded.
const KEY = 'tm_mock_db';
const DB_VERSION = 2;
const HOUR = 3600000;
const DAY = 24 * HOUR;

const thumbFor = (type, verdict) => {
  const c = verdict === 'scam' ? '#ef4444' : verdict === 'suspicious' ? '#f59e0b' : '#10b981';
  if (type === 'offer_letter') return letterThumb(c);
  if (type === 'job_post') return postThumb(c);
  return chatThumb(c);
};

export function buildScan(input, entities, { id, userId, createdAt }) {
  const result = analyse(input, entities);
  const files = (input.files || []).map((f, i) => ({
    id: `${id}_f${i}`,
    name: f.name,
    type: f.type,
    size: f.size,
    url: f.url || null,
    thumb: f.thumb || null,
  }));
  return {
    id,
    userId,
    createdAt,
    status: 'completed',
    inputText: input.text || '',
    link: input.link || '',
    companyName: input.companyName || '',
    hrEmail: input.hrEmail || '',
    ...result,
    thumbnail: files.find((f) => f.thumb)?.thumb || thumbFor(result.type, result.verdict),
    files,
    feedback: null,
  };
}

function seed() {
  const entities = ENTITY_SEED.map((e) => ({ ...e }));
  const samples = [
    [SAMPLE_TEXTS.taskScam, {}, 2 * HOUR, [{ name: 'telegram_chat_priya.jpg', type: 'image/jpeg', size: 284113 }]],
    [SAMPLE_TEXTS.fakeOffer, { companyName: 'Infosys Solutions Pvt Ltd', hrEmail: 'hr.infosysjobs@gmail.com', amountPaid: 2500 }, 5 * HOUR, [{ name: 'offer_letter_infosys.pdf', type: 'application/pdf', size: 512334 }]],
    [SAMPLE_TEXTS.genuineOffer, { companyName: 'Tata Consultancy Services Limited', hrEmail: 'careers@tcs.com' }, DAY + 3 * HOUR, [{ name: 'TCS_offer_letter.pdf', type: 'application/pdf', size: 198442 }]],
    [SAMPLE_TEXTS.suspiciousPost, {}, DAY + 9 * HOUR, []],
    [`[Telegram] YT_Like_Earn_Official: Subscribe 3 channels, earn ₹150. Send screenshot. Then join premium group t.me/AmzTaskVIP_202 for merchant task. Pay ₹2,000 and get ₹2,600 back via earnfast92@okaxis`, {}, 3 * DAY, [{ name: 'screenshot_2026-10-27.png', type: 'image/png', size: 341920 }]],
    [`Hiring Data entry operators. Registration fee ₹999 refundable. No interview. Salary ₹22,000. WhatsApp +91 91234 77881`, {}, 4 * DAY, []],
    [`Dear applicant, your profile is shortlisted for Customer Support Associate at Wipro Limited. Please attend the virtual interview on 2 Nov. Reply from your registered email. – Talent Acquisition, careers@wipro.com`, { companyName: 'Wipro Limited', hrEmail: 'careers@wipro.com' }, 6 * DAY, []],
    [`Account frozen due to wrong operation! Pay ₹12,000 to unfreeze. To withdraw your ₹48,000 pay income tax ₹8,640. Contact @Mentor_Rahul_Amz`, { amountPaid: 15000 }, 9 * DAY, [{ name: 'vip_group_tax.jpg', type: 'image/jpeg', size: 223010 }]],
    [`Work from home part time. Rate hotels on Google and earn ₹3000-5000 daily. Limited seats, hurry!`, {}, 12 * DAY, []],
    [`Offer Letter: Amazon Seller Services – Virtual Assistant. Laptop security deposit ₹4,999 required. Document verification fee ₹1,500 after joining. Valid only 12 hours. Mail hr.amazonindia.jobs@gmail.com`, { companyName: 'Amazon Seller Services Private Limited', hrEmail: 'hr.amazonindia.jobs@gmail.com' }, 18 * DAY, [{ name: 'amazon_offer.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 88213 }]],
  ];
  const scans = samples.map(([text, extra, ago, files], i) =>
    buildScan({ text, ...extra, files }, entities, {
      id: `scn_${(9100 + i).toString(36)}${i}`,
      userId: 'u_1001',
      createdAt: new Date(Date.now() - ago).toISOString(),
    })
  );
  // A few scans by other users so the admin tables look alive.
  MOCK_OTHER_USERS.slice(0, 6).forEach((u, i) => {
    const text = [SAMPLE_TEXTS.taskScam, SAMPLE_TEXTS.fakeOffer, SAMPLE_TEXTS.suspiciousPost][i % 3];
    scans.push(buildScan({ text }, entities, { id: `scn_o${i}`, userId: u.id, createdAt: new Date(Date.now() - (i + 1) * 7 * HOUR).toISOString() }));
  });

  // No placeholder notifications: they are created only by real events
  // (scan finished, admin broadcast, live chat stage change).
  const notifications = [];

  return {
    version: DB_VERSION,
    session: null,
    accounts: MOCK_ACCOUNTS.map((a) => ({ ...a })),
    otherUsers: MOCK_OTHER_USERS.map((u) => ({ ...u })),
    scans,
    entities,
    headlines: HEADLINE_SEED.map((h) => ({ ...h })),
    notifications,
    broadcasts: [],
    live: { connected: true, botUsername: 'TrustMatrixBot', sessions: [{ id: 'ls_1', chatName: 'Priya_HR (Amazon Tasks)', startedAt: new Date(Date.now() - 40 * 60000).toISOString(), stage: 3, risk: 78 }] },
  };
}

let db = null;

export function getDb() {
  if (db) return db;
  try {
    // Old demo data (previous key / version) used the old brand's login emails.
    localStorage.removeItem('jk_mock_db_v1');
    const raw = localStorage.getItem(KEY);
    const saved = raw ? JSON.parse(raw) : null;
    db = saved?.version === DB_VERSION ? saved : seed();
  } catch {
    db = seed();
  }
  return db;
}

export function saveDb() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Quota exceeded (large thumbnails) – drop image thumbs from old scans and retry once.
    db.scans.slice(10).forEach((s) => s.files.forEach((f) => (f.thumb = null)));
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* give up silently: data stays in memory */
    }
  }
}

export function resetMockDb() {
  localStorage.removeItem(KEY);
  db = null;
  return getDb();
}

if (typeof window !== 'undefined') window.resetMockDb = resetMockDb;
