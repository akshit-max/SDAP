import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyLatestMcaSession() {
  // Find the most recently created MCA session (or SECRET session with MCA capabilities)
  const sessions = await prisma.delegatedSession.findMany({
    where: {
      OR: [
        { integrationProvider: 'MCA' },
        { capabilities: { array_contains: ['mca.company_efiling'] } },
        { capabilities: { array_contains: ['mca.master_data'] } },
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { grantee: { select: { email: true } }, grantor: { select: { email: true } } }
  });

  if (sessions.length === 0) {
    console.log('❌ No MCA-related sessions found in the database.');
    return;
  }

  console.log(`Found ${sessions.length} MCA-related session(s):\n`);

  for (const s of sessions) {
    console.log('─'.repeat(60));
    console.log(`ID:                  ${s.id}`);
    console.log(`Grantee:             ${s.grantee?.email}`);
    console.log(`Grantor:             ${s.grantor?.email}`);
    console.log(`Status:              ${s.status}`);
    console.log(`Scope:               ${s.scope}`);
    console.log(`integrationProvider: ${s.integrationProvider}`);
    console.log(`capabilities:        ${JSON.stringify(s.capabilities)}`);
    console.log(`expiresAt:           ${s.expiresAt}`);
    console.log(`createdAt:           ${s.createdAt}`);

    if (s.integrationProvider === 'MCA') {
      console.log(`✅ integrationProvider is 'MCA' — backend will generate mcaRestrictedModules`);
    } else {
      console.log(`❌ integrationProvider is '${s.integrationProvider}' — backend will NOT generate mcaRestrictedModules`);
    }
    console.log('');
  }
}

verifyLatestMcaSession().catch(console.error).finally(() => prisma.$disconnect());
