/**
 * dump-razorpay-email.js
 * Dumps the decoded body of the latest Razorpay email to see the exact OTP format.
 * Run: node apps/api/dump-razorpay-email.js
 */
require('dotenv').config({ path: 'apps/api/.env' });

const crypto = require('crypto');
const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

const ORG_ID   = 'a67d5cd8-9e4b-4fc1-a483-08e9e28e115d';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

function deserialize(stored) {
  const [iv, authTag, ciphertext] = stored.split(':');
  return {
    iv:         Buffer.from(iv,         'hex'),
    authTag:    Buffer.from(authTag,    'hex'),
    ciphertext: Buffer.from(ciphertext, 'hex'),
  };
}

function decryptWithKey(mek, encryptedDek, encryptedToken, aad) {
  const dekParts = deserialize(encryptedDek);
  const dekDecipher = crypto.createDecipheriv('aes-256-gcm', mek, dekParts.iv);
  dekDecipher.setAuthTag(dekParts.authTag);
  const dek = dekDecipher.update(dekParts.ciphertext);
  dekDecipher.final();

  const tokenParts = deserialize(encryptedToken);
  const tokenDecipher = crypto.createDecipheriv('aes-256-gcm', dek, tokenParts.iv);
  tokenDecipher.setAuthTag(tokenParts.authTag);
  tokenDecipher.setAAD(Buffer.from(aad, 'utf8'));
  return Buffer.concat([tokenDecipher.update(tokenParts.ciphertext), tokenDecipher.final()]).toString('utf8');
}

function decodeBase64Url(s) {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function extractAllParts(message) {
  const results = [];
  const parts = message.payload?.parts ?? [];
  const allParts = [message.payload, ...parts, ...parts.flatMap(p => p.parts ?? [])];
  for (const part of allParts) {
    if (part?.body?.data) {
      results.push({ mimeType: part.mimeType, data: decodeBase64Url(part.body.data) });
    }
  }
  if (message.payload?.body?.data) {
    results.push({ mimeType: message.payload.mimeType, data: decodeBase64Url(message.payload.body.data) });
  }
  return results;
}

async function main() {
  const conn = await prisma.integrationConnection.findFirst({
    where: { organizationId: ORG_ID, provider: 'GMAIL', status: 'ACTIVE', deletedAt: null },
  });
  if (!conn) throw new Error('No active Gmail connection');

  const mek = Buffer.from(process.env.VAULT_ENCRYPTION_KEY, 'base64');
  const accessToken = decryptWithKey(mek, conn.encryptedDek, conn.encryptedToken, `${ORG_ID}:GMAIL`);

  const res = await fetch(`${GMAIL_API}/messages?q=${encodeURIComponent('newer_than:60m in:inbox from:razorpay.com')}&maxResults=3`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const list = await res.json();
  const messages = list.messages ?? [];
  console.log(`Found ${messages.length} Razorpay message(s)\n`);

  for (const { id } of messages.slice(0, 2)) {
    const msgRes = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const message = await msgRes.json();
    const parts = extractAllParts(message);

    console.log(`\n═══ Message: ${id} ═══`);
    for (const { mimeType, data } of parts) {
      if (mimeType === 'text/plain') {
        console.log(`\n--- text/plain ---`);
        console.log(data.slice(0, 2000));
      } else if (mimeType === 'text/html') {
        // Strip tags for readability
        const stripped = data.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`\n--- text/html (stripped, first 2000 chars) ---`);
        console.log(stripped.slice(0, 2000));
        // Highlight all standalone digit sequences (4-8 digits) found
        const digits = [...stripped.matchAll(/\b(\d{4,8})\b/g)].map(m => m[1]);
        console.log(`\n🔢 All 4-8 digit sequences found: [${digits.join(', ')}]`);
      }
    }
    console.log('\n');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
