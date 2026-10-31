const mongoose = require('mongoose');

const ThreatScanSchema = new mongoose.Schema({
  scanId: {
    type: String,
    required: true,
    unique: true,
    default: () => `SCAN-${Math.floor(100000 + Math.random() * 900000)}`
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  rawInput: {
    type: String,
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  verdict: {
    type: String,
    enum: ['GENUINE_OFFER', 'SUSPICIOUS', 'CRITICAL_SCAM'],
    required: true
  },
  category: {
    type: String,
    default: 'Task-Based Employment Fraud'
  },
  scamStage: {
    currentStage: {
      type: Number, // 0 = Safe, 1 = Hook, 2 = Trust Building, 3 = Prepaid Trap, 4 = Extortion
      required: true
    },
    stageName: String,
    stageDescription: String,
    predictedNextMove: String // Crucial: Warns user before next payment
  },
  companyVerification: {
    claimedCompany: String,
    detectedDomain: String,
    isOfficialDomain: Boolean,
    mcaStatus: String
  },
  redFlags: [{
    type: String
  }],
  dossier1930: {
    phoneNumbers: [String],
    telegramHandles: [String],
    upiIds: [String],
    impersonatedEntity: String,
    policeNarrative: String
  }
}, { timestamps: true });

module.exports = mongoose.model('ThreatScan', ThreatScanSchema);
