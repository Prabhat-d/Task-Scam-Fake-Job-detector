const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');

/**
 * CyberShield Safety Chatbot Engine.
 * Primary: Groq LPU (openai/gpt-oss-120b or qwen/qwen3.8-27b) for ultra-fast conversational cybersecurity advice.
 * Fallback: Google Gemini 3.5 Flash Lite if GROQ_API_KEY is absent or rate-limited.
 */

let groqClient = null;
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are CyberShield AI, an expert cybersecurity assistant and Indian Cyber Crime safety advisor specializing in Track 1: Task-Scams, Telegram Grooming, and Fake Job Offers (Indian Cyber Crime Helpline 1930 / cybercrime.gov.in).

Your job is to:
1. Provide instant, actionable, empathetic, and protective advice to users who suspect they are being scammed.
2. If the user shares a message/offer, detect classic scam indicators:
   - Paying registration fees / security deposit / laptop fees
   - "Like YouTube videos / rate hotels for ₹150-₹500" opening hook
   - Demands to join VIP Telegram groups or recharge / prepaid merchant tasks
   - Fake "Account Frozen, pay tax / fee to unfreeze" traps
3. Always recommend:
   - Never pay any advance fee or unfreeze fee.
   - Dial 1930 immediately if money was transferred within the golden hour (first 2-4 hours).
   - Report the incident at cybercrime.gov.in.

OUTPUT FORMAT:
Always return a strictly valid JSON object with this exact shape:
{
  "reply": {
    "en": "Clear, concise direct advice in English",
    "hi": "स्पष्ट और सहायक सलाह हिंदी में",
    "pa": "ਸਪਸ਼ਟ ਅਤੇ ਮਦਦਗਾਰ ਸਲਾਹ ਪੰਜਾਬੀ ਵਿੱਚ"
  },
  "actions": ["call", "portal", "scan"],
  "check": null
}

Note:
- "actions" must be an array that can include:
  - "call" (if user lost money or is under pressure to pay, invokes 1930 helpline)
  - "portal" (cybercrime.gov.in link)
  - "scan" (if message looks like an offer or task that should be scanned)
  - "threats" (threat radar)
- If the user's message is a specific suspicious job offer/task scam message, "check" can be an object with:
  {
    "verdict": "scam" | "suspicious" | "genuine",
    "score": 0-100,
    "summary": { "en": "...", "hi": "...", "pa": "..." },
    "flags": [{ "title": { "en": "...", "hi": "...", "pa": "..." }, "evidence": "quoted text" }],
    "nextMove": { "en": "...", "hi": "...", "pa": "..." }
  }
  Otherwise, set "check": null.
`;

async function answerWithGroq(client, message, history, language = 'en') {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.sender === 'user' || h.role === 'user') {
        messages.push({ role: 'user', content: h.text || h.message || '' });
      } else if (h.sender === 'bot' || h.role === 'assistant') {
        const text = typeof h.text === 'object' ? h.text[language] || h.text.en : h.text;
        messages.push({ role: 'assistant', content: text || '' });
      }
    }
  }

  messages.push({
    role: 'user',
    content: `User query: "${message}"\nTarget language: ${language}.\nReturn ONLY the JSON object. Do not include markdown or reasoning outside the JSON.`,
  });

  const completion = await client.chat.completions.create({
    messages,
    model: 'openai/gpt-oss-120b',
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(raw);
}

async function answerWithGeminiFallback(message, history, language = 'en') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is available');
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `${SYSTEM_PROMPT}\n\nUser query: "${message}"\nTarget language: ${language}.\nReturn ONLY the JSON object without markdown fences.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: prompt,
  });

  let text = response.text || '{}';
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(text);
}

async function handleChat({ message, history = [], language = 'en' }) {
  const groq = getGroqClient();

  if (groq) {
    try {
      const res = await answerWithGroq(groq, message, history, language);
      return res;
    } catch (err) {
      console.warn('Groq chat error, falling back to Gemini:', err.message);
    }
  }

  return await answerWithGeminiFallback(message, history, language);
}

module.exports = {
  handleChat,
};
