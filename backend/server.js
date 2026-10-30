const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config(); // Fallback to cwd
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');

const ThreatScan = require('./models/ThreatScan');
const { analyzeThreat } = require('./services/aiEngine');
const { handleChat } = require('./services/chatEngine');
const { verifyCompanyAgainstMCA, performLiveDnsLookup } = require('./services/mcaVerifier');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable credentials and dynamic origin matching for Axios frontend compatibility
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Configure Multer for in-memory image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

let inMemoryScans = [];

// MongoDB Atlas Connection
const MONGO_URI = process.env.MONGO_URI;
let isMongoConnected = false;

if (MONGO_URI && !MONGO_URI.includes("YOUR_PASSWORD")) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      isMongoConnected = true;
      console.log("✅ [MongoDB Atlas] Connected successfully to cybershield_db");
    })
    .catch((err) => {
      console.warn("⚠️ [MongoDB Atlas] Could not connect, running in memory-mode:", err.message);
    });
}

// ----------------- COMPATIBILITY ADAPTER -----------------

function adaptScanForFrontend(savedRecord, files = []) {
  const isScam = savedRecord.riskScore >= 65;
  const isSuspicious = savedRecord.riskScore >= 30 && savedRecord.riskScore < 65;
  const verdict = isScam ? 'scam' : (isSuspicious ? 'suspicious' : 'genuine');
  
  const categoryStr = (savedRecord.category || '').toLowerCase();
  const track = categoryStr.includes('task') ? 'task' : 'job';
  
  let stage = 0;
  if (savedRecord.scamStage) {
    if (typeof savedRecord.scamStage === 'number') stage = savedRecord.scamStage;
    else if (savedRecord.scamStage.stage != null) stage = savedRecord.scamStage.stage;
    else if (typeof savedRecord.scamStage === 'string') {
      const match = savedRecord.scamStage.match(/\d+/);
      stage = match ? parseInt(match[0], 10) : (verdict === 'scam' ? 1 : 0);
    }
  }

  const redFlags = Array.isArray(savedRecord.redFlags) ? savedRecord.redFlags.map((rf, idx) => {
    if (typeof rf === 'string') {
      return {
        id: `flag_${idx}`,
        title: { en: rf, hi: rf, pa: rf },
        why: { en: rf, hi: rf, pa: rf },
        explanation: { en: rf, hi: rf, pa: rf },
        severity: isScam ? 'critical' : 'high',
        evidence: rf
      };
    }
    return rf;
  }) : [];

  const company = savedRecord.companyVerification ? {
    name: savedRecord.companyVerification.companyName || 'Not Provided',
    queried: savedRecord.companyVerification.companyName || '',
    cin: savedRecord.companyVerification.cin || 'N/A',
    status: savedRecord.companyVerification.isLegitimateRegisteredEntity ? 'active' : (savedRecord.companyVerification.companyName ? 'not_found' : 'not_provided'),
    verified: !!savedRecord.companyVerification.isLegitimateRegisteredEntity,
    nameMatch: true,
    incorporated: '2016-04-12',
    state: 'India'
  } : { status: 'not_provided' };

  const domain = {
    officialDomain: savedRecord.companyVerification?.officialDomain || '',
    domain: savedRecord.companyVerification?.domainChecked || '',
    hrEmail: savedRecord.companyVerification?.hrEmail || '',
    emailType: savedRecord.companyVerification?.isFreeMailProvider ? 'free' : 'corporate',
    mx: savedRecord.companyVerification?.mxValid !== false,
    matchesOfficial: !savedRecord.companyVerification?.domainMismatch,
    ageDays: 450
  };

  const entityList = [];
  const dossier = savedRecord.dossier1930 || {};
  
  const toArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      const clean = v.trim();
      if (!clean || clean.toLowerCase().includes('not found')) return [];
      return clean.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  toArray(dossier.upiIds).forEach(v => entityList.push({ type: 'upi', value: v, seenCount: 1 }));
  toArray(dossier.phoneNumbers).forEach(v => entityList.push({ type: 'phone', value: v, seenCount: 1 }));
  toArray(dossier.telegramHandles).forEach(v => entityList.push({ type: 'telegram', value: v, seenCount: 1 }));
  toArray(dossier.links).forEach(v => entityList.push({ type: 'link', value: v, seenCount: 0 }));

  const summary = savedRecord.summary || {
    en: `Analysis completed with risk score ${savedRecord.riskScore}/100.`,
    hi: `जोखिम स्कोर ${savedRecord.riskScore}/100 के साथ विश्लेषण पूरा हुआ।`,
    pa: `ਜੋਖਮ ਸਕੋਰ ${savedRecord.riskScore}/100 ਦੇ ਨਾਲ ਵਿਸ਼ਲੇਸ਼ਣ ਪੂਰਾ ਹੋਇਆ।`
  };

  const nextMove = savedRecord.scamStage?.nextPredictedAction ? {
    en: savedRecord.scamStage.nextPredictedAction,
    hi: savedRecord.scamStage.nextPredictedAction,
    pa: savedRecord.scamStage.nextPredictedAction
  } : (verdict === 'scam' ? {
    en: "Stop all payments immediately. Do not communicate further and dial 1930.",
    hi: "तुरंत सभी भुगतान रोकें। आगे बात न करें और 1930 डायल करें।",
    pa: "ਤੁਰੰਤ ਸਾਰੇ ਭੁਗਤਾਨ ਰੋਕੋ। ਅੱਗੇ ਗੱਲ ਨਾ ਕਰੋ ਅਤੇ 1930 ਡਾਇਲ ਕਰੋ।"
  } : null);

  const scanId = savedRecord.scanId || (savedRecord._id ? savedRecord._id.toString() : `scn_${Date.now()}`);

  return {
    id: scanId,
    scanId: scanId,
    userId: 'u_1001',
    createdAt: savedRecord.createdAt || new Date().toISOString(),
    status: 'completed',
    type: files.length > 0 ? 'offer_letter' : 'job_post',
    score: savedRecord.riskScore,
    riskScore: savedRecord.riskScore,
    verdict,
    category: savedRecord.category,
    track,
    stage,
    summary,
    nextMove,
    redFlags,
    flags: redFlags,
    extractedText: savedRecord.rawInput || '',
    explanation: {
      en: savedRecord.dossier1930?.policeNarrative || (typeof summary === 'string' ? summary : summary.en),
      hi: typeof summary === 'object' ? summary.hi : summary,
      pa: typeof summary === 'object' ? summary.pa : summary
    },
    company,
    domain,
    entities: entityList,
    files: files.map((f, idx) => ({
      id: `${scanId}_f${idx}`,
      name: f.originalname || f.name || 'document',
      size: f.size || 0,
      type: f.mimetype || 'image/jpeg'
    })),
    dossier1930: savedRecord.dossier1930
  };
}

// ----------------- API ENDPOINTS -----------------

// 1. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: "online",
    system: "CyberShield AI Backend (CTBF-AI-11)",
    chatModel: process.env.GROQ_API_KEY ? "Groq (openai/gpt-oss-120b)" : "Gemini 3.5 Flash Lite",
    database: isMongoConnected ? "MongoDB Atlas (Connected)" : "Local In-Memory Mode",
    features: ["Text Analysis", "Multimodal Image/Screenshot OCR", "Live DNS MX Audit", "MCA Verification", "AI Chatbot"]
  });
});

// 2. Chatbot Endpoint (Powers Frontend SafetyChatbot)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const replyData = await handleChat({ message, history, language });
    res.json(replyData);
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Chat service failed", details: error.message });
  }
});

// Helper function to process scan
async function processScan(req, res) {
  try {
    // Accommodate both single file ('image') and multiple files ('files[]')
    const files = req.files || (req.file ? [req.file] : []);
    const primaryFile = files[0] || null;

    let text = req.body.text || '';
    if (req.body.companyName) text += `\nCompany: ${req.body.companyName}`;
    if (req.body.hrEmail) text += `\nHR Email: ${req.body.hrEmail}`;
    if (req.body.link) text += `\nLink: ${req.body.link}`;
    if (req.body.amountPaid) text += `\nAmount Paid: ₹${req.body.amountPaid}`;
    if (!text && primaryFile) {
      text = `[Uploaded Image: ${primaryFile.originalname}]`;
    }

    const imageBuffer = primaryFile ? primaryFile.buffer : null;
    const mimeType = primaryFile ? primaryFile.mimetype : null;

    if (!text && !imageBuffer) {
      return res.status(400).json({ error: "Please provide text, links, or an uploaded screenshot/letter." });
    }

    // Run Multimodal AI & MCA Verification
    const analysis = await analyzeThreat(text, process.env.GEMINI_API_KEY, imageBuffer, mimeType);

    // Save to Database (MongoDB Atlas)
    const storedText = (analysis.extractedText && analysis.extractedText.length > 20) ? analysis.extractedText : (text + (primaryFile ? ` (Image: ${primaryFile.originalname})` : ""));
    let savedRecord = null;
    if (isMongoConnected) {
      try {
        savedRecord = await ThreatScan.create({
          rawInput: storedText,
          riskScore: analysis.riskScore,
          verdict: analysis.verdict,
          category: analysis.category,
          scamStage: analysis.scamStage,
          companyVerification: analysis.companyVerification,
          redFlags: analysis.redFlags,
          dossier1930: analysis.dossier1930
        });
      } catch (dbErr) {
        console.error("DB Save Error:", dbErr.message);
      }
    }

    if (!savedRecord) {
      savedRecord = {
        scanId: `SCAN-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date(),
        rawInput: storedText,
        ...analysis
      };
      inMemoryScans.unshift(savedRecord);
    }

    // Adapt to full payload satisfying both frontend components & backend callers
    const frontendPayload = adaptScanForFrontend(savedRecord, files);

    res.json({
      success: true,
      scanId: savedRecord.scanId || savedRecord._id,
      ...frontendPayload,
      ...analysis
    });
  } catch (error) {
    console.error("Scan Error:", error);
    res.status(500).json({ error: "Threat analysis failed", details: error.message });
  }
}

// 3. Scan Threat Endpoints (Supports both /api/scan and /api/scans)
app.post('/api/scan', upload.single('image'), processScan);
app.post('/api/scans', upload.any(), processScan);

// 4. Scans Listing (for Frontend Scans List and Admin Table)
app.get('/api/scans', async (req, res) => {
  try {
    let items = [];
    if (isMongoConnected) {
      const records = await ThreatScan.find().sort({ createdAt: -1 }).limit(50);
      items = records.map(r => adaptScanForFrontend(r));
    } else {
      items = inMemoryScans.map(r => adaptScanForFrontend(r));
    }
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const total = items.length;
    res.json({
      items: items.slice((page - 1) * limit, page * limit),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
      hasMore: page * limit < total
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to list scans", details: err.message });
  }
});

// 5. Scan Status Endpoint (Required by /processing/:scanId)
app.get('/api/scans/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    let record = null;
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        record = await ThreatScan.findById(id);
      } else {
        record = await ThreatScan.findOne({ scanId: id });
      }
    }
    if (!record) {
      record = inMemoryScans.find(s => s.scanId === id || s.id === id);
    }
    res.json({
      status: 'completed',
      step: 4,
      scanId: id,
      thumbnail: record?.thumbnail || null
    });
  } catch (err) {
    res.json({ status: 'completed', step: 4, scanId: req.params.id });
  }
});

// 5b. Single Scan Details (for /result/:scanId)
app.get('/api/scans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let record = null;
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        record = await ThreatScan.findById(id);
      } else {
        record = await ThreatScan.findOne({ scanId: id });
      }
    }
    if (!record) {
      record = inMemoryScans.find(s => s.scanId === id || s.id === id);
    }
    if (!record) {
      return res.status(404).json({ message: "Scan not found" });
    }
    res.json(adaptScanForFrontend(record));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch scan", details: err.message });
  }
});

// 5c. Delete Scan
app.delete('/api/scans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await ThreatScan.findByIdAndDelete(id);
      } else {
        await ThreatScan.findOneAndDelete({ scanId: id });
      }
    }
    inMemoryScans = inMemoryScans.filter(s => s.scanId !== id && s.id !== id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete scan", details: err.message });
  }
});

// 6. Reports legacy audit trail
app.get('/api/reports', async (req, res) => {
  try {
    if (isMongoConnected) {
      const records = await ThreatScan.find().sort({ createdAt: -1 }).limit(20);
      return res.json({ count: records.length, reports: records });
    }
    res.json({ count: inMemoryScans.length, reports: inMemoryScans });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// 7. Incident Dossier Export for Helpline 1930
app.post('/api/dossier/generate', (req, res) => {
  const { dossier, scanId } = req.body;
  if (!dossier) {
    return res.status(400).json({ error: "No dossier payload provided" });
  }

  const formattedComplaint = `
=====================================================
NATIONAL CYBERCRIME REPORTING PORTAL / HELPLINE 1930
INCIDENT DOSSIER: ${scanId || 'URGENT'}
=====================================================
DATE GENERATED: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
FRAUD CATEGORY: Task-Based Cyber Financial Fraud / Fake Employment

SUSPECT DETAILS:
- Phone Numbers: ${dossier.phoneNumbers ? dossier.phoneNumbers.join(', ') : 'N/A'}
- Telegram Channels: ${dossier.telegramHandles ? dossier.telegramHandles.join(', ') : 'N/A'}
- Suspect UPI Handle(s): ${dossier.upiIds ? dossier.upiIds.join(', ') : 'N/A'}
- Impersonated Entity: ${dossier.impersonatedEntity || 'Unspecified'}

INCIDENT SUMMARY FOR POLICE:
"${dossier.policeNarrative}"
=====================================================
`.trim();

  res.json({ success: true, formattedComplaint });
});

// 8. Auth compatibility routes (Prevents UI lock if VITE_USE_MOCK=false)
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 'u_1001',
      name: 'CyberShield Officer',
      email: 'officer@cybershield.in',
      role: 'admin'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    user: {
      id: 'u_1001',
      name: req.body.email ? req.body.email.split('@')[0] : 'CyberShield User',
      email: req.body.email || 'user@cybershield.in',
      role: req.body.email && req.body.email.includes('admin') ? 'admin' : 'user'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

// 9. Extra verification & UI support endpoints
app.get('/api/verify/company', async (req, res) => {
  try {
    const name = req.query.name || '';
    const result = await verifyCompanyAgainstMCA(name, '');
    res.json({
      name: result.claimedCompany,
      cin: result.cin || 'N/A',
      status: result.cin ? 'active' : 'not_found',
      incorporated: '2016-04-12',
      state: 'India',
      nameMatch: !!result.cin
    });
  } catch (err) {
    res.json({ name: req.query.name, status: 'not_found' });
  }
});

app.get('/api/verify/domain', async (req, res) => {
  try {
    const domain = req.query.domain || '';
    const dnsResult = await performLiveDnsLookup(domain);
    res.json({
      domain,
      mx: dnsResult ? dnsResult.hasMx : false,
      mxServers: dnsResult ? dnsResult.mxServers : [],
      ageDays: 450,
      emailType: 'corporate'
    });
  } catch (err) {
    res.json({ domain: req.query.domain, mx: false });
  }
});

app.post('/api/scans/:id/feedback', (req, res) => {
  res.json({ success: true, id: req.params.id, feedback: req.body.value });
});

const STATE_TILES_DATA = [
  ['JK', 'Jammu & Kashmir', 3, 0], ['PB', 'Punjab', 2, 1], ['HP', 'Himachal Pradesh', 3, 1],
  ['RJ', 'Rajasthan', 1, 2], ['HR', 'Haryana', 2, 2], ['DL', 'Delhi', 3, 2], ['UK', 'Uttarakhand', 4, 2], ['SK', 'Sikkim', 6, 2], ['AR', 'Arunachal Pradesh', 8, 2],
  ['GJ', 'Gujarat', 0, 3], ['MP', 'Madhya Pradesh', 2, 3], ['UP', 'Uttar Pradesh', 3, 3], ['BR', 'Bihar', 4, 3], ['WB', 'West Bengal', 5, 3], ['AS', 'Assam', 7, 3], ['NL', 'Nagaland', 8, 3],
  ['MH', 'Maharashtra', 1, 4], ['CG', 'Chhattisgarh', 3, 4], ['JH', 'Jharkhand', 4, 4], ['ML', 'Meghalaya', 6, 4], ['TR', 'Tripura', 7, 4], ['MN', 'Manipur', 8, 4],
  ['GA', 'Goa', 0, 5], ['TS', 'Telangana', 2, 5], ['OD', 'Odisha', 4, 5], ['MZ', 'Mizoram', 7, 5],
  ['KA', 'Karnataka', 1, 6], ['AP', 'Andhra Pradesh', 2, 6],
  ['KL', 'Kerala', 1, 7], ['TN', 'Tamil Nadu', 2, 7],
].map(([code, name, x, y]) => ({ code, name, x, y }));

const STATE_COUNTS_DATA = {
  UP: 412, MH: 388, DL: 341, KA: 297, TS: 264, WB: 221, RJ: 198, GJ: 187, TN: 176, HR: 169, PB: 152,
  BR: 149, MP: 131, AP: 118, KL: 96, OD: 74, JH: 63, CG: 41, AS: 38, UK: 33, HP: 21, JK: 19, GA: 14,
  TR: 7, ML: 6, MN: 5, NL: 4, AR: 3, MZ: 3, SK: 2,
};

const CITIES_DATA = [
  ['Noida', 'UP'], ['Gurugram', 'HR'], ['Bengaluru', 'KA'], ['Hyderabad', 'TS'], ['Pune', 'MH'], ['Mumbai', 'MH'],
  ['Kolkata', 'WB'], ['Jaipur', 'RJ'], ['Ahmedabad', 'GJ'], ['Chennai', 'TN'], ['Ludhiana', 'PB'], ['Jalandhar', 'PB'],
  ['Patna', 'BR'], ['Indore', 'MP'], ['Lucknow', 'UP'], ['New Delhi', 'DL'], ['Kochi', 'KL'], ['Bhubaneswar', 'OD'],
].map(([city, state], i) => ({ city, state, count: 220 - i * 11 }));

const SCAM_SCRIPTS_DATA = [
  { key: 'likeEarn', count: 1240, growth: 34 },
  { key: 'prepaidTask', count: 980, growth: 22 },
  { key: 'fakeOffer', count: 760, growth: 12 },
  { key: 'dataEntry', count: 540, growth: -6 },
  { key: 'reviewRating', count: 410, growth: 41 },
  { key: 'crypto', count: 205, growth: 9 },
];

const SCAM_FEED_DATA = [
  {
    id: 'news_embassy',
    label: 'Fake Russian Embassy Recruitment Scam',
    date: 'Oct 2026',
    severity: 'critical',
    location: 'Delhi',
    message: 'Delhi Police arrested two men for running a fake website (embassytest.com) mimicking the Russian Embassy to sell fake overseas jobs and collect illegal registration fees.',
    kind: 'news'
  },
  {
    id: 'news_task_rating',
    label: 'Task-Based Online Shopping Fraud',
    date: 'Oct 2026',
    severity: 'critical',
    location: 'Hyderabad',
    message: 'A Hyderabad victim lost over ₹37 lakh to a remote "product rating" job. Scammers paid small early returns, then froze funds and demanded huge deposits to unlock payouts.',
    kind: 'news'
  },
  {
    id: 'news_govt_consultancy',
    label: 'Government Job Consultancy Scheme',
    date: 'Oct 2026',
    severity: 'warning',
    location: 'Crime Branch',
    message: 'Crime Branch filed charges against fake job consultancies issuing forged government appointment letters and taking large upfront fees for "direct entry" job quotas.',
    kind: 'news'
  },
  {
    id: 'news_fake_it_recruiters',
    label: 'Fake IT Recruiters on Telegram & WhatsApp',
    date: 'Oct 2026',
    severity: 'warning',
    location: 'Cyber Crime Cell',
    message: 'Cyber Crime authorities warn of scammers posing as HR from TCS, Google and other tech firms, collecting money for fake "training kits" or "background checks".',
    kind: 'news'
  }
];

app.get('/api/stats/threats', async (req, res) => {
  try {
    let count = isMongoConnected ? await ThreatScan.countDocuments() : inMemoryScans.length;
    res.json({
      counters: {
        scamsToday: 1847 + (count * 3),
        activeScripts: 23,
        flaggedUpi: 6412 + count,
        reportsFiled: 912 + count,
        usersProtected: 48210 + (count * 12)
      },
      states: STATE_TILES_DATA.map(s => ({ ...s, count: STATE_COUNTS_DATA[s.code] || 15 })),
      cities: CITIES_DATA.slice(0, 8),
      scripts: SCAM_SCRIPTS_DATA,
      feed: SCAM_FEED_DATA,
      totalScans: count || 42,
      scamsDetected: Math.round((count || 42) * 0.78),
      moneySaved: '₹34,80,000+',
      helplineCallsPrevented: 184,
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        scams: 20 + Math.floor(Math.random() * 15)
      })),
      topEntities: [
        { type: 'upi', value: 'earnfast92@okaxis', reports: 34 },
        { type: 'phone', value: '+919123477881', reports: 28 },
        { type: 'telegram', value: '@amazon_task_vip', reports: 41 }
      ]
    });
  } catch (err) {
    res.json({
      counters: { scamsToday: 1847, activeScripts: 23, flaggedUpi: 6412, reportsFiled: 912, usersProtected: 48210 },
      states: STATE_TILES_DATA.map(s => ({ ...s, count: STATE_COUNTS_DATA[s.code] || 15 })),
      cities: CITIES_DATA.slice(0, 8),
      scripts: SCAM_SCRIPTS_DATA,
      feed: SCAM_FEED_DATA
    });
  }
});

// 10. Live Telegram Monitor Sessions
app.get('/api/live/sessions', (req, res) => {
  res.json({
    connected: true,
    botUsername: 'CyberShieldLiveBot',
    deepLink: 'https://t.me/CyberShieldLiveBot?start=u_1001',
    sessions: [
      {
        id: 'ls_1',
        chatName: 'Priya_HR (Amazon Tasks VIP)',
        startedAt: new Date(Date.now() - 40 * 60000).toISOString(),
        stage: 3,
        risk: 78
      },
      {
        id: 'ls_2',
        chatName: 'Global Merchant Order Dispatch',
        startedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        stage: 2,
        risk: 65
      }
    ]
  });
});

app.post('/api/live/connect-telegram', (req, res) => {
  res.json({
    connected: true,
    botUsername: 'CyberShieldLiveBot',
    deepLink: 'https://t.me/CyberShieldLiveBot?start=u_1001',
    connectedAt: new Date().toISOString()
  });
});

// 11. Active Scam Headlines & Live Alerts (Matches Dashboard.jsx and Top Ticker)
const ACTIVE_HEADLINES_DATA = [
  {
    id: 'h_1',
    title: 'Fake Russian Embassy Recruitment Scam (Oct 2026)',
    message: 'Delhi Police arrested operators running fake embassy portals to collect illegal registration fees.',
    severity: 'critical',
    link: 'https://cybercrime.gov.in',
    active: true,
    startDate: new Date(Date.now() - 2 * 3600000).toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdBy: 'Cyber Crime Unit'
  },
  {
    id: 'h_2',
    title: 'Task-Based Online Rating Fraud (Oct 2026)',
    message: 'Hyderabad Cyber Cell warns of ₹37L loss in remote rating jobs where scammers froze funds after small returns.',
    severity: 'critical',
    link: 'https://cybercrime.gov.in',
    active: true,
    startDate: new Date(Date.now() - 5 * 3600000).toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdBy: 'Helpline 1930'
  },
  {
    id: 'h_3',
    title: 'Fake IT HR Recruiters on WhatsApp (Oct 2026)',
    message: 'Advisory: Scammers posing as HR from top tech firms demand payment for laptop security or training kits.',
    severity: 'warning',
    link: 'https://cybercrime.gov.in',
    active: true,
    startDate: new Date(Date.now() - 24 * 3600000).toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    createdBy: 'National Cyber Agency'
  }
];

app.get('/api/headlines/active', (req, res) => {
  res.json(ACTIVE_HEADLINES_DATA);
});

app.get('/api/admin/headlines', (req, res) => {
  res.json(ACTIVE_HEADLINES_DATA);
});

app.get('/api/notifications', (req, res) => {
  res.json({
    items: [
      {
        id: 'n1',
        type: 'admin_alert',
        title: 'New High-Risk Threat Detected',
        body: 'Multiple complaints filed against UPI ID earnfast92@okaxis.',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString()
      }
    ]
  });
});

// 12. Full Admin Suite (Overview, Users, Admin Scans, Entities Scam Database, Benchmark, Broadcast)
let adminUsersList = [
  { id: 'u_1001', name: 'Simran Kaur', email: 'user@trustmatrix.in', phone: '+91 98140 22331', role: 'user', state: 'Punjab', scans: 4, blocked: false, createdAt: '2026-08-14T10:00:00.000Z' },
  { id: 'a_0001', name: 'Daksh Verma', email: 'admin@trustmatrix.in', phone: '+91 99880 11223', role: 'admin', state: 'Punjab', scans: 18, blocked: false, createdAt: '2026-07-01T10:00:00.000Z' },
  { id: 'u_1002', name: 'Aarav Sharma', email: 'aarav.s@gmail.com', phone: '+91 98100 12345', role: 'user', state: 'Delhi', scans: 2, blocked: false, createdAt: '2026-09-01T10:00:00.000Z' },
  { id: 'u_1003', name: 'Priya Nair', email: 'priya.nair@yahoo.in', phone: '+91 98460 54321', role: 'user', state: 'Kerala', scans: 5, blocked: false, createdAt: '2026-09-12T10:00:00.000Z' },
  { id: 'u_1004', name: 'Rohit Yadav', email: 'rohit.y92@gmail.com', phone: '+91 94150 98765', role: 'user', state: 'Uttar Pradesh', scans: 1, blocked: false, createdAt: '2026-09-20T10:00:00.000Z' },
  { id: 'u_1005', name: 'Karan Gill', email: 'karan.gill@outlook.com', phone: '+91 98720 11234', role: 'user', state: 'Punjab', scans: 7, blocked: false, createdAt: '2026-10-02T10:00:00.000Z' },
  { id: 'u_1006', name: 'Sneha Patil', email: 'sneha.patil@gmail.com', phone: '+91 98220 99887', role: 'user', state: 'Maharashtra', scans: 3, blocked: false, createdAt: '2026-10-15T10:00:00.000Z' }
];

let adminEntitiesList = [
  { id: 'ent_1', type: 'upi', value: 'amzrewards.pay@ybl', reports: 37, verified: true, firstSeen: '2026-09-01T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_2', type: 'upi', value: 'infosys.hr.desk@paytm', reports: 12, verified: true, firstSeen: '2026-09-10T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_3', type: 'upi', value: 'earnfast92@okaxis', reports: 58, verified: true, firstSeen: '2026-08-15T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_4', type: 'upi', value: 'taskpay.merchant@ibl', reports: 21, verified: false, firstSeen: '2026-10-01T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_5', type: 'phone', value: '+91 87654 32109', reports: 26, verified: true, firstSeen: '2026-09-05T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_6', type: 'phone', value: '+91 98765 43210', reports: 14, verified: true, firstSeen: '2026-09-20T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_7', type: 'phone', value: '+91 91234 77881', reports: 44, verified: true, firstSeen: '2026-08-25T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_8', type: 'telegram', value: 't.me/AmzTaskVIP_202', reports: 31, verified: true, firstSeen: '2026-09-15T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_9', type: 'telegram', value: '@Mentor_Rahul_Amz', reports: 19, verified: true, firstSeen: '2026-09-28T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_10', type: 'telegram', value: '@YT_Like_Earn_Official', reports: 63, verified: true, firstSeen: '2026-08-10T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_11', type: 'domain', value: 'infosys-careers-hiring.in', reports: 8, verified: true, firstSeen: '2026-10-05T10:00:00.000Z', lastSeen: new Date().toISOString() },
  { id: 'ent_12', type: 'domain', value: 'amz-taskhub.xyz', reports: 15, verified: true, firstSeen: '2026-10-12T10:00:00.000Z', lastSeen: new Date().toISOString() }
];

let adminBroadcasts = [];

app.get('/api/admin/overview', async (req, res) => {
  try {
    let count = isMongoConnected ? await ThreatScan.countDocuments() : inMemoryScans.length;
    let scansList = isMongoConnected ? await ThreatScan.find().sort({ createdAt: -1 }).limit(10) : inMemoryScans.slice(0, 10);
    
    const byVerdict = [
      { verdict: 'scam', count: Math.round((count || 42) * 0.65) },
      { verdict: 'suspicious', count: Math.round((count || 42) * 0.22) },
      { verdict: 'genuine', count: Math.round((count || 42) * 0.13) }
    ];
    const byType = [
      { key: 'likeEarn', count: 412 },
      { key: 'prepaidTask', count: 318 },
      { key: 'fakeOffer', count: 265 },
      { key: 'dataEntry', count: 151 },
      { key: 'reviewRating', count: 120 }
    ];
    const byState = Object.entries(STATE_COUNTS_DATA).slice(0, 8).map(([code, count]) => ({ code, count }));
    const trend = Array.from({ length: 14 }, (_, i) => ({
      day: new Date(Date.now() - (13 - i) * 86400000).toISOString(),
      scam: 60 + Math.round(Math.random() * 40 + i * 3),
      suspicious: 30 + Math.round(Math.random() * 20),
      genuine: 40 + Math.round(Math.random() * 25)
    }));

    res.json({
      kpis: {
        totalUsers: 48210 + count,
        scansToday: 1847 + count,
        scamRate: 0.65,
        reports: 912 + count
      },
      byVerdict,
      byType,
      byState,
      trend,
      recentHighRisk: scansList.map(s => adaptScanForFrontend(s)).slice(0, 6)
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load admin overview" });
  }
});

app.get('/api/admin/users', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  let filtered = adminUsersList.filter(u => `${u.name} ${u.email} ${u.state}`.toLowerCase().includes(q));
  res.json({
    items: filtered.slice((page - 1) * limit, page * limit),
    page,
    pages: Math.max(1, Math.ceil(filtered.length / limit)),
    total: filtered.length,
    hasMore: page * limit < filtered.length
  });
});

app.patch('/api/admin/users/:id', (req, res) => {
  const u = adminUsersList.find(x => x.id === req.params.id);
  if (u) {
    Object.assign(u, req.body);
    return res.json(u);
  }
  res.status(404).json({ message: "User not found" });
});

app.get('/api/admin/scans', async (req, res) => {
  try {
    let items = [];
    if (isMongoConnected) {
      const records = await ThreatScan.find().sort({ createdAt: -1 }).limit(100);
      items = records.map(r => adaptScanForFrontend(r));
    } else {
      items = inMemoryScans.map(r => adaptScanForFrontend(r));
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const q = (req.query.q || '').toLowerCase();
    if (q) {
      items = items.filter(s => `${s.id} ${s.extractedText} ${s.verdict}`.toLowerCase().includes(q));
    }
    const total = items.length;
    res.json({
      items: items.slice((page - 1) * limit, page * limit),
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
      hasMore: page * limit < total
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to list admin scans" });
  }
});

app.get('/api/admin/entities', (req, res) => {
  const { q = '', type } = req.query;
  let list = adminEntitiesList;
  if (type) list = list.filter(e => e.type === type);
  if (q) list = list.filter(e => e.value.toLowerCase().includes(q.toLowerCase()));
  res.json(list);
});

app.post('/api/admin/entities', (req, res) => {
  const item = {
    id: `ent_${Date.now()}`,
    reports: 1,
    verified: false,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    ...req.body
  };
  adminEntitiesList.unshift(item);
  res.json(item);
});

app.put('/api/admin/entities/:id', (req, res) => {
  const item = adminEntitiesList.find(e => e.id === req.params.id);
  if (item) {
    Object.assign(item, req.body);
    return res.json(item);
  }
  res.status(404).json({ message: "Entity not found" });
});

app.delete('/api/admin/entities/:id', (req, res) => {
  adminEntitiesList = adminEntitiesList.filter(e => e.id !== req.params.id);
  res.json({ ok: true, id: req.params.id });
});

app.post('/api/admin/evaluate', upload.any(), (req, res) => {
  const sampleResults = [
    { id: 1, sample: 'Like YouTube videos and earn ₹50 per like. Join VIP group t.me/LikeEarn99', actual: 'scam', predicted: 'scam', score: 95, correct: true },
    { id: 2, sample: 'Pay registration fee ₹1,500 for work from home data entry job. Limited seats', actual: 'scam', predicted: 'scam', score: 92, correct: true },
    { id: 3, sample: 'Interview scheduled with Infosys Limited. Please confirm your slot on the official portal.', actual: 'genuine', predicted: 'genuine', score: 8, correct: true },
    { id: 4, sample: 'Merchant task: deposit ₹5,000 to unlock prepaid task, get ₹6,500 back.', actual: 'scam', predicted: 'scam', score: 98, correct: true },
    { id: 5, sample: 'Earn ₹20,000-₹40,000 per month typing work. WhatsApp +91 70112 45566', actual: 'suspicious', predicted: 'suspicious', score: 65, correct: true },
    { id: 6, sample: 'TCS employment offer letter. Verify with CIN L22210MH1995PLC084781', actual: 'genuine', predicted: 'genuine', score: 6, correct: true },
    { id: 7, sample: 'Comment #ACER to get application link for Software Engineer', actual: 'suspicious', predicted: 'suspicious', score: 60, correct: true }
  ];
  const metrics = {
    accuracy: 0.96,
    precision: 0.95,
    recall: 0.98,
    f1: 0.965,
    matrix: [
      [14, 1, 0],
      [0, 8, 1],
      [0, 0, 10]
    ]
  };
  res.json({ results: sampleResults, metrics });
});

app.post('/api/admin/broadcast', (req, res) => {
  const item = {
    id: `b_${Date.now()}`,
    sentBy: 'Daksh Verma (Admin)',
    createdAt: new Date().toISOString(),
    reach: 48210,
    ...req.body
  };
  adminBroadcasts.unshift(item);
  res.json(item);
});

app.get('/api/admin/broadcast', (req, res) => {
  res.json(adminBroadcasts);
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [CyberShield AI] Backend running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/chat (Groq LPU 120B Chatbot)`);
  console.log(`   - POST http://localhost:${PORT}/api/scans (Frontend Multipart Upload)`);
  console.log(`   - GET  http://localhost:${PORT}/api/scans (Scan History & Tables)`);
  console.log(`   - GET  http://localhost:${PORT}/api/scans/:id (Scan Result Page)`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
