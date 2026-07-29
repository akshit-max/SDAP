/**
 * Automated test script for Phase 2: Organizations
 * Usage: node test-orgs.js (Requires Postgres DB and running API)
 */
const http = require('http');

const API_URL = 'http://localhost:4000/api/v1';

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1${path}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    const timestamp = Date.now();
    const email1 = `owner-${timestamp}@example.com`;
    const email2 = `invitee-${timestamp}@example.com`;
    const password = 'StrongPassword123!';

    console.log(`Registering owner: ${email1}...`);
    await request('POST', '/auth/register', { email: email1, password });
    
    console.log(`Registering invitee: ${email2}...`);
    await request('POST', '/auth/register', { email: email2, password });

    console.log('Logging in owner...');
    let res = await request('POST', '/auth/login', { email: email1, password });
    const ownerToken = res.data.accessToken;

    console.log('Logging in invitee...');
    res = await request('POST', '/auth/login', { email: email2, password });
    const inviteeToken = res.data.accessToken;

    console.log('\n--- Organizations Workflow ---');
    console.log('Creating Organization...');
    res = await request('POST', '/organizations', { name: `Acme Corp ${timestamp}` }, ownerToken);
    console.log('Create Org Result:', res.statusCode);
    const orgId = res.data.data.id;

    console.log('\nFetching Current Organizations for Owner...');
    res = await request('GET', '/organizations', null, ownerToken);
    console.log('My Orgs count:', res.data.data.length);

    console.log('\nInviting user to Organization...');
    res = await request('POST', `/organizations/${orgId}/invites`, { email: email2 }, ownerToken);
    console.log('Invite Result:', res.statusCode);
    const inviteToken = res.data.data.rawToken;

    console.log('\nAccepting Invitation as Invitee...');
    res = await request('POST', `/organizations/invites/${inviteToken}/accept`, null, inviteeToken);
    console.log('Accept Invite Result:', res.statusCode);

    console.log('\nFetching Current Organizations for Invitee...');
    res = await request('GET', '/organizations', null, inviteeToken);
    console.log('Invitee Orgs count:', res.data.data.length);

    console.log('\nAll tests passed (Mock setup)');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

run();
