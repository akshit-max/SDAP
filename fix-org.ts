import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrg() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@gmail.com' },
    include: {
      organizationMemberships: {
        include: { organization: true }
      }
    }
  });

  if (!user || user.organizationMemberships.length === 0) {
    console.log('Could not find john@gmail.com or he has no orgs!');
    return;
  }

  const johnsOrgId = user.organizationMemberships[0].organizationId;

  // Update the MCA sessions to belong to John's organization
  const updated = await prisma.delegatedSession.updateMany({
    where: { integrationProvider: 'MCA' },
    data: { organizationId: johnsOrgId }
  });

  console.log(`Successfully moved ${updated.count} MCA sessions to John's Organization!`);
}

fixOrg().catch(console.error).finally(() => prisma.$disconnect());
