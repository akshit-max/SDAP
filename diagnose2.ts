import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  const user = await prisma.user.findUnique({
    where: { email: 'ankit@gmail.com' },
    include: {
      organizationMemberships: {
        include: { organization: true }
      }
    }
  });

  if (!user) {
    console.log('Ankit not found');
    return;
  }

  const sessions = await prisma.delegatedSession.findMany({
    where: { granteeId: user.id }
  });

  console.log('Ankit total delegated sessions:', sessions.length);
  const mcaSessions = sessions.filter(s => s.integrationProvider === 'MCA');
  console.log('Ankit MCA sessions (by integrationProvider):', mcaSessions.length);
  
  const allSessionsForAnkit = sessions.map(s => ({
    id: s.id,
    integrationProvider: s.integrationProvider,
    scope: s.scope,
    capabilities: s.capabilities,
    resourceName: s.resourceName
  }));
  console.log('All Ankit sessions:', allSessionsForAnkit);
}

diagnose().catch(console.error).finally(() => prisma.$disconnect());
