/**
 * Phase 2 — Gmail OTP Backend Test
 * Runs directly against the DB and Gmail API.
 * No session auth, no extension needed.
 *
 * Run: node test-otp.js [PLATFORM]
 *   e.g. node test-otp.js RAZORPAY
 *        node test-otp.js VERCEL
 *        node test-otp.js (generic search)
 */
require('dotenv').config({ path: '.env' });

const crypto = require('crypto');
const { PrismaClient } = require('../../node_modules/@prisma/client');
const prisma = new PrismaClient();

const PLATFORM = process.argv[2] ?? null;
const ORG_ID   = 'a67d5cd8-9e4b-4fc1-a483-08e9e28e115d';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

// ── Encryption helpers (mirror IntegrationEncryptionService) ─────────────────

function deserialize(stored) {
  const [iv, authTag, ciphertext] = stored.split(':');
  return {
    iv:         Buffer.from(iv,         'hex'),
    authTag:    Buffer.from(authTag,    'hex'),
    ciphertext: Buffer.from(ciphertext, 'hex'),
  };
}

function decryptWithKey(mek, encryptedDek, encryptedToken, aad) {
  // Decrypt DEK with MEK
  const dekParts = deserialize(encryptedDek);
  const dekDecipher = crypto.createDecipheriv('aes-256-gcm', mek, dekParts.iv);
  dekDecipher.setAuthTag(dekParts.authTag);
  const dek = dekDecipher.update(dekParts.ciphertext);
  dekDecipher.final(); // validates tag

  // Decrypt token with DEK
  const tokenParts = deserialize(encryptedToken);
  const tokenDecipher = crypto.createDecipheriv('aes-256-gcm', dek, tokenParts.iv);
  tokenDecipher.setAuthTag(tokenParts.authTag);
  tokenDecipher.setAAD(Buffer.from(aad, 'utf8'));
  const plaintext = Buffer.concat([
    tokenDecipher.update(tokenParts.ciphertext),
    tokenDecipher.final(),
  ]);
  return plaintext.toString('utf8');
}

// ── Gmail helpers ─────────────────────────────────────────────────────────────

async function gmailGet(path, accessToken) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API error ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function buildQuery(platform) {
  const base = 'newer_than:10m in:inbox';
  const senderMap = {
    GITHUB:   'from:(github.com OR noreply.github.com)',
    RAZORPAY: 'from:razorpay.com',
    VERCEL:   'from:vercel.com',
    STRIPE:   'from:stripe.com',
    SHOPIFY:  'from:(shopify.com OR mail.shopify.com)',
    LINKEDIN: 'from:(linkedin.com OR e.linkedin.com)',
    GODADDY:  'from:godaddy.com',
  };
  const sender = platform && senderMap[platform];
  if (sender) return `${base} ${sender}`;
  return `${base} (OTP OR "verification code" OR "one-time" OR "login code")`;
}

function decodeBase64Url(s) {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function extractBody(message) {
  const parts = message.payload?.parts ?? [];
  const allParts = [message.payload, ...parts, ...parts.flatMap(p => p.parts ?? [])];
  for (const part of allParts) {
    if ((part?.mimeType === 'text/plain' || part?.mimeType === 'text/html') && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
  }
  if (message.payload?.body?.data) return decodeBase64Url(message.payload.body.data);
  return '';
}

function extractSender(message) {
  const headers = message.payload?.headers ?? [];
  return headers.find(h => h.name === 'From')?.value ?? '';
}

function extractOtp(body, sender, platform) {
  const OTP_PATTERNS = [
    { regex: /(?<![a-zA-Z0-9-])(\d{6})(?!\d)/, group: 1 }, // Vercel
    { regex: /\b(\d{6})\b.*(?:OTP|one-time|verification|passcode)/i, group: 1 },
    { regex: /(?:OTP\s+(?:for\s+login\s+)?is\s+)(\d{4,6})/i,        group: 1 },
    { regex: /(?:code|otp|passcode|token|verify|verification)[\s\S]{0,80}?(?<![a-zA-Z0-9-])(\b\d{4,8}\b)/i, group: 1 },
    { regex: /\b(\d{4,8})\b/,                                         group: 1 },
  ];
  for (const { regex, group } of OTP_PATTERNS) {
    const m = body.match(regex);
    if (m?.[group]) return m[group];
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Phase 2: Gmail OTP Backend Test`);
  console.log(`   Platform : ${PLATFORM ?? '(generic)'}`);
  console.log(`   Org ID   : ${ORG_ID}\n`);

  // 1. Load Gmail connection from DB
  const conn = await prisma.integrationConnection.findFirst({
    where: { organizationId: ORG_ID, provider: 'GMAIL', status: 'ACTIVE', deletedAt: null },
  });
  if (!conn) throw new Error('❌ No active GMAIL connection found in DB.');
  console.log(`✅ GMAIL connection found: grantedEmail=${conn.providerMeta?.grantedEmail}`);

  // 2. Decrypt access token
  const mekRaw = process.env.VAULT_ENCRYPTION_KEY;
  if (!mekRaw) throw new Error('❌ VAULT_ENCRYPTION_KEY not set');
  const mek = Buffer.from(mekRaw, 'base64');

  let accessToken;
  const meta = conn.providerMeta ?? {};
  const tokenExpiry = meta.tokenExpiry ?? 0;

  if (tokenExpiry > Date.now() + 60_000) {
    console.log('✅ Access token still valid — decrypting...');
    accessToken = decryptWithKey(mek, conn.encryptedDek, conn.encryptedToken, `${ORG_ID}:GMAIL`);
  } else {
    console.log('🔄 Access token expired — refreshing...');
    const refreshToken = decryptWithKey(mek, conn.encryptedDek, meta.encryptedRefreshToken, `${ORG_ID}:GMAIL_REFRESH`);
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    });
    if (!res.ok) throw new Error(`❌ Token refresh failed: ${res.status} ${await res.text()}`);
    const { access_token } = await res.json();
    if (!access_token) throw new Error('❌ Refresh returned no access_token');
    accessToken = access_token;
    console.log('✅ Token refreshed successfully');
  }

  // 3. Search Gmail
  const query = buildQuery(PLATFORM);
  console.log(`\n📧 Searching Gmail: q="${query}"`);
  const listData = await gmailGet(`/messages?q=${encodeURIComponent(query)}&maxResults=5`, accessToken);
  const messages = listData.messages ?? [];
  console.log(`   Found ${messages.length} message(s)\n`);

  if (messages.length === 0) {
    console.log('ℹ️  No matching emails found.');
    console.log('   → Send a real OTP email to navyabhandula@gmail.com and retry.');
    return;
  }

  // 4. Extract OTP from each message
  for (const { id } of messages) {
    const message = await gmailGet(`/messages/${id}?format=full`, accessToken);
    const body    = extractBody(message);
    const sender  = extractSender(message);
    console.log(`📩 Message: ${id}`);
    console.log(`   From   : ${sender}`);
    console.log(`   Snippet: ${body.replace(/\s+/g, ' ').slice(0, 150)}`);

    const otp = extractOtp(body, sender, PLATFORM);
    if (otp) {
      console.log(`\n✅ OTP EXTRACTED: ${otp}\n`);
      return;
    }
    console.log('   ⚠️  No OTP matched — trying next message...\n');
  }

  console.log('❌ OTP email found but no code could be extracted.');
  console.log('   → Check the email format and update OTP_PATTERNS if needed.');
}

main().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
}).finally(() => prisma['$disconnect']());
