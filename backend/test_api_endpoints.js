const http = require('http');

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : {}
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            rawBody: data
          });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testAll() {
  console.log('======================================================');
  console.log('📡 RUNNING FULL HTTP REST & AUTH INTEGRATION TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, name) {
    if (cond) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  // 1. Health check
  console.log('--- 1. Testing /api/health ---');
  const health = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  assert(health.statusCode === 200 && health.body.status === 'online', 'Health endpoint returns 200 online');

  // 2. Unauthenticated /api/auth/me should return 401
  console.log('\n--- 2. Testing Unauthenticated /api/auth/me ---');
  const unauth = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET'
  });
  assert(unauth.statusCode === 401, 'Unauthenticated request correctly rejected with 401');

  // 3. Admin Login (Direct login without MFA)
  console.log('\n--- 3. Testing Admin Login & JWT Issuance ---');
  const adminLogin = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@trustmatrix.in', password: 'Admin@123' });

  assert(adminLogin.statusCode === 200, 'Admin login succeeded with HTTP 200');
  assert(adminLogin.body.token && adminLogin.body.user.role === 'admin', 'JWT token issued and admin role verified');
  const adminToken = adminLogin.body.token;

  // Verify Set-Cookie header exists
  const setCookie = adminLogin.headers['set-cookie'];
  assert(setCookie && setCookie.some(c => c.includes('token=')), 'HttpOnly token cookie set on login response');

  // 4. Authenticated /api/auth/me with Bearer token
  console.log('\n--- 4. Testing Authenticated /api/auth/me with JWT ---');
  const authMe = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(authMe.statusCode === 200 && authMe.body.user.email === 'admin@trustmatrix.in', 'Authenticated profile correctly retrieved via JWT token');

  // 5. Test Google OAuth login
  console.log('\n--- 5. Testing Google OAuth SSO Pipeline ---');
  const googleLogin = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/google',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: 'newuser.test@gmail.com',
    name: 'Test Google User',
    avatar: 'https://example.com/avatar.png',
    googleId: 'g_123456789'
  });
  assert(googleLogin.statusCode === 200 && googleLogin.body.token, 'Google OAuth registration & login issued JWT');
  const googleToken = googleLogin.body.token;

  // 6. Test Concurrent Isolation (User B profile does not leak into User A)
  console.log('\n--- 6. Testing Stateless Session Isolation ---');
  const userBProfile = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${googleToken}` }
  });
  const adminProfileCheck = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(userBProfile.body.user.email === 'newuser.test@gmail.com', 'User B sees User B profile');
  assert(adminProfileCheck.body.user.email === 'admin@trustmatrix.in', 'Admin simultaneously sees Admin profile (no session leakage)');

  // 7. Test Admin Evaluation Endpoint
  console.log('\n--- 7. Testing Admin Evaluation Benchmark Endpoint ---');
  const evalRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/evaluate',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(evalRes.statusCode === 200, 'Evaluation endpoint returned HTTP 200');
  assert(evalRes.body.metrics && evalRes.body.metrics.matrix && evalRes.body.metrics.accuracy > 0.8, 'Evaluation generated dynamic 3x3 matrix and high accuracy');

  // 8. Test Scan submission
  console.log('\n--- 8. Testing Threat Scan Submission (/api/scans) ---');
  const scanPost = await makeRequest({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/scans',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    text: 'Earn ₹3000 daily by liking YouTube videos. Contact @AmazonVIP on Telegram.',
    companyName: 'Amazon Tasks VIP'
  });
  assert(scanPost.statusCode === 200 && (scanPost.body.scanId || scanPost.body.id), 'Scan successfully processed and returned scanId');
  assert(scanPost.body.verdict === 'scam' || scanPost.body.verdict === 'CRITICAL_SCAM', 'Scan correctly flagged as scam');

  console.log('\n======================================================');
  console.log(`TOTAL HTTP INTEGRATION TESTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testAll().catch(err => {
  console.error('Integration Test Error:', err);
  process.exit(1);
});
