/**
 * reset-gmail.js
 *
 * Marks the existing Gmail integration connection as DISCONNECTED so that:
 *  - The grantor sees a "Reconnect Gmail" prompt in the dashboard
 *  - The backend stops trying to decrypt the old broken refresh token
 *
 * Run: node apps/api/reset-gmail.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ORG_ID = 'a67d5cd8-9e4b-4fc1-a483-08e9e28e115d';

async function main() {
  const conn = await prisma.integrationConnection.findFirst({
    where: { organizationId: ORG_ID, provider: 'GMAIL' },
  });

  if (!conn) {
    console.log('❌  No Gmail connection found for this org.');
    return;
  }

  const meta = (conn.providerMeta ?? {});
  console.log('📧  Gmail connection found:');
  console.log('    status          :', conn.status);
  console.log('    grantedEmail    :', meta.grantedEmail ?? '(unknown)');
  console.log('    encryptedRefreshDek in meta:', !!meta.encryptedRefreshDek);

  if (meta.encryptedRefreshDek) {
    console.log('\n✅  Connection already has encryptedRefreshDek — no reset needed.');
    console.log('    The connection should work correctly.');
    return;
  }

  await prisma.integrationConnection.update({
    where: { id: conn.id },
    data: {
      status: 'DISCONNECTED',
      lastError: 'Refresh token DEK missing — reconnect required after 2026-08-07 encryption fix.',
    },
  });

  console.log('\n✅  Connection marked as DISCONNECTED.');
  console.log('👉  Next step: open the WithUs dashboard → Integrations → Connect Gmail');
  console.log('    (This generates a new connection row with the fixed encryptedRefreshDek field.)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
