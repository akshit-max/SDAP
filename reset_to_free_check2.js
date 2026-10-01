const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Find the org by name (or find org where a user has 'check2' in email)
  const orgs = await prisma.organization.findMany({
    where: {
      name: { contains: 'check', mode: 'insensitive' }
    }
  });
  
  if (orgs.length === 0) {
    console.log('No orgs found with name containing "check"');
    return;
  }
  
  console.log('Found orgs:', orgs.map(o => ({ id: o.id, name: o.name })));
  
  for (const org of orgs) {
    const sub = await prisma.subscription.findUnique({
      where: { organizationId: org.id }
    });
    console.log(`Org ${org.name} has subscription:`, sub ? sub.plan : 'None');
    
    if (sub) {
      await prisma.subscription.update({
        where: { organizationId: org.id },
        data: { plan: 'FREE' } // or whatever the exact enum value is
      });
      console.log(`Updated ${org.name} to FREE plan.`);
    } else {
       // if no subscription exists, effective plan is usually FREE anyway, 
       // but we could create one or just ignore.
       console.log(`No subscription record for ${org.name}, it defaults to FREE.`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
