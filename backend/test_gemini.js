require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
const body = JSON.stringify({
  contents: [{ parts: [{ text: "Hello" }] }]
});

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/models/gemini-flash-latest:generateContent?key=' + apiKey,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('HTTP Status:', res.statusCode, 'Body:', data.substring(0, 300)));
});

req.on('error', e => console.error(e));
req.write(body);
req.end();
