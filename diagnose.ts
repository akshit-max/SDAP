import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@gmail.com' },
    include: {
      organizationMemberships: {
        include: { organization: true }
      }
    }
  });

  if (!user) {
    console.log('John not found');
    return;
  }

  console.log('John orgs:', user.organizationMemberships.map(m => m.organization.name));

  const sessions = await prisma.delegatedSession.findMany({
    where: { granteeId: user.id }
  });

  console.log('John total delegated sessions:', sessions.length);
  const mcaSessions = sessions.filter(s => s.integrationProvider === 'MCA');
  console.log('John MCA sessions:', mcaSessions.map(s => ({
    id: s.id,
    orgId: s.organizationId,
    status: s.status,
    capabilities: s.capabilities,
    expiresAt: s.expiresAt
  })));
  
  // Check if they are in the same org
  const orgIds = new Set(user.organizationMemberships.map(m => m.organizationId));
  for (const s of mcaSessions) {
    if (!orgIds.has(s.organizationId)) {
      console.log(`WARNING: MCA Session ${s.id} belongs to Org ${s.organizationId}, but John is NOT a member of that org! The API will reject it.`);
    } else {
      console.log(`SUCCESS: Session ${s.id} is in a valid org for John.`);
    }
  }
}

diagnose().catch(console.error).finally(() => prisma.$disconnect());
