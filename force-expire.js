const { PrismaClient } = require('./packages/db/dist/index.js');
const prisma = new PrismaClient();

async function main() {
  const orgId = '2a8bf0f2-776d-4130-a098-b254e508d220'; // ID for 'check' / check2@gmail.com
  
  // Find the organization
  const org = await prisma.organization.findUnique({
    where: { id: orgId }
  });

  if (!org) {
    console.error(`Organization not found.`);
    return;
  }

  console.log(`Found organization '${org.name}' with ID: ${org.id}`);

  // Fetch subscription
  const sub = await prisma.subscription.findUnique({
    where: { organizationId: org.id }
  });

  if (!sub) {
    console.error('No subscription found for this organization.');
    return;
  }

  console.log(`Current subscription status: ${sub.status}, Plan: ${sub.plan}`);

  if (sub.status === 'EXPIRED' || sub.status === 'FREE') {
    console.log('Subscription is already FREE or EXPIRED.');
    return;
  }

  // Force expire it exactly as the backend does
  const updated = await prisma.subscription.update({
    where: { organizationId: org.id },
    data: {
      status: 'EXPIRED',
      hdfcMandateId: null, // Mandate has been revoked
      currentPeriodEnd: null,
      graceUntil: null,
      // Reset compliance state for downgrade flow
      complianceState: 'PLATFORM_SELECTION_REQUIRED',
      selectedPlatforms: [],
      selectionLockedUntil: null,
    },
    select: { 
      plan: true, 
      status: true, 
      complianceState: true, 
      selectedPlatforms: true 
    },
  });

  console.log('✅ Successfully force-expired the subscription!');
  console.log('New state:', updated);
  console.log('\n--> Please refresh your WITHUS browser tab now. The popup should appear.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
