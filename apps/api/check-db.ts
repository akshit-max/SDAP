import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestSessions = await prisma.delegatedSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      integrationProvider: true,
      capabilities: true,
      status: true
    }
  });

  console.log(JSON.stringify(latestSessions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
