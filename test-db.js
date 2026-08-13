const { PrismaClient } = require('./packages/db/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkSessions() {
  try {
    const sessions = await prisma.delegatedSession.findMany({ take: 1 });
    console.log("Sessions fetch successful:", sessions.length);
  } catch (e) {
    console.error("Error fetching sessions:");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();
