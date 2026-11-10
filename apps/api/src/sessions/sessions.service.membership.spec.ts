import { ForbiddenException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionValidationService } from './session-validation.service';

// F-003: delegated credential access must require an active org membership.
describe('SessionsService — active membership on credential access (F-003)', () => {
  const session = {
    id: 'sess-1',
    organizationId: 'org-1',
    granteeId: 'grantee-1',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 3_600_000),
    maxReveals: null,
    revealCount: 0,
    scope: 'SECRET',
    resourceId: 'secret-1',
    permission: 'REVEAL',
  };

  function build(membership: any) {
    const tx = {
      delegatedSession: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(session),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
    };
    const prisma: any = {
      delegatedSession: { findUnique: jest.fn().mockResolvedValue(session) },
      organizationMember: {
        findUnique: jest.fn().mockResolvedValue(membership),
      },
      $transaction: jest.fn((fn: any) => fn(tx)),
    };
    const secrets: any = {
      revealSecret: jest.fn().mockResolvedValue('user\npass'),
    };
    const service = new SessionsService(
      prisma,
      { emit: jest.fn() } as any,
      new SessionValidationService(),
      secrets,
      undefined,
      undefined as any,
    );
    return { service, prisma, secrets };
  }

  const calls = [
    ['launchSessionForExtension'],
    ['revealSecretViaSession'],
  ] as const;

  it.each(calls)(
    '%s: active member still gets the credential',
    async (method) => {
      const { service, secrets } = build({ removedAt: null });
      await expect(
        service[method]('org-1', 'sess-1', 'grantee-1', 'test'),
      ).resolves.toBe('user\npass');
      expect(secrets.revealSecret).toHaveBeenCalledTimes(1);
    },
  );

  it.each(calls)(
    '%s: removed member is refused before decryption',
    async (method) => {
      const { service, secrets } = build({ removedAt: new Date() });
      await expect(
        service[method]('org-1', 'sess-1', 'grantee-1', 'test'),
      ).rejects.toThrow(ForbiddenException);
      expect(secrets.revealSecret).not.toHaveBeenCalled();
    },
  );

  it.each(calls)(
    '%s: non-member is refused before decryption',
    async (method) => {
      const { service, secrets, prisma } = build(null);
      await expect(
        service[method]('org-1', 'sess-1', 'grantee-1', 'test'),
      ).rejects.toThrow(ForbiddenException);
      expect(secrets.revealSecret).not.toHaveBeenCalled();
      expect(prisma.organizationMember.findUnique).toHaveBeenCalledWith({
        where: {
          organizationId_userId: {
            organizationId: 'org-1',
            userId: 'grantee-1',
          },
        },
        select: { removedAt: true },
      });
    },
  );
});
