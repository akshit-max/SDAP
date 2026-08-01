import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { SessionsService } from '../../src/sessions/sessions.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { IntegrationsService } from '../../src/integrations/integrations.service';
import { SessionExpiryScheduler } from '../../src/sessions/session-expiry.scheduler';

describe('Session State Machine (e2e)', () => {
  let app: INestApplication;
  let sessionsService: SessionsService;
  let prisma: PrismaService;
  let integrationsService: IntegrationsService;
  let scheduler: SessionExpiryScheduler;

  let orgId: string;
  let grantorId: string;
  let granteeId: string;
  let vaultId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sessionsService = app.get(SessionsService);
    prisma = app.get(PrismaService);
    integrationsService = app.get(IntegrationsService);
    scheduler = app.get(SessionExpiryScheduler);

    // Setup basic context
    const org = await prisma.organization.create({
      data: { name: 'E2E Test Org', slug: 'e2e-org-' + Date.now() },
    });
    orgId = org.id;

    const grantor = await prisma.user.create({
      data: { email: 'grantor_' + Date.now() + '@test.com', fullName: 'Grantor', passwordHash: 'hash' },
    });
    grantorId = grantor.id;

    const grantee = await prisma.user.create({
      data: { email: 'grantee_' + Date.now() + '@test.com', fullName: 'Grantee', passwordHash: 'hash' },
    });
    granteeId = grantee.id;

    await prisma.organizationMember.createMany({
      data: [
        { organizationId: orgId, userId: grantorId, role: 'ADMIN' },
        { organizationId: orgId, userId: granteeId, role: 'MEMBER' },
      ],
    });

    const vault = await prisma.vault.create({
      data: { name: 'Test Vault', organizationId: orgId },
    });
    vaultId = vault.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. GitHub failure simulation - prevents active session and orphans', async () => {
    // Mock grantAccess to fail
    jest.spyOn(integrationsService, 'grantAccess').mockRejectedValueOnce(new Error('Simulated API Failure'));

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    await expect(
      sessionsService.createSession(orgId, grantorId, {
        granteeId,
        scope: 'VAULT',
        resourceId: vaultId,
        permission: 'REVEAL',
        expiresAt: futureDate.toISOString(),
        maxReveals: undefined,
        integrationProvider: 'GITHUB',
        integrationResourceType: 'REPOSITORY',
        integrationResourceExternalId: 'repo-123',
      } as any),
    ).rejects.toThrow('Simulated API Failure');

    const pending = await prisma.delegatedSession.findMany({
      where: { organizationId: orgId, status: 'PENDING_GRANT' },
    });
    expect(pending.length).toBe(0); // No orphans
  });

  it('2. Revocation failure simulation - recovers via scheduler', async () => {
    jest.spyOn(integrationsService, 'grantAccess').mockResolvedValueOnce({
      status: 'ACTIVE',
      referenceId: 'ref-123',
    } as any);

    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const session = await sessionsService.createSession(orgId, grantorId, {
      granteeId,
      scope: 'VAULT',
      resourceId: vaultId,
      permission: 'REVEAL',
      expiresAt: futureDate.toISOString(),
      maxReveals: undefined,
      integrationProvider: 'GITHUB',
      integrationResourceType: 'REPOSITORY',
      integrationResourceExternalId: 'repo-123',
    } as any);

    expect(session.status).toBe('ACTIVE');

    // Make it expire immediately for the scheduler
    await prisma.delegatedSession.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    // Mock revoke to fail
    const revokeSpy = jest.spyOn(integrationsService, 'revokeAccess').mockRejectedValueOnce(new Error('Failed to revoke'));
    await scheduler.runExpirySweep();

    let dbSession = await prisma.delegatedSession.findUnique({ where: { id: session.id } });
    expect(dbSession?.status).toBe('REVOKE_FAILED');

    // Mock revoke to succeed on next sweep
    revokeSpy.mockResolvedValueOnce(undefined);
    await scheduler.runExpirySweep();

    dbSession = await prisma.delegatedSession.findUnique({ where: { id: session.id } });
    expect(dbSession?.status).toBe('EXPIRED');
  });

  it('3. Scheduler idempotency - double sweep does not double invoke', async () => {
    const revokeSpy = jest.spyOn(integrationsService, 'revokeAccess').mockResolvedValueOnce(undefined);
    await scheduler.runExpirySweep();
    expect(revokeSpy).not.toHaveBeenCalled(); // No ACTIVE or REVOKE_FAILED sessions exist
  });
});
