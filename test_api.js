require('dotenv').config({ path: 'd:/SDAP/.env' });
const fetch = require('node-fetch');
async function test() {
  const loginRes = await globalThis.fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hello@makewithus.in', password: 'password123!' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log("Cookie:", cookie ? "exists" : "missing");
  
  // We need the orgId. Let's just guess or fetch it.
  const meRes = await globalThis.fetch('http://localhost:4000/api/v1/auth/me', {
    headers: { 'Cookie': cookie }
  });
  const meText = await meRes.text();
  console.log("Me:", meText);
}
test().catch(console.error);
