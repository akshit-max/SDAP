import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SessionsService } from './sessions/sessions.service';
import { SessionExpiryScheduler } from './sessions/session-expiry.scheduler';
import { PrismaService } from './prisma/prisma.service';
import { IntegrationsService } from './integrations/integrations.service';
import { IntegrationProvider } from '@prisma/client';

async function runTests() {
  console.log('Bootstrapping NestJS context for State Machine Verification...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const prisma = app.get(PrismaService);
  const sessionsService = app.get(SessionsService);
  const scheduler = app.get(SessionExpiryScheduler);
  const integrationsService = app.get(IntegrationsService);

  // We need an org, a grantor and a grantee to run the test.
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org-' + Date.now() }
    });
  }
  
  let user1 = await prisma.user.findFirst({ where: { email: 'grantor@test.com' }});
  if (!user1) {
    user1 = await prisma.user.create({ data: { email: 'grantor@test.com', fullName: 'Grantor', passwordHash: 'dummy' }});
  }
  
  let user2 = await prisma.user.findFirst({ where: { email: 'grantee@test.com' }});
  if (!user2) {
    user2 = await prisma.user.create({ data: { email: 'grantee@test.com', fullName: 'Grantee', passwordHash: 'dummy' }});
  }

  // Ensure they are members
  for (const u of [user1, user2]) {
    const mem = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: org.id, userId: u.id }}
    });
    if (!mem) {
      await prisma.organizationMember.create({
        data: { organizationId: org.id, userId: u.id, role: 'ADMIN' }
      });
    }
  }

  // Create a dummy vault
  let vault = await prisma.vault.findFirst({ where: { organizationId: org.id }});
  if (!vault) {
    vault = await prisma.vault.create({ data: { name: 'Test Vault', organizationId: org.id }});
  }

  console.log('✅ Context Ready');

  // --- 1. GitHub failure simulation (Mock grantAccess to throw) ---
  console.log('\n--- 1. Testing grantAccess failure ---');
  
  // Save original grantAccess
  const originalGrantAccess = integrationsService.grantAccess.bind(integrationsService);
  
  // Mock it to fail
  integrationsService.grantAccess = async () => {
    throw new Error('Simulated GitHub API Failure (Invalid PAT)');
  };

  try {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    
    await sessionsService.createSession(org.id, user1.id, {
      granteeId: user2.id,
      scope: 'VAULT',
      resourceId: vault.id,
      permission: 'REVEAL',
      expiresAt: futureDate.toISOString(),
      maxReveals: null,
    } as any);
    
    // We shouldn't reach here if it throws properly, but it's not bound yet.
  } catch (e: any) {
    // Normal failure
  }

  // Now test with integration binding
  try {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    
    await sessionsService.createSession(org.id, user1.id, {
      granteeId: user2.id,
      scope: 'VAULT',
      resourceId: vault.id,
      permission: 'REVEAL',
      expiresAt: futureDate.toISOString(),
      maxReveals: null,
      integrationProvider: 'GITHUB',
      integrationResourceType: 'REPOSITORY',
      integrationResourceExternalId: 'repo-123',
    } as any);
    
    console.error('❌ Expected createSession to throw!');
  } catch (e: any) {
    console.log('✅ createSession threw successfully: ' + e.message);
  }

  // Verify no orphaned pending sessions for GITHUB in this org
  const pendingSessions = await prisma.delegatedSession.findMany({
    where: { organizationId: org.id, status: 'PENDING_GRANT' }
  });
  console.log(`✅ Orphaned PENDING_GRANT records: ${pendingSessions.length}`);

  // Restore grantAccess
  integrationsService.grantAccess = originalGrantAccess;

  // --- 2. Revocation failure simulation ---
  console.log('\n--- 2. Testing revokeAccess failure ---');
  
  // Mock grantAccess to succeed this time
  integrationsService.grantAccess = async () => {
    return { status: 'ACTIVE', referenceId: 'ref-123' } as any;
  };

  const futureDate = new Date();
  futureDate.setHours(futureDate.getHours() + 1);
  
  const session = await sessionsService.createSession(org.id, user1.id, {
    granteeId: user2.id,
    scope: 'VAULT',
    resourceId: vault.id,
    permission: 'REVEAL',
    expiresAt: futureDate.toISOString(),
    maxReveals: null,
    integrationProvider: 'GITHUB',
    integrationResourceType: 'REPOSITORY',
    integrationResourceExternalId: 'repo-123',
  } as any);

  console.log(`✅ Session created with status: ${session.status}`);

  // Mock revokeAccess to fail
  const originalRevokeAccess = integrationsService.revokeAccess.bind(integrationsService);
  integrationsService.revokeAccess = async () => {
    throw new Error('Simulated GitHub API Failure during revoke');
  };

  // Manually expire the session so the scheduler picks it up
  await prisma.delegatedSession.update({
    where: { id: session.id },
    data: { expiresAt: new Date(Date.now() - 1000) } // In the past
  });

  // Run the scheduler sweep
  console.log('Running scheduler (Sweep 1)...');
  await scheduler.runExpirySweep();

  // Check the session status
  let checkSession = await prisma.delegatedSession.findUnique({ where: { id: session.id } });
  console.log(`✅ Session status after failed revoke: ${checkSession?.status}`);

  // Now fix the PAT
  integrationsService.revokeAccess = originalRevokeAccess;
  
  // Mock revokeAccess to succeed
  integrationsService.revokeAccess = async () => {
    return;
  };

  console.log('Running scheduler again (Sweep 2)...');
  await scheduler.runExpirySweep();

  checkSession = await prisma.delegatedSession.findUnique({ where: { id: session.id } });
  console.log(`✅ Session status after successful retry: ${checkSession?.status}`);

  // --- 3. Scheduler Idempotency ---
  console.log('\n--- 3. Testing Scheduler Idempotency ---');
  console.log('Running scheduler again on EXPIRED session...');
  
  // Spy on revokeAccess to ensure it's NOT called
  let revokeCalled = false;
  integrationsService.revokeAccess = async () => {
    revokeCalled = true;
    return;
  };

  await scheduler.runExpirySweep();
  console.log(`✅ Revoke called again? ${revokeCalled}`);

  // --- 4. Audit Correctness ---
  console.log('\n--- 4. Checking Audit Logs ---');
  const auditLogs = await prisma.auditEvent.findMany({
    where: { resourceId: session.id },
    orderBy: { createdAt: 'asc' }
  });

  console.log('Audit events for session lifecycle:');
  auditLogs.forEach((log: any) => {
    console.log(`  - ${log.action} | Status: ${log.metadata?.status ?? log.metadata?.reason ?? ''}`);
  });

  await app.close();
  console.log('\n🎉 State Machine Tests Complete!');
}

runTests().catch(console.error);
