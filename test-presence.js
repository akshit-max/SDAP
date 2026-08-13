require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function runTest() {
  const prisma = new PrismaClient();
  
  try {
    // 1. Create a mock organization and user
    const org = await prisma.organization.create({
      data: { name: 'Test Org' }
    });
    
    const user = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test User' }
    });
    
    // 2. Simulate MCA Heartbeat (Upsert)
    console.log("Simulating MCA Heartbeat...");
    await prisma.userPresence.upsert({
      where: {
        organizationId_userId_platform: {
          organizationId: org.id,
          userId: user.id,
          platform: 'MCA'
        }
      },
      update: { lastSeenAt: new Date() },
      create: {
        organizationId: org.id,
        userId: user.id,
        platform: 'MCA'
      }
    });
    
    // 3. Simulate GitHub Heartbeat (Upsert)
    console.log("Simulating GitHub Heartbeat...");
    await prisma.userPresence.upsert({
      where: {
        organizationId_userId_platform: {
          organizationId: org.id,
          userId: user.id,
          platform: 'GitHub'
        }
      },
      update: { lastSeenAt: new Date() },
      create: {
        organizationId: org.id,
        userId: user.id,
        platform: 'GitHub'
      }
    });
    
    // 4. Verify we have 2 distinct records for this user
    const presences = await prisma.userPresence.findMany({
      where: { userId: user.id }
    });
    
    console.log("Found presences:", presences.map(p => p.platform));
    
    if (presences.length === 2 && presences.some(p => p.platform === 'MCA') && presences.some(p => p.platform === 'GitHub')) {
      console.log("✅ MULTI-PLATFORM PRESENCE WORKS!");
    } else {
      console.error("❌ FAILED: Did not find both platforms.");
    }
    
  } catch (e) {
    console.error("Test Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
