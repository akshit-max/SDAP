import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSession() {
  const user = await prisma.user.findUnique({
    where: { email: 'john@gmail.com' }
  });

  if (!user) {
    console.log('Could not find john@gmail.com in the database!');
    return;
  }

  // Update the MCA sessions to belong to john@gmail.com
  const updated = await prisma.delegatedSession.updateMany({
    where: { integrationProvider: 'MCA' },
    data: { granteeId: user.id }
  });

  console.log(`Successfully moved ${updated.count} MCA sessions to john@gmail.com!`);
}

fixSession().catch(console.error).finally(() => prisma.$disconnect());
