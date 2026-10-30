/**
 * Built-in safety assistant used by the floating chatbot.
 * - Pasted offers / chats are checked with the same analyser the scanner uses.
 * - Questions are matched to safety guidance (EN / HI / PA).
 * The real backend can replace this through POST /api/chat (see chatService).
 */
import { analyse } from '../mocks/analyzer.js';
import { SCAM_NEWS } from '../utils/scamNews.js';
import { HELPLINE, CYBERCRIME_URL } from '../utils/constants.js';

const L = (en, hi, pa) => ({ en, hi, pa });

/** Text that looks like an offer/chat to check rather than a question. */
export function looksLikeOffer(text) {
  const s = text.trim();
  if (s.length >= 140) return true;
  const signals = [
    /[\w.-]+@(ybl|paytm|okaxis|oksbi|okhdfcbank|okicici|ibl|axl|upi|apl)\b/i,
    /(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/,
    /https?:\/\/|t\.me\/|www\./i,
    /₹\s?\d|rs\.?\s?\d|inr\s?\d/i,
    /(salary|offer letter|selected|joining|hiring|vacancy|registration fee|deposit|task)/i,
  ];
  return s.length >= 50 && signals.filter((r) => r.test(s)).length >= 2;
}

/** Quick check of an offer / chat. Returns the analyser result trimmed for the chat bubble. */
export function quickCheck(text, entityDb = []) {
  const r = analyse({ text }, entityDb);
  return {
    verdict: r.verdict,
    score: r.score,
    summary: r.summary,
    flags: r.redFlags.slice(0, 4).map((f) => ({ title: f.title, evidence: f.evidence, severity: f.severity })),
    nextMove: r.nextMove,
  };
}

const INTENTS = [
  {
    id: 'greeting',
    re: /^(hi+|hello|hey|namaste|namaskar|sat sri akal|hii|helo|नमस्ते|ਸਤ ਸ੍ਰੀ ਅਕਾਲ)\b/i,
    answer: L(
      'Hi! I am the TrustMatrix safety assistant. Paste a job offer or chat and I will check it, or ask me anything about job and task scams.',
      'नमस्ते! मैं TrustMatrix सुरक्षा सहायक हूँ। कोई नौकरी ऑफर या चैट पेस्ट करें, मैं जाँच दूँगा, या नौकरी/टास्क ठगी के बारे में कुछ भी पूछें।',
      'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ TrustMatrix ਸੁਰੱਖਿਆ ਸਹਾਇਕ ਹਾਂ। ਕੋਈ ਨੌਕਰੀ ਆਫ਼ਰ ਜਾਂ ਚੈਟ ਪੇਸਟ ਕਰੋ, ਮੈਂ ਜਾਂਚਾਂਗਾ, ਜਾਂ ਨੌਕਰੀ/ਟਾਸਕ ਠੱਗੀ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ।'
    ),
  },
  {
    id: 'paid',
    re: /(already paid|i paid|lost (my )?money|sent (the )?money|got scammed|cheated|refund|money back|paise (gaye|de diye)|पैसे (गए|दे दिए)|ठगी हो गई|ਪੈਸੇ (ਗਏ|ਦੇ ਦਿੱਤੇ))/i,
    answer: L(
      `Act fast – the first hours matter most:\n1. Call ${HELPLINE} (National Cyber Crime Helpline) right now.\n2. File a complaint at ${CYBERCRIME_URL}.\n3. Call your bank / UPI app and ask them to block the transaction.\n4. Keep screenshots, chat and payment receipts – do not delete anything.\n5. Do not pay any "unlock", "tax" or "refund" fee – that is the same scam.\nRun a scan of the chat to get a ready-made PDF report for your complaint.`,
      `जल्दी करें – शुरुआती घंटे सबसे ज़रूरी हैं:\n1. अभी ${HELPLINE} (राष्ट्रीय साइबर क्राइम हेल्पलाइन) पर कॉल करें।\n2. ${CYBERCRIME_URL} पर शिकायत दर्ज करें।\n3. बैंक / UPI ऐप को कॉल करके ट्रांज़ैक्शन रुकवाएँ।\n4. स्क्रीनशॉट, चैट और पेमेंट रसीद संभाल कर रखें।\n5. "अनलॉक", "टैक्स" या "रिफंड" फीस बिल्कुल न दें – यह वही ठगी है।\nचैट स्कैन करें, शिकायत के लिए PDF रिपोर्ट तैयार मिलेगी।`,
      `ਜਲਦੀ ਕਰੋ – ਸ਼ੁਰੂਆਤੀ ਘੰਟੇ ਸਭ ਤੋਂ ਜ਼ਰੂਰੀ ਹਨ:\n1. ਹੁਣੇ ${HELPLINE} (ਰਾਸ਼ਟਰੀ ਸਾਈਬਰ ਕ੍ਰਾਈਮ ਹੈਲਪਲਾਈਨ) 'ਤੇ ਕਾਲ ਕਰੋ।\n2. ${CYBERCRIME_URL} 'ਤੇ ਸ਼ਿਕਾਇਤ ਦਰਜ ਕਰੋ।\n3. ਬੈਂਕ / UPI ਐਪ ਨੂੰ ਕਾਲ ਕਰਕੇ ਟ੍ਰਾਂਜ਼ੈਕਸ਼ਨ ਰੁਕਵਾਓ।\n4. ਸਕ੍ਰੀਨਸ਼ਾਟ, ਚੈਟ ਤੇ ਪੇਮੈਂਟ ਰਸੀਦ ਸੰਭਾਲ ਕੇ ਰੱਖੋ।\n5. "ਅਨਲੌਕ", "ਟੈਕਸ" ਜਾਂ "ਰਿਫੰਡ" ਫੀਸ ਬਿਲਕੁਲ ਨਾ ਦਿਓ – ਇਹ ਉਹੀ ਠੱਗੀ ਹੈ।\nਚੈਟ ਸਕੈਨ ਕਰੋ, ਸ਼ਿਕਾਇਤ ਲਈ PDF ਰਿਪੋਰਟ ਤਿਆਰ ਮਿਲੇਗੀ।`
    ),
    actions: ['call', 'portal', 'scan'],
  },
  {
    id: 'otp',
    re: /(otp|upi pin|\bpin\b|password|anydesk|teamviewer|screen ?share|remote app|cvv)/i,
    answer: L(
      'Never share an OTP, UPI PIN, card CVV or password – not even with "HR" or "bank staff". Never install AnyDesk/TeamViewer or share your screen for a job. Anyone asking for these is a scammer.',
      'OTP, UPI PIN, कार्ड CVV या पासवर्ड कभी किसी को न बताएँ – "HR" या "बैंक कर्मचारी" को भी नहीं। नौकरी के लिए AnyDesk/TeamViewer न डालें, स्क्रीन शेयर न करें। ये मांगने वाला ठग है।',
      'OTP, UPI PIN, ਕਾਰਡ CVV ਜਾਂ ਪਾਸਵਰਡ ਕਦੇ ਕਿਸੇ ਨੂੰ ਨਾ ਦੱਸੋ – "HR" ਜਾਂ "ਬੈਂਕ ਕਰਮਚਾਰੀ" ਨੂੰ ਵੀ ਨਹੀਂ। ਨੌਕਰੀ ਲਈ AnyDesk/TeamViewer ਨਾ ਪਾਓ, ਸਕ੍ਰੀਨ ਸ਼ੇਅਰ ਨਾ ਕਰੋ। ਇਹ ਮੰਗਣ ਵਾਲਾ ਠੱਗ ਹੈ।'
    ),
  },
  {
    id: 'fee',
    re: /(fee|deposit|registration|laptop|security amount|training kit|background check|id card|refundable|फीस|जमा|ਫੀਸ)/i,
    answer: L(
      'Real employers never ask you to pay – no registration fee, laptop deposit, "training kit", ID card or "background check" charge. Scammers posing as HR from TCS, Google and other big firms are using exactly this trick right now. If someone asks for money to give you a job, it is a scam.',
      'असली कंपनियाँ कभी पैसे नहीं मांगतीं – न रजिस्ट्रेशन फीस, न लैपटॉप डिपॉज़िट, न "ट्रेनिंग किट", न ID कार्ड या "बैकग्राउंड चेक" चार्ज। TCS, Google जैसी कंपनियों के नकली HR अभी यही चाल चल रहे हैं। नौकरी के बदले पैसे मांगे तो वह ठगी है।',
      'ਅਸਲ ਕੰਪਨੀਆਂ ਕਦੇ ਪੈਸੇ ਨਹੀਂ ਮੰਗਦੀਆਂ – ਨਾ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਫੀਸ, ਨਾ ਲੈਪਟਾਪ ਡਿਪਾਜ਼ਿਟ, ਨਾ "ਟ੍ਰੇਨਿੰਗ ਕਿੱਟ", ਨਾ ID ਕਾਰਡ ਜਾਂ "ਬੈਕਗ੍ਰਾਊਂਡ ਚੈੱਕ" ਚਾਰਜ। TCS, Google ਵਰਗੀਆਂ ਕੰਪਨੀਆਂ ਦੇ ਨਕਲੀ HR ਹੁਣ ਇਹੀ ਚਾਲ ਚੱਲ ਰਹੇ ਹਨ। ਨੌਕਰੀ ਬਦਲੇ ਪੈਸੇ ਮੰਗੇ ਤਾਂ ਇਹ ਠੱਗੀ ਹੈ।'
    ),
  },
  {
    id: 'task',
    re: /(task|telegram|like (videos?|youtube)|rating|review|rate (hotels|products)|prepaid|merchant|youtube|subscribe|टास्क|ਟਾਸਕ)/i,
    answer: L(
      'Task scams follow a script: (1) easy "like/rate and earn" tasks, (2) small payouts to win trust, (3) a private Telegram group, (4) "prepaid tasks" where you deposit money, (5) your account is "frozen", (6) a fee to withdraw. In October 2026 a Hyderabad victim lost over ₹37 lakh to exactly this "product rating" job. Stop as soon as they ask you to deposit anything.',
      'टास्क ठगी एक तय तरीके से चलती है: (1) "लाइक/रेट करो और कमाओ", (2) भरोसे के लिए थोड़े पैसे, (3) प्राइवेट टेलीग्राम ग्रुप, (4) "प्रीपेड टास्क" में पैसे जमा, (5) अकाउंट "फ्रीज़", (6) निकालने के लिए फीस। अक्टूबर 2026 में हैदराबाद के एक व्यक्ति ने ऐसे ही "प्रोडक्ट रेटिंग" जॉब में ₹37 लाख से ज़्यादा गँवाए। जमा करने को कहें तो तुरंत रुक जाएँ।',
      'ਟਾਸਕ ਠੱਗੀ ਇੱਕ ਤੈਅ ਤਰੀਕੇ ਨਾਲ ਚੱਲਦੀ ਹੈ: (1) "ਲਾਈਕ/ਰੇਟ ਕਰੋ ਤੇ ਕਮਾਓ", (2) ਭਰੋਸੇ ਲਈ ਥੋੜ੍ਹੇ ਪੈਸੇ, (3) ਪ੍ਰਾਈਵੇਟ ਟੈਲੀਗ੍ਰਾਮ ਗਰੁੱਪ, (4) "ਪ੍ਰੀਪੇਡ ਟਾਸਕ" ਵਿੱਚ ਪੈਸੇ ਜਮ੍ਹਾਂ, (5) ਅਕਾਊਂਟ "ਫ੍ਰੀਜ਼", (6) ਕਢਵਾਉਣ ਲਈ ਫੀਸ। ਅਕਤੂਬਰ 2026 ਵਿੱਚ ਹੈਦਰਾਬਾਦ ਦੇ ਇੱਕ ਵਿਅਕਤੀ ਨੇ ਅਜਿਹੀ "ਪ੍ਰੋਡਕਟ ਰੇਟਿੰਗ" ਨੌਕਰੀ ਵਿੱਚ ₹37 ਲੱਖ ਤੋਂ ਵੱਧ ਗੁਆਏ। ਜਮ੍ਹਾਂ ਕਰਨ ਨੂੰ ਕਹਿਣ ਤਾਂ ਤੁਰੰਤ ਰੁਕ ਜਾਓ।'
    ),
  },
  {
    id: 'govt',
    re: /(government|govt|sarkari|appointment letter|railway|quota|direct entry|सरकारी|ਸਰਕਾਰੀ)/i,
    answer: L(
      'Government jobs are filled only through official recruitment exams and websites (ending in .gov.in / .nic.in). No consultancy can sell "direct entry" or a quota seat. In October 2026 the Crime Branch charged fake consultancies that issued forged appointment letters for large upfront fees. Check every notice on the official department website.',
      'सरकारी नौकरियाँ सिर्फ़ ऑफिशियल भर्ती परीक्षा और वेबसाइट (.gov.in / .nic.in) से मिलती हैं। कोई कंसल्टेंसी "डायरेक्ट एंट्री" या कोटा सीट नहीं बेच सकती। अक्टूबर 2026 में क्राइम ब्रांच ने नकली अपॉइंटमेंट लेटर देकर मोटी फीस लेने वाली कंसल्टेंसियों पर केस दर्ज किया। हर नोटिस विभाग की ऑफिशियल वेबसाइट पर जाँचें।',
      'ਸਰਕਾਰੀ ਨੌਕਰੀਆਂ ਸਿਰਫ਼ ਅਧਿਕਾਰਤ ਭਰਤੀ ਪ੍ਰੀਖਿਆ ਤੇ ਵੈੱਬਸਾਈਟ (.gov.in / .nic.in) ਰਾਹੀਂ ਮਿਲਦੀਆਂ ਹਨ। ਕੋਈ ਕੰਸਲਟੈਂਸੀ "ਡਾਇਰੈਕਟ ਐਂਟਰੀ" ਜਾਂ ਕੋਟਾ ਸੀਟ ਨਹੀਂ ਵੇਚ ਸਕਦੀ। ਅਕਤੂਬਰ 2026 ਵਿੱਚ ਕ੍ਰਾਈਮ ਬ੍ਰਾਂਚ ਨੇ ਨਕਲੀ ਅਪੌਇੰਟਮੈਂਟ ਲੈਟਰ ਦੇ ਕੇ ਮੋਟੀ ਫੀਸ ਲੈਣ ਵਾਲੀਆਂ ਕੰਸਲਟੈਂਸੀਆਂ \'ਤੇ ਕੇਸ ਦਰਜ ਕੀਤਾ। ਹਰ ਨੋਟਿਸ ਵਿਭਾਗ ਦੀ ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ \'ਤੇ ਜਾਂਚੋ।'
    ),
  },
  {
    id: 'abroad',
    re: /(abroad|overseas|foreign|embassy|visa|russia|dubai|canada|gulf|विदेश|ਵਿਦੇਸ਼)/i,
    answer: L(
      'For overseas jobs, use only recruiting agents registered with the Ministry of External Affairs (check emigrate.gov.in). Embassies never charge "registration fees" for jobs. In October 2026 Delhi Police arrested two men who ran a fake Russian Embassy website (embassytest.com) to sell fake overseas jobs.',
      'विदेश की नौकरी के लिए सिर्फ़ विदेश मंत्रालय में रजिस्टर्ड एजेंट चुनें (emigrate.gov.in पर जाँचें)। दूतावास नौकरी के लिए कभी "रजिस्ट्रेशन फीस" नहीं लेते। अक्टूबर 2026 में दिल्ली पुलिस ने नकली रूसी दूतावास वेबसाइट (embassytest.com) चलाने वाले दो लोगों को गिरफ़्तार किया।',
      'ਵਿਦੇਸ਼ ਦੀ ਨੌਕਰੀ ਲਈ ਸਿਰਫ਼ ਵਿਦੇਸ਼ ਮੰਤਰਾਲੇ ਵਿੱਚ ਰਜਿਸਟਰਡ ਏਜੰਟ ਚੁਣੋ (emigrate.gov.in \'ਤੇ ਜਾਂਚੋ)। ਦੂਤਾਵਾਸ ਨੌਕਰੀ ਲਈ ਕਦੇ "ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਫੀਸ" ਨਹੀਂ ਲੈਂਦੇ। ਅਕਤੂਬਰ 2026 ਵਿੱਚ ਦਿੱਲੀ ਪੁਲਿਸ ਨੇ ਨਕਲੀ ਰੂਸੀ ਦੂਤਾਵਾਸ ਵੈੱਬਸਾਈਟ (embassytest.com) ਚਲਾਉਣ ਵਾਲੇ ਦੋ ਵਿਅਕਤੀ ਗ੍ਰਿਫ਼ਤਾਰ ਕੀਤੇ।'
    ),
  },
  {
    id: 'verify',
    re: /(verify|check (a |the |this )?(company|offer|job)|is (it|this) (real|genuine|fake|safe)|genuine|offer letter|mca|legit|असली|ਅਸਲ)/i,
    answer: L(
      'How to verify a job offer:\n• Search the exact company name on the MCA portal – it must be "Active".\n• The HR email must use the company\'s own domain (not Gmail/Yahoo).\n• Apply only via the company\'s careers page or trusted job portals.\n• Real offers come after an interview and never ask for money.\nPaste the offer here and I will check it for you.',
      'नौकरी ऑफर ऐसे जाँचें:\n• MCA पोर्टल पर कंपनी का सही नाम खोजें – स्टेटस "Active" होना चाहिए।\n• HR ईमेल कंपनी के अपने डोमेन से हो (Gmail/Yahoo नहीं)।\n• सिर्फ़ कंपनी के करियर पेज या भरोसेमंद जॉब पोर्टल से अप्लाई करें।\n• असली ऑफर इंटरव्यू के बाद आता है और कभी पैसे नहीं मांगता।\nऑफर यहाँ पेस्ट करें, मैं जाँच दूँगा।',
      'ਨੌਕਰੀ ਆਫ਼ਰ ਇਸ ਤਰ੍ਹਾਂ ਜਾਂਚੋ:\n• MCA ਪੋਰਟਲ \'ਤੇ ਕੰਪਨੀ ਦਾ ਸਹੀ ਨਾਂ ਲੱਭੋ – ਸਟੇਟਸ "Active" ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।\n• HR ਈਮੇਲ ਕੰਪਨੀ ਦੇ ਆਪਣੇ ਡੋਮੇਨ ਤੋਂ ਹੋਵੇ (Gmail/Yahoo ਨਹੀਂ)।\n• ਸਿਰਫ਼ ਕੰਪਨੀ ਦੇ ਕਰੀਅਰ ਪੇਜ ਜਾਂ ਭਰੋਸੇਯੋਗ ਜੌਬ ਪੋਰਟਲ ਤੋਂ ਅਪਲਾਈ ਕਰੋ।\n• ਅਸਲ ਆਫ਼ਰ ਇੰਟਰਵਿਊ ਤੋਂ ਬਾਅਦ ਆਉਂਦਾ ਹੈ ਤੇ ਕਦੇ ਪੈਸੇ ਨਹੀਂ ਮੰਗਦਾ।\nਆਫ਼ਰ ਇੱਥੇ ਪੇਸਟ ਕਰੋ, ਮੈਂ ਜਾਂਚਾਂਗਾ।'
    ),
  },
  {
    id: 'wfh',
    re: /(work from home|wfh|part[- ]time|data entry|typing|form filling|earn daily|घर बैठे|ਘਰ ਬੈਠੇ)/i,
    answer: L(
      'Genuine work-from-home jobs exist, but be careful with: very high pay for simple work, "no interview" selection, contact only on WhatsApp/Telegram, and any fee or deposit. Data-entry and form-filling "jobs" that ask for a registration fee are almost always scams.',
      'असली वर्क-फ्रॉम-होम नौकरियाँ होती हैं, पर इनसे सावधान रहें: आसान काम का बहुत ज़्यादा पैसा, "बिना इंटरव्यू" चयन, सिर्फ़ WhatsApp/टेलीग्राम पर बात, और कोई भी फीस या डिपॉज़िट। रजिस्ट्रेशन फीस मांगने वाली डेटा-एंट्री नौकरियाँ लगभग हमेशा ठगी होती हैं।',
      'ਅਸਲ ਵਰਕ-ਫ੍ਰੌਮ-ਹੋਮ ਨੌਕਰੀਆਂ ਹੁੰਦੀਆਂ ਹਨ, ਪਰ ਇਨ੍ਹਾਂ ਤੋਂ ਸਾਵਧਾਨ ਰਹੋ: ਸੌਖੇ ਕੰਮ ਦਾ ਬਹੁਤ ਜ਼ਿਆਦਾ ਪੈਸਾ, "ਬਿਨਾਂ ਇੰਟਰਵਿਊ" ਚੋਣ, ਸਿਰਫ਼ WhatsApp/ਟੈਲੀਗ੍ਰਾਮ \'ਤੇ ਗੱਲ, ਅਤੇ ਕੋਈ ਵੀ ਫੀਸ ਜਾਂ ਡਿਪਾਜ਼ਿਟ। ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਫੀਸ ਮੰਗਣ ਵਾਲੀਆਂ ਡੇਟਾ-ਐਂਟਰੀ ਨੌਕਰੀਆਂ ਲਗਭਗ ਹਮੇਸ਼ਾ ਠੱਗੀ ਹੁੰਦੀਆਂ ਹਨ।'
    ),
  },
  {
    id: 'report',
    re: /(report|complaint|police|1930|cyber ?crime|fir|शिकायत|ਸ਼ਿਕਾਇਤ)/i,
    answer: L(
      `To report a job or task scam: call ${HELPLINE} or file online at ${CYBERCRIME_URL} (Report other cyber crime → Financial fraud). Scan the message on TrustMatrix first – the result page has a "Download PDF report" button with all the details the police need.`,
      `नौकरी या टास्क ठगी की शिकायत के लिए: ${HELPLINE} पर कॉल करें या ${CYBERCRIME_URL} पर ऑनलाइन शिकायत करें। पहले TrustMatrix पर मैसेज स्कैन करें – नतीजे वाले पेज पर "PDF रिपोर्ट डाउनलोड" बटन में पुलिस के लिए सारी जानकारी है।`,
      `ਨੌਕਰੀ ਜਾਂ ਟਾਸਕ ਠੱਗੀ ਦੀ ਸ਼ਿਕਾਇਤ ਲਈ: ${HELPLINE} 'ਤੇ ਕਾਲ ਕਰੋ ਜਾਂ ${CYBERCRIME_URL} 'ਤੇ ਆਨਲਾਈਨ ਸ਼ਿਕਾਇਤ ਕਰੋ। ਪਹਿਲਾਂ TrustMatrix 'ਤੇ ਮੈਸੇਜ ਸਕੈਨ ਕਰੋ – ਨਤੀਜੇ ਵਾਲੇ ਪੇਜ 'ਤੇ "PDF ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ" ਬਟਨ ਵਿੱਚ ਪੁਲਿਸ ਲਈ ਸਾਰੀ ਜਾਣਕਾਰੀ ਹੈ।`
    ),
    actions: ['call', 'portal'],
  },
  {
    id: 'news',
    re: /(news|latest|recent|new scams?|trending|what scams|alerts?|खबर|ਖ਼ਬਰ)/i,
    answer: L(
      `Latest scam alerts:\n${SCAM_NEWS.map((n) => `• ${n.label} (${n.date}): ${n.message}`).join('\n')}`,
      `ताज़ा ठगी अलर्ट:\n${SCAM_NEWS.map((n) => `• ${n.label} (${n.date}): ${n.message}`).join('\n')}`,
      `ਤਾਜ਼ਾ ਠੱਗੀ ਅਲਰਟ:\n${SCAM_NEWS.map((n) => `• ${n.label} (${n.date}): ${n.message}`).join('\n')}`
    ),
    actions: ['threats'],
  },
];

const FALLBACK = L(
  'I can help with job and task scam safety. Try asking "Is this offer real?", "They asked for a registration fee", "I already paid, what now?" or "Latest scams". You can also paste the full job message and I will check it.',
  'मैं नौकरी और टास्क ठगी से बचाव में मदद कर सकता हूँ। पूछें: "क्या यह ऑफर असली है?", "रजिस्ट्रेशन फीस मांगी है", "पैसे दे दिए, अब क्या करूँ?" या "ताज़ा ठगी"। आप पूरा नौकरी मैसेज भी पेस्ट कर सकते हैं।',
  'ਮੈਂ ਨੌਕਰੀ ਅਤੇ ਟਾਸਕ ਠੱਗੀ ਤੋਂ ਬਚਾਅ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਪੁੱਛੋ: "ਕੀ ਇਹ ਆਫ਼ਰ ਅਸਲ ਹੈ?", "ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਫੀਸ ਮੰਗੀ ਹੈ", "ਪੈਸੇ ਦੇ ਦਿੱਤੇ, ਹੁਣ ਕੀ ਕਰਾਂ?" ਜਾਂ "ਤਾਜ਼ਾ ਠੱਗੀ"। ਤੁਸੀਂ ਪੂਰਾ ਨੌਕਰੀ ਮੈਸੇਜ ਵੀ ਪੇਸਟ ਕਰ ਸਕਦੇ ਹੋ।'
);

/**
 * Local reply. Returns { text: {en,hi,pa}, check?: quickCheck(), actions?: string[] }.
 * `actions` are rendered as buttons: call | portal | scan | threats.
 */
export function localReply(message, entityDb = []) {
  const text = String(message || '').trim();
  if (!text) return { text: FALLBACK };
  if (looksLikeOffer(text)) {
    const check = quickCheck(text, entityDb);
    return { check, actions: check.verdict === 'genuine' ? ['scan'] : ['scan', 'call'] };
  }
  const hit = INTENTS.find((i) => i.re.test(text));
  return hit ? { text: hit.answer, actions: hit.actions } : { text: FALLBACK };
}
