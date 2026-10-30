require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const ThreatScan = require('./models/ThreatScan');
const { analyzeThreat } = require('./services/aiEngine');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory fallback if MongoDB Atlas is not yet connected
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
} else {
  console.log("ℹ️ [MongoDB Atlas] MONGO_URI not configured yet. Operating in local memory mode.");
}

// ----------------- API ENDPOINTS -----------------

// 1. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: "online",
    system: "CyberShield AI Backend (CTBF-AI-11)",
    database: isMongoConnected ? "MongoDB Atlas (Connected)" : "Local In-Memory Mode",
    aiEngine: process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("YOUR_") ? "Gemini 1.5 Flash (Active)" : "Heuristic Rules (Active)"
  });
});

// 2. Scan Threat Endpoint (Core requirement)
app.post('/api/scan', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Missing 'text' in request body." });
    }

    // Run AI & MCA Verification
    const analysis = await analyzeThreat(text, process.env.GEMINI_API_KEY);

    // Save to Database (MongoDB or Memory)
    let savedRecord = null;
    if (isMongoConnected) {
      try {
        savedRecord = await ThreatScan.create({
          rawInput: text,
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
        timestamp: new Date(),
        ...analysis
      };
      inMemoryScans.unshift(savedRecord);
    }

    res.json({
      success: true,
      scanId: savedRecord.scanId,
      ...analysis
    });
  } catch (error) {
    console.error("Scan Error:", error);
    res.status(500).json({ error: "Threat analysis failed", details: error.message });
  }
});

// 3. Historical Reports Audit Trail
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

// 4. Incident Dossier Export for Helpline 1930
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

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [CyberShield AI] Backend running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/scan`);
  console.log(`   - GET  http://localhost:${PORT}/api/reports`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
