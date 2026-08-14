import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setup() {
  // Find a user and org
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No users found in database! Please create an account in the web app first.');
    return;
  }

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('No organizations found in database!');
    return;
  }

  console.log(`Using User: ${user.email} and Org: ${org.name}`);

  // Clear old test sessions
  await prisma.delegatedSession.deleteMany({
    where: { integrationProvider: 'MCA' }
  });

  // Create Test 1: No permissions
  await prisma.delegatedSession.create({
    data: {
      organizationId: org.id,
      grantorId: user.id,
      granteeId: user.id,
      scope: 'INTEGRATION',
      resourceId: 'integration',
      permission: 'REVEAL',
      status: 'ACTIVE',
      integrationProvider: 'MCA',
      integrationResourceType: 'PORTAL',
      integrationResourceExternalId: 'mca_portal_1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      capabilities: []
    }
  });
  console.log('✅ Created Test Session 1: MCA with NO capabilities (Everything should be hidden)');

  // Create Test 2: Only Company e-Filing
  await prisma.delegatedSession.create({
    data: {
      organizationId: org.id,
      grantorId: user.id,
      granteeId: user.id,
      scope: 'INTEGRATION',
      resourceId: 'integration',
      permission: 'REVEAL',
      status: 'ACTIVE',
      integrationProvider: 'MCA',
      integrationResourceType: 'PORTAL',
      integrationResourceExternalId: 'mca_portal_2',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      capabilities: ['mca.company_efiling']
    }
  });
  console.log('✅ Created Test Session 2: MCA with ONLY Company e-Filing (Only this should be visible)');

  // Create Test 3: Company e-Filing + DSC
  await prisma.delegatedSession.create({
    data: {
      organizationId: org.id,
      grantorId: user.id,
      granteeId: user.id,
      scope: 'INTEGRATION',
      resourceId: 'integration',
      permission: 'REVEAL',
      status: 'ACTIVE',
      integrationProvider: 'MCA',
      integrationResourceType: 'PORTAL',
      integrationResourceExternalId: 'mca_portal_3',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      capabilities: ['mca.company_efiling', 'mca.dsc_services']
    }
  });
  console.log('✅ Created Test Session 3: MCA with Company e-Filing + DSC (Both should be visible)');

  console.log('\nDone! You now have 3 active MCA sessions in your database.');
}

setup().catch(console.error).finally(() => prisma.$disconnect());
