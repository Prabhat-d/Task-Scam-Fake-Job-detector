require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testAll() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const candidates = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-flash-latest', 'gemini-2.0-flash-exp'];
  
  for (const name of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const res = await Promise.race([
        model.generateContent('Hi'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      console.log('SUCCESS with model:', name);
      return;
    } catch(e) {
      console.log('Failed', name, e.message);
    }
  }
}
testAll();
