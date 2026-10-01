const { PrismaClient } = require('./packages/db/dist/index.js');
const prisma = new PrismaClient();

async function main() {
  const ORG_ID = '2a8bf0f2-776d-4130-a098-b254e508d220'; // check

  const updated = await prisma.subscription.update({
    where: { organizationId: ORG_ID },
    data: {
      plan: 'FREE',
      status: 'FREE',
      complianceState: 'PLATFORM_SELECTION_REQUIRED',
      selectedPlatforms: [],
      selectionLockedUntil: null,
      hdfcMandateId: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelledAt: null,
      cancelReason: null,
      baseAmount: 0,
      extraUsers: 0,
      extraUserRate: 0,
      totalAmount: 0,
      failureCount: 0,
      lastFailureReason: null,
      graceUntil: null,
    },
    select: { plan: true, status: true, complianceState: true, selectedPlatforms: true },
  });

  console.log('Done:', updated);
}

main()
  .catch(e => console.error(e.message))
  .finally(() => prisma.$disconnect());
