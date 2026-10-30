/**
 * Mock "AI" analyser. Rule-based so the demo produces believable, explainable results
 * from whatever text the user pastes. The real backend replaces all of this.
 */
import { MCA_REGISTRY, DOMAIN_DB, FREE_MAIL, SAMPLE_TEXTS } from './data.js';

const L = (en, hi, pa) => ({ en, hi, pa });

/** Detection rules: regex → red flag. `track` and `stage` drive the stage tracker. */
const RULES = [
  {
    id: 'pay_to_work', re: /(registration|security|refundable|joining|processing)\s+(fee|deposit)|laptop\s+(security\s+)?deposit|id card/i,
    severity: 'critical', weight: 30, track: 'job', stage: 1,
    title: L('Asks you to pay to get the job', 'नौकरी के लिए पैसे मांगे जा रहे हैं', 'ਨੌਕਰੀ ਲਈ ਪੈਸੇ ਮੰਗੇ ਜਾ ਰਹੇ ਹਨ'),
    why: L('Real companies never charge a fee or deposit to hire you.', 'असली कंपनियाँ नौकरी देने के लिए कभी फीस या जमा राशि नहीं लेतीं।', 'ਅਸਲ ਕੰਪਨੀਆਂ ਨੌਕਰੀ ਦੇਣ ਲਈ ਕਦੇ ਫੀਸ ਜਾਂ ਜਮ੍ਹਾਂ ਰਕਮ ਨਹੀਂ ਲੈਂਦੀਆਂ।'),
  },
  {
    id: 'verification_fee', re: /(document|verification|background)\s+(verification\s+)?fee/i,
    severity: 'critical', weight: 20, track: 'job', stage: 2,
    title: L('Second fee for "verification"', '"वेरिफिकेशन" के नाम पर दूसरी फीस', '"ਵੈਰੀਫਿਕੇਸ਼ਨ" ਦੇ ਨਾਂ \'ਤੇ ਦੂਜੀ ਫੀਸ'),
    why: L('Scammers keep adding new fees after the first payment.', 'पहली पेमेंट के बाद ठग नई-नई फीस जोड़ते रहते हैं।', 'ਪਹਿਲੀ ਪੇਮੈਂਟ ਤੋਂ ਬਾਅਦ ਠੱਗ ਨਵੀਆਂ ਫੀਸਾਂ ਜੋੜਦੇ ਰਹਿੰਦੇ ਹਨ।'),
  },
  {
    id: 'like_earn', re: /like\s+(youtube\s+)?videos?|₹\s?\d+\s+per\s+like|rate\s+(hotels|products)|subscribe\s+channels?/i,
    severity: 'high', weight: 22, track: 'task', stage: 0,
    title: L('"Like videos and earn" task offer', '"वीडियो लाइक करो और कमाओ" वाला काम', '"ਵੀਡੀਓ ਲਾਈਕ ਕਰੋ ਤੇ ਕਮਾਓ" ਵਾਲਾ ਕੰਮ'),
    why: L('This is the opening hook of the most common Telegram task scam.', 'यह सबसे आम टेलीग्राम टास्क ठगी की शुरुआत होती है।', 'ਇਹ ਸਭ ਤੋਂ ਆਮ ਟੈਲੀਗ੍ਰਾਮ ਟਾਸਕ ਠੱਗੀ ਦੀ ਸ਼ੁਰੂਆਤ ਹੁੰਦੀ ਹੈ।'),
  },
  {
    id: 'trust_payout', re: /(₹\s?\d+[\d,]*\s+(has been\s+)?sent to your|trial payment|task 1 done)/i,
    severity: 'medium', weight: 10, track: 'task', stage: 1,
    title: L('Small payment to win your trust', 'भरोसा जीतने के लिए छोटी पेमेंट', 'ਭਰੋਸਾ ਜਿੱਤਣ ਲਈ ਛੋਟੀ ਪੇਮੈਂਟ'),
    why: L('They pay a little first so you trust them with a bigger amount later.', 'पहले थोड़े पैसे देते हैं ताकि बाद में आप बड़ी रकम भेजें।', 'ਪਹਿਲਾਂ ਥੋੜ੍ਹੇ ਪੈਸੇ ਦਿੰਦੇ ਹਨ ਤਾਂ ਜੋ ਬਾਅਦ ਵਿੱਚ ਤੁਸੀਂ ਵੱਡੀ ਰਕਮ ਭੇਜੋ।'),
  },
  {
    id: 'private_group', re: /(vip|private|premium)\s+(telegram\s+)?group|t\.me\/[\w_]+/i,
    severity: 'high', weight: 12, track: 'task', stage: 2,
    title: L('Moved you to a private group', 'आपको प्राइवेट ग्रुप में ले जाया गया', 'ਤੁਹਾਨੂੰ ਪ੍ਰਾਈਵੇਟ ਗਰੁੱਪ ਵਿੱਚ ਲਿਜਾਇਆ ਗਿਆ'),
    why: L('Private groups are full of fake members who pretend to earn money.', 'प्राइवेट ग्रुप में नकली मेंबर होते हैं जो कमाई का दिखावा करते हैं।', 'ਪ੍ਰਾਈਵੇਟ ਗਰੁੱਪਾਂ ਵਿੱਚ ਨਕਲੀ ਮੈਂਬਰ ਹੁੰਦੇ ਹਨ ਜੋ ਕਮਾਈ ਦਾ ਦਿਖਾਵਾ ਕਰਦੇ ਹਨ।'),
  },
  {
    id: 'prepaid_task', re: /(merchant|prepaid|recharge)\s+task|deposit\s+₹?\s?[\d,]+\s+to\s+unlock|pay\s+₹\s?[\d,]+\s+and\s+get/i,
    severity: 'critical', weight: 25, track: 'task', stage: 3,
    title: L('Asks you to deposit money for a "task"', '"टास्क" के लिए पैसे जमा करने को कहा', '"ਟਾਸਕ" ਲਈ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਨ ਲਈ ਕਿਹਾ'),
    why: L('Any job where you pay first to earn more is a scam.', 'जिस काम में पहले आपको पैसे देने पड़ें, वह ठगी है।', 'ਜਿਸ ਕੰਮ ਵਿੱਚ ਪਹਿਲਾਂ ਤੁਹਾਨੂੰ ਪੈਸੇ ਦੇਣੇ ਪੈਣ, ਉਹ ਠੱਗੀ ਹੈ।'),
  },
  {
    id: 'frozen', re: /(wrong operation|unfreeze|frozen|combo task|account (is )?blocked)/i,
    severity: 'critical', weight: 20, track: 'task', stage: 4,
    title: L('"Account frozen – pay to unfreeze"', '"अकाउंट फ्रीज़ – पैसे दो तो खुलेगा"', '"ਅਕਾਊਂਟ ਫ੍ਰੀਜ਼ – ਪੈਸੇ ਦਿਓ ਤਾਂ ਖੁੱਲ੍ਹੇਗਾ"'),
    why: L('There is no real account. They invent problems to take more money.', 'कोई असली अकाउंट नहीं है। ज़्यादा पैसे लेने के लिए बहाने बनाते हैं।', 'ਕੋਈ ਅਸਲ ਅਕਾਊਂਟ ਨਹੀਂ ਹੈ। ਹੋਰ ਪੈਸੇ ਲੈਣ ਲਈ ਬਹਾਨੇ ਬਣਾਉਂਦੇ ਹਨ।'),
  },
  {
    id: 'exit_fee', re: /(income\s+)?tax\s+₹?|withdraw(al)?\s+fee|to withdraw/i,
    severity: 'critical', weight: 15, track: 'task', stage: 5,
    title: L('"Pay tax to withdraw"', '"निकालने के लिए टैक्स भरो"', '"ਕਢਵਾਉਣ ਲਈ ਟੈਕਸ ਭਰੋ"'),
    why: L('You will never get money back. Each payment leads to another demand.', 'पैसे कभी वापस नहीं मिलेंगे। हर पेमेंट के बाद नई मांग आएगी।', 'ਪੈਸੇ ਕਦੇ ਵਾਪਸ ਨਹੀਂ ਮਿਲਣਗੇ। ਹਰ ਪੇਮੈਂਟ ਤੋਂ ਬਾਅਦ ਨਵੀਂ ਮੰਗ ਆਵੇਗੀ।'),
  },
  {
    id: 'urgency', re: /(only\s+\d+\s+(hours?|mins?|minutes)|valid only|hurry|limited seats|urgent)/i,
    severity: 'medium', weight: 8, track: null, stage: null, jobStage: 3,
    title: L('Pressure to act fast', 'जल्दी फैसला लेने का दबाव', 'ਜਲਦੀ ਫ਼ੈਸਲਾ ਲੈਣ ਦਾ ਦਬਾਅ'),
    why: L('Scammers rush you so you do not stop and check.', 'ठग जल्दबाज़ी कराते हैं ताकि आप जाँच न करें।', 'ਠੱਗ ਕਾਹਲੀ ਕਰਾਉਂਦੇ ਹਨ ਤਾਂ ਜੋ ਤੁਸੀਂ ਜਾਂਚ ਨਾ ਕਰੋ।'),
  },
  {
    id: 'no_interview', re: /(no interview|no experience|selected without|directly selected)/i,
    severity: 'medium', weight: 8, track: 'job', stage: 0,
    title: L('Selected without a proper interview', 'बिना इंटरव्यू के चयन', 'ਬਿਨਾਂ ਇੰਟਰਵਿਊ ਦੇ ਚੋਣ'),
    why: L('Real hiring has interviews and checks.', 'असली भर्ती में इंटरव्यू और जाँच होती है।', 'ਅਸਲ ਭਰਤੀ ਵਿੱਚ ਇੰਟਰਵਿਊ ਤੇ ਜਾਂਚ ਹੁੰਦੀ ਹੈ।'),
  },
  {
    id: 'high_pay', re: /(earn|earning)\s+₹\s?[\d,]+\s*(-|–|to)\s*₹?\s?[\d,]+\s*(daily|per day|per month)?|daily earning/i,
    severity: 'medium', weight: 8, track: null, stage: null,
    title: L('Too-good-to-be-true pay', 'बहुत ज़्यादा कमाई का लालच', 'ਬਹੁਤ ਜ਼ਿਆਦਾ ਕਮਾਈ ਦਾ ਲਾਲਚ'),
    why: L('Very high pay for very easy work is a classic lure.', 'आसान काम के लिए बहुत ज़्यादा पैसे – यह आम लालच है।', 'ਆਸਾਨ ਕੰਮ ਲਈ ਬਹੁਤ ਜ਼ਿਆਦਾ ਪੈਸੇ – ਇਹ ਆਮ ਲਾਲਚ ਹੈ।'),
  },
  {
    id: 'whatsapp_only', re: /(contact|message)\s+(us\s+)?on\s+whatsapp|whatsapp\s+\+?91/i,
    severity: 'low', weight: 6, track: null, stage: null,
    title: L('Contact only on WhatsApp/Telegram', 'सिर्फ़ WhatsApp/Telegram पर संपर्क', 'ਸਿਰਫ਼ WhatsApp/Telegram \'ਤੇ ਸੰਪਰਕ'),
    why: L('Genuine HR teams use official email and websites.', 'असली HR ऑफिशियल ईमेल और वेबसाइट इस्तेमाल करते हैं।', 'ਅਸਲ HR ਅਧਿਕਾਰਤ ਈਮੇਲ ਤੇ ਵੈੱਬਸਾਈਟ ਵਰਤਦੇ ਹਨ।'),
  },
];

const RE = {
  upi: /\b[\w.-]{2,}@(ybl|paytm|okaxis|oksbi|okhdfcbank|okicici|ibl|axl|upi|apl|ptyes|ptsbi)\b/gi,
  phone: /(\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g,
  telegram: /(t\.me\/[\w_]+|(?<![\w.])@[A-Za-z][\w_]{4,}(?![\w.@]))/g,
  link: /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi,
  amount: /(₹\s?[\d,]{2,}|Rs\.?\s?[\d,]{2,})/gi,
  email: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g,
};

const uniq = (arr) => [...new Set(arr.map((s) => s.trim()))];

export function extractEntities(text, entityDb) {
  const seen = (type, value) => {
    const norm = (v) => v.toLowerCase().replace(/\s|-/g, '');
    return entityDb.find((e) => e.type === type && norm(e.value) === norm(value))?.reports || 0;
  };
  const out = [];
  uniq(text.match(RE.upi) || []).forEach((v) => out.push({ type: 'upi', value: v, seenCount: seen('upi', v) }));
  uniq(text.match(RE.phone) || []).forEach((v) => {
    const digits = v.replace(/\D/g, '').slice(-10);
    const pretty = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    out.push({ type: 'phone', value: pretty, seenCount: seen('phone', pretty) });
  });
  uniq(text.match(RE.telegram) || []).forEach((v) => out.push({ type: 'telegram', value: v, seenCount: seen('telegram', v) }));
  uniq(text.match(RE.link) || []).forEach((v) => {
    const host = v.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    out.push({ type: 'link', value: v, seenCount: seen('domain', host) });
  });
  uniq(text.match(RE.amount) || []).forEach((v) => out.push({ type: 'amount', value: v.replace(/\s/g, ''), seenCount: 0 }));
  return out;
}

export function verifyCompany(name) {
  if (!name) return { name: null, status: 'not_provided' };
  const q = name.toLowerCase();
  const exact = MCA_REGISTRY.find((c) => c.name.toLowerCase() === q);
  const alias = MCA_REGISTRY.find((c) => c.aliases.some((a) => q.includes(a)));
  const hit = exact || alias;
  if (!hit) return { name, cin: null, status: 'not_found', incorporated: null, state: null, nameMatch: false };
  return {
    name: hit.name,
    queried: name,
    cin: hit.cin,
    status: hit.status,
    incorporated: hit.incorporated,
    state: hit.state,
    officialDomain: hit.domain,
    nameMatch: !!exact || q.replace(/pvt\.?|private|ltd\.?|limited/g, '').trim() === hit.name.toLowerCase().replace(/private|limited/g, '').trim(),
  };
}

export function verifyDomain(domain, hrEmail, officialDomain) {
  const emailDomain = hrEmail?.split('@')[1]?.toLowerCase() || null;
  const d = (domain || emailDomain || '').toLowerCase();
  // Match sub-domains to their registered domain (careers.tcs.com → tcs.com).
  const known = Object.keys(DOMAIN_DB).find((k) => d === k || d.endsWith(`.${k}`));
  const info = known ? DOMAIN_DB[known] : d ? { ageDays: d.endsWith('.in') || d.endsWith('.com') ? 45 : 9, mx: false } : null;
  return {
    domain: d || null,
    officialDomain: officialDomain || null,
    ageDays: info?.ageDays ?? null,
    mx: info?.mx ?? null,
    hrEmail: hrEmail || null,
    emailType: emailDomain ? (FREE_MAIL.includes(emailDomain) ? 'free' : 'corporate') : null,
    matchesOfficial: officialDomain ? d === officialDomain || d.endsWith(`.${officialDomain}`) : null,
  };
}

/** Pick a sample text for file-only scans (pretend OCR result). */
function ocrFallback(files, companyName = '') {
  const n = `${files.map((f) => f.name).join(' ')} ${companyName}`.toLowerCase();
  if (/tcs|tata|naukri|genuine/.test(n)) return SAMPLE_TEXTS.genuineOffer;
  if (/offer|letter|pdf|docx|infosys/.test(n)) return SAMPLE_TEXTS.fakeOffer;
  return SAMPLE_TEXTS.taskScam;
}

const NEXT_MOVE = {
  task: [
    L('Next they will pay you a small amount to win your trust. It is bait.', 'आगे वे भरोसा जीतने के लिए थोड़े पैसे भेजेंगे। यह जाल है।', 'ਅੱਗੇ ਉਹ ਭਰੋਸਾ ਜਿੱਤਣ ਲਈ ਥੋੜ੍ਹੇ ਪੈਸੇ ਭੇਜਣਗੇ। ਇਹ ਜਾਲ ਹੈ।'),
    L('Next they will move you to a private Telegram group. Do not join.', 'आगे वे आपको प्राइवेट टेलीग्राम ग्रुप में ले जाएँगे। शामिल न हों।', 'ਅੱਗੇ ਉਹ ਤੁਹਾਨੂੰ ਪ੍ਰਾਈਵੇਟ ਟੈਲੀਗ੍ਰਾਮ ਗਰੁੱਪ ਵਿੱਚ ਲੈ ਜਾਣਗੇ। ਸ਼ਾਮਲ ਨਾ ਹੋਵੋ।'),
    L('Next they will ask you to deposit money for a "prepaid task". Do not pay.', 'आगे वे "प्रीपेड टास्क" के लिए पैसे जमा करने को कहेंगे। पैसे न दें।', 'ਅੱਗੇ ਉਹ "ਪ੍ਰੀਪੇਡ ਟਾਸਕ" ਲਈ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਨ ਲਈ ਕਹਿਣਗੇ। ਪੈਸੇ ਨਾ ਦਿਓ।'),
    L('Next they will say your account is frozen and ask for a bigger amount. Do not pay.', 'आगे वे कहेंगे अकाउंट फ्रीज़ है और बड़ी रकम मांगेंगे। पैसे न दें।', 'ਅੱਗੇ ਉਹ ਕਹਿਣਗੇ ਅਕਾਊਂਟ ਫ੍ਰੀਜ਼ ਹੈ ਤੇ ਵੱਡੀ ਰਕਮ ਮੰਗਣਗੇ। ਪੈਸੇ ਨਾ ਦਿਓ।'),
    L("Next they will likely ask you to pay a 'tax' to withdraw. Do not pay.", "आगे वे पैसे निकालने के लिए 'टैक्स' मांगेंगे। पैसे न दें।", "ਅੱਗੇ ਉਹ ਪੈਸੇ ਕਢਵਾਉਣ ਲਈ 'ਟੈਕਸ' ਮੰਗਣਗੇ। ਪੈਸੇ ਨਾ ਦਿਓ।"),
    L('They will keep asking for more. Stop paying now and call 1930 immediately.', 'वे और पैसे मांगते रहेंगे। अभी पेमेंट रोकें और तुरंत 1930 पर कॉल करें।', 'ਉਹ ਹੋਰ ਪੈਸੇ ਮੰਗਦੇ ਰਹਿਣਗੇ। ਹੁਣੇ ਪੇਮੈਂਟ ਰੋਕੋ ਤੇ ਤੁਰੰਤ 1930 \'ਤੇ ਕਾਲ ਕਰੋ।'),
  ],
  job: [
    L('Next they will ask for a "registration" or "security deposit" fee. Do not pay.', 'आगे वे "रजिस्ट्रेशन" या "सिक्योरिटी डिपॉज़िट" फीस मांगेंगे। पैसे न दें।', 'ਅੱਗੇ ਉਹ "ਰਜਿਸਟ੍ਰੇਸ਼ਨ" ਜਾਂ "ਸਿਕਿਓਰਿਟੀ ਡਿਪਾਜ਼ਿਟ" ਫੀਸ ਮੰਗਣਗੇ। ਪੈਸੇ ਨਾ ਦਿਓ।'),
    L('Next they will ask for a "document verification" fee. Do not pay.', 'आगे वे "डॉक्यूमेंट वेरिफिकेशन" फीस मांगेंगे। पैसे न दें।', 'ਅੱਗੇ ਉਹ "ਡਾਕੂਮੈਂਟ ਵੈਰੀਫਿਕੇਸ਼ਨ" ਫੀਸ ਮੰਗਣਗੇ। ਪੈਸੇ ਨਾ ਦਿਓ।'),
    L('Next they will pressure you with deadlines or threats. Stop replying.', 'आगे वे समय-सीमा या धमकी से दबाव बनाएँगे। जवाब देना बंद करें।', 'ਅੱਗੇ ਉਹ ਸਮਾਂ-ਸੀਮਾ ਜਾਂ ਧਮਕੀ ਨਾਲ ਦਬਾਅ ਬਣਾਉਣਗੇ। ਜਵਾਬ ਦੇਣਾ ਬੰਦ ਕਰੋ।'),
    L('They will keep inventing new fees. Stop paying and call 1930 now.', 'वे नई-नई फीस बनाते रहेंगे। पेमेंट रोकें और अभी 1930 पर कॉल करें।', 'ਉਹ ਨਵੀਆਂ ਫੀਸਾਂ ਬਣਾਉਂਦੇ ਰਹਿਣਗੇ। ਪੇਮੈਂਟ ਰੋਕੋ ਤੇ ਹੁਣੇ 1930 \'ਤੇ ਕਾਲ ਕਰੋ।'),
  ],
};

/**
 * Analyse input and return a full scan result object (same shape the backend returns).
 */
export function analyse({ text = '', link = '', companyName = '', hrEmail = '', amountPaid = '', files = [] }, entityDb) {
  const body = (text || '').trim() || (files.length ? ocrFallback(files, companyName) : '') || link;
  const flags = [];
  let score = 5;
  const trackHits = { task: 0, job: 0 };
  const stageHits = { task: -1, job: -1 };

  RULES.forEach((r) => {
    const m = body.match(r.re);
    if (!m) return;
    flags.push({ id: r.id, severity: r.severity, title: r.title, explanation: r.why, evidence: m[0] });
    score += r.weight;
    if (r.track) {
      trackHits[r.track] += r.weight;
      stageHits[r.track] = Math.max(stageHits[r.track], r.stage);
    }
    if (r.jobStage != null) stageHits.job = Math.max(stageHits.job, r.jobStage);
  });

  // Company + domain checks
  const COMPANY_RE = /(?:at|Company:)\s+([A-Z][\w&.]*(?:\s+[A-Z][\w&.]*){0,4}\s+(?:Pvt\.?\s+Ltd|Private Limited|Limited|Ltd))/;
  const detectedCompany = companyName || (body.match(COMPANY_RE) || [])[1] || '';
  const company = verifyCompany(detectedCompany);
  const isUpi = (e) => /@(ybl|paytm|okaxis|oksbi|okhdfcbank|okicici|ibl|axl|upi|apl|ptyes|ptsbi)$/i.test(e);
  const emailInText = (body.match(RE.email) || []).find((e) => !isUpi(e));
  const email = hrEmail || emailInText || '';
  const linkHost = (link || (body.match(RE.link) || [])[0] || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const domain = verifyDomain(linkHost && !/t\.me/.test(linkHost) ? linkHost : '', email, company.officialDomain);

  if (company.status === 'not_found') {
    score += 12;
    flags.push({ id: 'mca_not_found', severity: 'high', evidence: detectedCompany, title: L('Company not found in MCA records', 'MCA रिकॉर्ड में कंपनी नहीं मिली', 'MCA ਰਿਕਾਰਡ ਵਿੱਚ ਕੰਪਨੀ ਨਹੀਂ ਮਿਲੀ'), explanation: L('The company name does not match any registered Indian company.', 'यह नाम किसी रजिस्टर्ड भारतीय कंपनी से मेल नहीं खाता।', 'ਇਹ ਨਾਂ ਕਿਸੇ ਰਜਿਸਟਰਡ ਭਾਰਤੀ ਕੰਪਨੀ ਨਾਲ ਮੇਲ ਨਹੀਂ ਖਾਂਦਾ।') });
  }
  if (company.cin && !company.nameMatch && company.status === 'active') {
    score += 12;
    flags.push({ id: 'impersonation', severity: 'high', evidence: detectedCompany, title: L('Uses a big company\'s name, but not its exact registered name', 'बड़ी कंपनी का नाम इस्तेमाल, पर रजिस्टर्ड नाम से अलग', 'ਵੱਡੀ ਕੰਪਨੀ ਦਾ ਨਾਂ ਵਰਤਿਆ, ਪਰ ਰਜਿਸਟਰਡ ਨਾਂ ਤੋਂ ਵੱਖਰਾ'), explanation: L(`The real company is "${company.name}". Scammers add words like "Solutions" or "Services" to look official.`, `असली कंपनी "${company.name}" है। ठग "Solutions" या "Services" जैसे शब्द जोड़कर असली दिखने की कोशिश करते हैं।`, `ਅਸਲ ਕੰਪਨੀ "${company.name}" ਹੈ। ਠੱਗ "Solutions" ਜਾਂ "Services" ਵਰਗੇ ਸ਼ਬਦ ਜੋੜ ਕੇ ਅਸਲ ਦਿਖਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰਦੇ ਹਨ।`) });
  }
  if (company.status === 'struck_off') {
    score += 15;
    flags.push({ id: 'mca_struck', severity: 'high', evidence: detectedCompany, title: L('Company is struck off', 'कंपनी बंद (स्ट्रक ऑफ) है', 'ਕੰਪਨੀ ਬੰਦ (ਸਟ੍ਰੱਕ ਆਫ) ਹੈ'), explanation: L('This company is closed in MCA records and cannot hire.', 'MCA रिकॉर्ड में यह कंपनी बंद है, यह भर्ती नहीं कर सकती।', 'MCA ਰਿਕਾਰਡ ਵਿੱਚ ਇਹ ਕੰਪਨੀ ਬੰਦ ਹੈ, ਇਹ ਭਰਤੀ ਨਹੀਂ ਕਰ ਸਕਦੀ।') });
  }
  if (domain.emailType === 'free' && company.status !== 'not_provided') {
    score += 10;
    flags.push({ id: 'free_mail', severity: 'high', evidence: email, title: L('HR uses a free Gmail/Yahoo address', 'HR मुफ़्त Gmail/Yahoo ईमेल इस्तेमाल कर रहा है', 'HR ਮੁਫ਼ਤ Gmail/Yahoo ਈਮੇਲ ਵਰਤ ਰਿਹਾ ਹੈ'), explanation: L('Big companies send offers from their own domain, not Gmail.', 'बड़ी कंपनियाँ अपने डोमेन से ऑफर भेजती हैं, Gmail से नहीं।', 'ਵੱਡੀਆਂ ਕੰਪਨੀਆਂ ਆਪਣੇ ਡੋਮੇਨ ਤੋਂ ਆਫ਼ਰ ਭੇਜਦੀਆਂ ਹਨ, Gmail ਤੋਂ ਨਹੀਂ।') });
  }
  if (domain.domain && domain.ageDays != null && domain.ageDays < 90) {
    score += 10;
    flags.push({ id: 'new_domain', severity: 'medium', evidence: domain.domain, title: L('Website was created very recently', 'वेबसाइट हाल ही में बनी है', 'ਵੈੱਬਸਾਈਟ ਹਾਲ ਹੀ ਵਿੱਚ ਬਣੀ ਹੈ'), explanation: L('Scam sites are usually only a few days or weeks old.', 'ठगी वाली साइटें आमतौर पर कुछ ही दिन पुरानी होती हैं।', 'ਠੱਗੀ ਵਾਲੀਆਂ ਸਾਈਟਾਂ ਆਮ ਤੌਰ \'ਤੇ ਕੁਝ ਹੀ ਦਿਨ ਪੁਰਾਣੀਆਂ ਹੁੰਦੀਆਂ ਹਨ।') });
  }

  const entities = extractEntities(body, entityDb);
  const knownBad = entities.filter((e) => e.seenCount > 0);
  if (knownBad.length) {
    score += 10;
    flags.push({ id: 'known_entity', severity: 'critical', evidence: knownBad[0].value, title: L('Payment ID / number already reported', 'पेमेंट ID / नंबर पहले से रिपोर्ट हो चुका है', 'ਪੇਮੈਂਟ ID / ਨੰਬਰ ਪਹਿਲਾਂ ਹੀ ਰਿਪੋਰਟ ਹੋ ਚੁੱਕਾ ਹੈ'), explanation: L('Other people have reported these details in earlier scams.', 'दूसरे लोगों ने इन्हें पहले ठगी में रिपोर्ट किया है।', 'ਹੋਰ ਲੋਕਾਂ ਨੇ ਇਨ੍ਹਾਂ ਨੂੰ ਪਹਿਲਾਂ ਠੱਗੀ ਵਿੱਚ ਰਿਪੋਰਟ ਕੀਤਾ ਹੈ।') });
  }

  // Genuine signals pull the score down.
  if (company.status === 'active' && domain.emailType !== 'free' && !flags.some((f) => f.severity === 'critical')) score = Math.min(score, 12);
  score = Math.max(2, Math.min(99, score));
  // Nothing to verify and no signals either way → "unclear", never a confident "genuine".
  const unclear = !flags.length && company.status === 'not_provided' && !domain.domain && !domain.hrEmail;
  if (unclear) score = 32;
  const verdict = score >= 65 ? 'scam' : score >= 30 ? 'suspicious' : 'genuine';

  const track = trackHits.job > trackHits.task ? 'job' : 'task';
  const stage = verdict === 'genuine' || unclear ? -1 : Math.max(0, stageHits[track]);
  const steps = NEXT_MOVE[track];
  const nextMove = stage < 0 ? null : steps[Math.min(stage, steps.length - 1)];

  const type = files.some((f) => /pdf|docx|word/.test(f.type || f.name)) || /offer letter|subject:\s*offer/i.test(body)
    ? 'offer_letter'
    : /\[telegram\]|\[vip group\]|me:/i.test(body) || files.some((f) => /^image/.test(f.type))
      ? (files.length ? 'screenshot' : 'chat')
      : 'job_post';

  const firstLine = body.split('\n').find((l) => l.trim())?.replace(/^\[.*?\]\s*|^subject:\s*/i, '').slice(0, 60) || '';
  const title = company.name && company.status !== 'not_provided' ? company.name : firstLine || 'Scan';

  return {
    verdict,
    score,
    type,
    title,
    track,
    stage,
    nextMove,
    redFlags: flags.sort((a, b) => ['critical', 'high', 'medium', 'low'].indexOf(a.severity) - ['critical', 'high', 'medium', 'low'].indexOf(b.severity)),
    extractedText: body,
    company,
    domain,
    entities,
    amountPaid: amountPaid ? Number(amountPaid) : null,
    summary: unclear ? UNCLEAR.summary : SUMMARY[verdict],
    explanation: unclear ? UNCLEAR.explanation : explain(verdict, track, flags, amountPaid),
  };
}

const SUMMARY = {
  scam: L('This looks like a scam. Do not send any money.', 'यह ठगी लगती है। कोई पैसा न भेजें।', 'ਇਹ ਠੱਗੀ ਲੱਗਦੀ ਹੈ। ਕੋਈ ਪੈਸਾ ਨਾ ਭੇਜੋ।'),
  suspicious: L('Some warning signs found. Check carefully before you trust it.', 'कुछ खतरे के संकेत मिले। भरोसा करने से पहले ध्यान से जाँचें।', 'ਕੁਝ ਖ਼ਤਰੇ ਦੇ ਸੰਕੇਤ ਮਿਲੇ। ਭਰੋਸਾ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਧਿਆਨ ਨਾਲ ਜਾਂਚੋ।'),
  genuine: L('This looks genuine. The company and email check out.', 'यह असली लगता है। कंपनी और ईमेल सही पाए गए।', 'ਇਹ ਅਸਲ ਲੱਗਦਾ ਹੈ। ਕੰਪਨੀ ਤੇ ਈਮੇਲ ਸਹੀ ਪਾਏ ਗਏ।'),
};

const UNCLEAR = {
  summary: L('Not enough information to be sure. Add the company name or HR email.', 'पक्का कहने के लिए जानकारी कम है। कंपनी का नाम या HR ईमेल जोड़ें।', 'ਪੱਕਾ ਕਹਿਣ ਲਈ ਜਾਣਕਾਰੀ ਘੱਟ ਹੈ। ਕੰਪਨੀ ਦਾ ਨਾਂ ਜਾਂ HR ਈਮੇਲ ਜੋੜੋ।'),
  explanation: L(
    'We did not find common scam signs, but we also could not verify any company, website or email. Paste the full message, or add the company name and HR email under "Optional details", and scan again. Until then, do not pay anything.',
    'हमें ठगी के आम संकेत नहीं मिले, पर कोई कंपनी, वेबसाइट या ईमेल भी जाँच नहीं पाए। पूरा मैसेज पेस्ट करें, या "अतिरिक्त जानकारी" में कंपनी का नाम और HR ईमेल जोड़कर फिर स्कैन करें। तब तक कोई पैसा न दें।',
    'ਸਾਨੂੰ ਠੱਗੀ ਦੇ ਆਮ ਸੰਕੇਤ ਨਹੀਂ ਮਿਲੇ, ਪਰ ਕੋਈ ਕੰਪਨੀ, ਵੈੱਬਸਾਈਟ ਜਾਂ ਈਮੇਲ ਵੀ ਜਾਂਚ ਨਹੀਂ ਸਕੇ। ਪੂਰਾ ਮੈਸੇਜ ਪੇਸਟ ਕਰੋ, ਜਾਂ "ਵਾਧੂ ਜਾਣਕਾਰੀ" ਵਿੱਚ ਕੰਪਨੀ ਦਾ ਨਾਂ ਤੇ HR ਈਮੇਲ ਜੋੜ ਕੇ ਮੁੜ ਸਕੈਨ ਕਰੋ। ਉਦੋਂ ਤੱਕ ਕੋਈ ਪੈਸਾ ਨਾ ਦਿਓ।'
  ),
};

function explain(verdict, track, flags, paid) {
  const n = flags.length;
  if (verdict === 'genuine') {
    return L(
      'We checked the company in government (MCA) records and it is active. The email comes from the company’s official website and nobody is asking you for money. Still, never share OTPs or bank passwords with anyone.',
      'हमने सरकारी (MCA) रिकॉर्ड में कंपनी जाँची, वह सक्रिय है। ईमेल कंपनी की ऑफिशियल वेबसाइट से है और कोई आपसे पैसे नहीं मांग रहा। फिर भी OTP या बैंक पासवर्ड किसी को न बताएँ।',
      'ਅਸੀਂ ਸਰਕਾਰੀ (MCA) ਰਿਕਾਰਡ ਵਿੱਚ ਕੰਪਨੀ ਜਾਂਚੀ, ਉਹ ਸਰਗਰਮ ਹੈ। ਈਮੇਲ ਕੰਪਨੀ ਦੀ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ ਤੋਂ ਹੈ ਅਤੇ ਕੋਈ ਤੁਹਾਡੇ ਤੋਂ ਪੈਸੇ ਨਹੀਂ ਮੰਗ ਰਿਹਾ। ਫਿਰ ਵੀ OTP ਜਾਂ ਬੈਂਕ ਪਾਸਵਰਡ ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸੋ।'
    );
  }
  const paidEn = paid ? ` You have already paid ₹${paid}. Call 1930 right away – money can often be frozen if you report quickly.` : ' If you have paid anything, call 1930 right away.';
  const paidHi = paid ? ` आप ₹${paid} पहले ही दे चुके हैं। तुरंत 1930 पर कॉल करें – जल्दी रिपोर्ट करने पर पैसा अक्सर रोका जा सकता है।` : ' अगर आपने कोई पैसा दिया है, तो तुरंत 1930 पर कॉल करें।';
  const paidPa = paid ? ` ਤੁਸੀਂ ₹${paid} ਪਹਿਲਾਂ ਹੀ ਦੇ ਚੁੱਕੇ ਹੋ। ਤੁਰੰਤ 1930 'ਤੇ ਕਾਲ ਕਰੋ – ਜਲਦੀ ਰਿਪੋਰਟ ਕਰਨ 'ਤੇ ਪੈਸਾ ਅਕਸਰ ਰੋਕਿਆ ਜਾ ਸਕਦਾ ਹੈ।` : " ਜੇ ਤੁਸੀਂ ਕੋਈ ਪੈਸਾ ਦਿੱਤਾ ਹੈ, ਤਾਂ ਤੁਰੰਤ 1930 'ਤੇ ਕਾਲ ਕਰੋ।";
  if (track === 'task') {
    return L(
      `We found ${n} warning signs. This follows the "like videos and earn" Telegram task scam: they pay you a little first, then ask you to deposit money for bigger tasks, and then invent fees so you can never withdraw.${paidEn}`,
      `हमें ${n} खतरे के संकेत मिले। यह "वीडियो लाइक करो और कमाओ" वाली टेलीग्राम ठगी जैसा है: पहले थोड़े पैसे देते हैं, फिर बड़े टास्क के लिए पैसे जमा करवाते हैं, और फिर नई फीस बनाकर पैसे कभी नहीं निकालने देते।${paidHi}`,
      `ਸਾਨੂੰ ${n} ਖ਼ਤਰੇ ਦੇ ਸੰਕੇਤ ਮਿਲੇ। ਇਹ "ਵੀਡੀਓ ਲਾਈਕ ਕਰੋ ਤੇ ਕਮਾਓ" ਵਾਲੀ ਟੈਲੀਗ੍ਰਾਮ ਠੱਗੀ ਵਰਗਾ ਹੈ: ਪਹਿਲਾਂ ਥੋੜ੍ਹੇ ਪੈਸੇ ਦਿੰਦੇ ਹਨ, ਫਿਰ ਵੱਡੇ ਟਾਸਕ ਲਈ ਪੈਸੇ ਜਮ੍ਹਾਂ ਕਰਵਾਉਂਦੇ ਹਨ, ਅਤੇ ਫਿਰ ਨਵੀਆਂ ਫੀਸਾਂ ਬਣਾ ਕੇ ਪੈਸੇ ਕਦੇ ਨਹੀਂ ਕਢਵਾਉਣ ਦਿੰਦੇ।${paidPa}`
    );
  }
  return L(
    `We found ${n} warning signs. This looks like a fake job offer: real companies never ask for registration fees, laptop deposits or verification charges, and they do not hire through Gmail or WhatsApp.${paidEn}`,
    `हमें ${n} खतरे के संकेत मिले। यह नकली नौकरी का ऑफर लगता है: असली कंपनियाँ कभी रजिस्ट्रेशन फीस, लैपटॉप डिपॉज़िट या वेरिफिकेशन चार्ज नहीं मांगतीं, और Gmail या WhatsApp से भर्ती नहीं करतीं।${paidHi}`,
    `ਸਾਨੂੰ ${n} ਖ਼ਤਰੇ ਦੇ ਸੰਕੇਤ ਮਿਲੇ। ਇਹ ਨਕਲੀ ਨੌਕਰੀ ਦਾ ਆਫ਼ਰ ਲੱਗਦਾ ਹੈ: ਅਸਲ ਕੰਪਨੀਆਂ ਕਦੇ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਫੀਸ, ਲੈਪਟਾਪ ਡਿਪਾਜ਼ਿਟ ਜਾਂ ਵੈਰੀਫਿਕੇਸ਼ਨ ਚਾਰਜ ਨਹੀਂ ਮੰਗਦੀਆਂ, ਅਤੇ Gmail ਜਾਂ WhatsApp ਰਾਹੀਂ ਭਰਤੀ ਨਹੀਂ ਕਰਦੀਆਂ।${paidPa}`
  );
}
