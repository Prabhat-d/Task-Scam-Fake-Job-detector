const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { verifyCompanyAgainstMCA } = require('./services/mcaVerifier');
const { analyzeThreat } = require('./services/aiEngine');
const { handleChat } = require('./services/chatEngine');

async function runTests() {
  console.log('======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE CYBERSHIELD AI TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Expanded Top 1,000+ Corporate Registry & Live DNS Lookup
  console.log('\n--- 1. Testing MCA Corporate Registry & Live DNS Verification ---');
  try {
    const tcs = await verifyCompanyAgainstMCA('TCS', 'Email: hr@tcs.com');
    assert(tcs.isOfficialDomain === true && tcs.cin === 'L22210MH1995PLC084781', 'TCS official domain & CIN match');
    assert(tcs.liveDnsVerified === true, 'TCS live DNS MX mail server verified');

    const infyGmail = await verifyCompanyAgainstMCA('Infosys', 'Contact: infosys.careers@gmail.com');
    assert(infyGmail.isFreeMailProvider === true && infyGmail.domainMismatch === true, 'Flagged Infosys imposter with free @gmail.com');

    const zomato = await verifyCompanyAgainstMCA('Zomato', 'Official email: careers@zomato.com');
    assert(zomato.isLegitimateRegisteredEntity === true && zomato.cin === 'L93030DL2010PLC198141', 'Zomato top-company registry match');

    const reliance = await verifyCompanyAgainstMCA('Reliance Industries', 'Email: contact@ril.com');
    assert(reliance.isOfficialDomain === true && reliance.cin === 'L17110MH1973PLC019786', 'Reliance Industries official registry match');

    const fake = await verifyCompanyAgainstMCA('Fake Scammer LLC', 'Email: jobs@fake-nonexistent-domain-0987654.xyz');
    assert(fake.isOfficialDomain === false && fake.liveDnsVerified === false, 'Flagged fake nonexistent domain with failed MX');
  } catch (err) {
    console.error('MCA Test Error:', err);
    assert(false, 'MCA Verification suite executed without crashes');
  }

  // TEST 2: Multi-Modal Threat Analyzer
  console.log('\n--- 2. Testing Multimodal AI Threat Analysis ---');
  try {
    const scan = await analyzeThreat(
      'Like YouTube videos and earn ₹50 per like. Join our VIP group t.me/LikeEarn99 to start prepaid tasks.',
      process.env.GEMINI_API_KEY
    );
    assert(scan.verdict === 'CRITICAL_SCAM', 'Classified task scam as CRITICAL_SCAM');
    assert(scan.riskScore >= 75, `High risk score assigned: ${scan.riskScore}/100`);
    assert(scan.scamStage && scan.scamStage.predictedNextMove, 'Predicted next move warning generated');
    assert(scan.dossier1930 && scan.dossier1930.policeNarrative, 'Generated police-ready 1930 narrative');
  } catch (err) {
    console.error('Threat Analysis Error:', err);
    assert(false, 'Threat Analyzer executed without crashes');
  }

  // TEST 3: AI Safety Chatbot Engine
  console.log('\n--- 3. Testing Conversational Safety Advisory Engine ---');
  try {
    const chat = await handleChat({
      message: 'Someone on Telegram asked me to deposit ₹2,000 to unfreeze my task payment. What should I do?'
    });
    assert(chat.reply && (chat.reply.en || chat.reply.hi), 'Chatbot generated multilingual advisory reply');
    assert(chat.actions && chat.actions.includes('call'), 'Chatbot recommended Helpline 1930 call action');
  } catch (err) {
    console.error('Chatbot Error:', err);
    assert(false, 'Chatbot executed without crashes');
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
