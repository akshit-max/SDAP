// Stale tracked .js twins (e.g. ../dto/sessions.dto.js) are resolved by jest before
// the .ts sources and fail to load; fetchOtp needs none of them.
jest.mock('../dto/sessions.dto', () => ({
  CreateSessionDto: class {},
  RevealSessionDto: class {},
}));
jest.mock('../sessions.service', () => ({ SessionsService: class {} }));
jest.mock('../../approvals/approvals.service', () => ({
  ApprovalsService: class {},
}));
jest.mock('../../approvals/approval-policy.service', () => ({
  ApprovalPolicyService: class {},
}));
jest.mock('../../integrations/gmail/gmail.adapter', () => ({
  GmailAdapter: class {},
}));

import { ForbiddenException } from '@nestjs/common';
import { SessionsController } from './sessions.controller';

describe('SessionsController.fetchOtp — platform binding', () => {
  const req = { user: { id: 'grantee-1' } } as any;
  let prisma: any;
  let gmailOtpService: { fetchLatestOtp: jest.Mock };
  let controller: SessionsController;

  function session(overrides: Record<string, unknown> = {}) {
    return {
      id: 'sess-1',
      organizationId: 'org-1',
      granteeId: 'grantee-1',
      grantorId: 'grantor-1',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 3_600_000),
      scope: 'SECRET',
      resourceId: 'secret-1',
      integrationProvider: null,
      grantor: { id: 'grantor-1' },
      ...overrides,
    };
  }

  function setup(sess: any, vaultPlatformId: string | null) {
    prisma = {
      delegatedSession: { findUnique: jest.fn().mockResolvedValue(sess) },
      secret: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ vault: { platformId: vaultPlatformId } }),
      },
      vault: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ platformId: vaultPlatformId }),
      },
    };
    gmailOtpService = { fetchLatestOtp: jest.fn().mockResolvedValue('123456') };
    controller = new SessionsController(
      {} as any,
      {} as any,
      {} as any,
      {
        getValidAccessToken: jest.fn().mockResolvedValue('gmail-token'),
      } as any,
      gmailOtpService as any,
      { emit: jest.fn() } as any,
      prisma,
      undefined as any,
    );
  }

  it.each(['VERCEL', 'STRIPE', 'RAZORPAY'])(
    'existing flow: %s vault session with matching extension platform succeeds',
    async (platform) => {
      setup(session(), platform);
      await expect(
        controller.fetchOtp('org-1', 'sess-1', req, {
          platform,
          loginStartTime: 42,
        }),
      ).resolves.toEqual({ otp: '123456' });
      expect(gmailOtpService.fetchLatestOtp).toHaveBeenCalledWith(
        'gmail-token',
        platform,
        42,
      );
    },
  );

  it('rejects a request whose platform differs from the vault platform, without touching Gmail', async () => {
    setup(session(), 'VERCEL');
    await expect(
      controller.fetchOtp('org-1', 'sess-1', req, { platform: 'STRIPE' }),
    ).rejects.toThrow(ForbiddenException);
    expect(gmailOtpService.fetchLatestOtp).not.toHaveBeenCalled();
  });

  it('uses the vault platform when the request omits it', async () => {
    setup(session({ scope: 'VAULT', resourceId: 'vault-1' }), 'RAZORPAY');
    await controller.fetchOtp('org-1', 'sess-1', req, {});
    expect(prisma.vault.findUnique).toHaveBeenCalledWith({
      where: { id: 'vault-1' },
      select: { platformId: true },
    });
    expect(gmailOtpService.fetchLatestOtp.mock.calls[0][1]).toBe('RAZORPAY');
  });

  it('integrationProvider takes precedence and cannot be overridden', async () => {
    setup(
      session({ scope: 'INTEGRATION', integrationProvider: 'GITHUB' }),
      null,
    );
    await expect(
      controller.fetchOtp('org-1', 'sess-1', req, { platform: 'VERCEL' }),
    ).rejects.toThrow(ForbiddenException);
    expect(gmailOtpService.fetchLatestOtp).not.toHaveBeenCalled();
  });

  it('legacy generic vault (no stored platform) falls back to the extension platform', async () => {
    setup(session(), null);
    await controller.fetchOtp('org-1', 'sess-1', req, { platform: 'VERCEL' });
    expect(gmailOtpService.fetchLatestOtp.mock.calls[0][1]).toBe('VERCEL');
  });

  it('still refuses a non-grantee before any platform lookup', async () => {
    setup(session({ granteeId: 'someone-else' }), 'VERCEL');
    await expect(
      controller.fetchOtp('org-1', 'sess-1', req, { platform: 'VERCEL' }),
    ).resolves.toEqual({ error: 'You are not the grantee of this session.' });
    expect(prisma.secret.findUnique).not.toHaveBeenCalled();
  });
});
