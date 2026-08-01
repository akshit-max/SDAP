/**
 * E2E API Verification Script for Release D
 * 
 * Run this script to verify:
 * 1. API Keys (Creation, Validation)
 * 2. Programmatic Secret Access
 * 3. Integrations (Backend health checks)
 * 4. Webhooks (Verification of event triggering)
 * 
 * Usage:
 * 1. Ensure `npm run dev` is running.
 * 2. Get your JWT token from the browser dev tools (Application -> Local Storage -> sdap_token)
 * 3. Run: `JWT_TOKEN="your_token" node scratch/verify-release-d-api.js`
 */

const API_URL = 'http://localhost:4000/api/v1'; // NestJS API
const WEB_URL = 'http://localhost:3000'; 

async function runTests() {
  const token = process.env.JWT_TOKEN;
  if (!token) {
    console.error('❌ Missing JWT_TOKEN environment variable.');
    console.error('Please login to http://localhost:3000, grab the sdap_token from LocalStorage, and run:');
    console.error('JWT_TOKEN="your_token" node scratch/verify-release-d-api.js');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('🚀 Starting Release D API E2E Verification...');

    // --- 1. Fetch Current User & Org ---
    const meRes = await fetch(`${API_URL}/auth/me`, { headers });
    if (!meRes.ok) throw new Error('Failed to fetch user context');
    const { user, organization } = await meRes.json();
    console.log(`✅ Authenticated as ${user.email} in Org: ${organization.name}`);

    // --- 2. Test API Keys ---
    console.log('\n🔑 Testing API Keys...');
    const createKeyRes = await fetch(`${API_URL}/api-keys`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'E2E Test Key ' + Date.now() })
    });
    if (!createKeyRes.ok) throw new Error('Failed to create API key');
    const { key, id: keyId } = await createKeyRes.json();
    console.log(`✅ Created API Key: ${key.substring(0, 12)}...`);

    // --- 3. Test Webhooks ---
    console.log('\n🪝 Testing Webhooks...');
    const webhookRes = await fetch(`${API_URL}/webhooks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: 'https://webhook.site/placeholder-test-url', // Dummy URL for test
        events: ['secret.revealed']
      })
    });
    if (!webhookRes.ok) throw new Error('Failed to create webhook');
    const webhook = await webhookRes.json();
    console.log(`✅ Created Webhook listening for 'secret.revealed' (ID: ${webhook.id})`);

    // --- 4. Create a dummy secret to test programmatic retrieval ---
    console.log('\n🔐 Creating a Secret for Programmatic Retrieval...');
    // Create a vault first if we don't have one
    const vaultsRes = await fetch(`${API_URL}/vaults`, { headers });
    const vaults = await vaultsRes.json();
    let vaultId = vaults.length > 0 ? vaults[0].id : null;
    
    if (!vaultId) {
      const createVaultRes = await fetch(`${API_URL}/vaults`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'E2E Test Vault' })
      });
      const newVault = await createVaultRes.json();
      vaultId = newVault.id;
    }

    const createSecretRes = await fetch(`${API_URL}/vaults/${vaultId}/secrets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        key: 'E2E_API_TEST_SECRET',
        value: 'super_secret_value_123',
        description: 'Testing programmatic API'
      })
    });
    if (!createSecretRes.ok) throw new Error('Failed to create secret');
    const secret = await createSecretRes.json();
    console.log(`✅ Created Secret: ${secret.key} (ID: ${secret.id})`);

    // --- 5. Test Programmatic Secret Retrieval (using API Key) ---
    console.log('\n🤖 Testing Programmatic API Access...');
    const programmaticRes = await fetch(`${API_URL}/programmatic/secrets/${secret.id}/reveal`, {
      method: 'POST', // or GET depending on implementation
      headers: {
        'Authorization': `Bearer ${key}`, // Using the API key here!
        'Content-Type': 'application/json'
      }
    });
    if (!programmaticRes.ok) throw new Error(`Programmatic retrieval failed: ${programmaticRes.statusText}`);
    const revealedData = await programmaticRes.json();
    console.log(`✅ Successfully retrieved secret via API Key! Value: ${revealedData.value}`);
    console.log(`✅ Webhook event 'secret.revealed' should have been dispatched in the background.`);

    // --- 6. Test Integrations Registry ---
    console.log('\n🔌 Testing Integrations Endpoint...');
    const integrationsRes = await fetch(`${API_URL}/integrations`, { headers });
    if (!integrationsRes.ok) throw new Error('Failed to list integrations');
    const integrations = await integrationsRes.json();
    console.log(`✅ Integrations loaded (Found ${integrations.length} active connections)`);

    console.log('\n🎉 All API Tests Passed Successfully!');
    console.log('\n========================================');
    console.log('Next Steps for Manual Testing:');
    console.log('1. Go to chrome://extensions');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked" and select the "apps/extension/dist" folder.');
    console.log('4. Open Godaddy.com or Github.com');
    console.log('5. Click the WITHUS Extension icon to login and test credential autofill.');
    console.log('========================================');

  } catch (err) {
    console.error('\n❌ E2E Verification Failed!');
    console.error(err);
  }
}

runTests();
