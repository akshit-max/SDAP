const http = require('http');

const request = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: `/api/v1/auth${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(JSON.stringify(body)) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data ? JSON.parse(data) : null,
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

(async () => {
  try {
    const randomEmail = `test-${Date.now()}@example.com`;
    console.log(`Testing Registration with ${randomEmail}...`);
    const regRes = await request('POST', '/register', { email: randomEmail, password: 'password123' });
    console.log('Registration:', regRes);

    console.log('Testing Login...');
    const loginRes = await request('POST', '/login', { email: randomEmail, password: 'password123' });
    console.log('Login:', loginRes);

    if (!loginRes.data.refreshToken) throw new Error('No refresh token');

    console.log('Testing Refresh...');
    const refreshRes = await request('POST', '/refresh', { refreshToken: loginRes.data.refreshToken });
    console.log('Refresh:', refreshRes);

    console.log('Testing Logout...');
    const logoutRes = await request('POST', '/logout', { refreshToken: refreshRes.data.refreshToken });
    console.log('Logout:', logoutRes);
    
    console.log('Testing Refresh Replay Detection...');
    const replayRes = await request('POST', '/refresh', { refreshToken: loginRes.data.refreshToken });
    console.log('Replay Result (should be 401):', replayRes);
    
    console.log('All tests completed successfully!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
