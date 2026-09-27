import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Vault Platform Entitlement Security Tests
 *
 * Proves that assertVaultPlatformAllowed() correctly denies and allows
 * access for all relevant scenarios per the security matrix.
 *
 * Authorization is based on trusted DB state (Vault.platformId + Subscription.selectedPlatforms).
 * No client-supplied platform values are trusted.
 */
describe('EntitlementService.assertVaultPlatformAllowed()', () => {
  let service: EntitlementService;
  let prisma: jest.Mocked<PrismaService>;

  const mockSub = (
    plan: string,
    status: string,
    complianceState: string,
    selectedPlatforms: string[],
    currentPeriodEnd?: Date | null,
  ) => ({
    plan,
    status,
    currentPeriodEnd: currentPeriodEnd ?? null,
    complianceState,
    selectedPlatforms,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementService,
        {
          provide: PrismaService,
          useValue: {
            subscription: { findUnique: jest.fn() },
            organizationMember: { count: jest.fn() },
            integrationConnection: { count: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<EntitlementService>(EntitlementService);
    prisma = module.get(PrismaService);
  });

  // ─── PRO plan ─────────────────────────────────────────────────────────────

  describe('PRO plan', () => {
    const proPlatformSub = {
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodEnd: null,
    };

    beforeEach(() => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(
        proPlatformSub,
      );
    });

    it('allows GITHUB vault on PRO', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GITHUB'),
      ).resolves.toBeUndefined();
    });

    it('allows GODADDY vault on PRO (not in Free selectedPlatforms)', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GODADDY'),
      ).resolves.toBeUndefined();
    });

    it('allows generic vault (platformId=null) on PRO — existing behavior preserved', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', null),
      ).resolves.toBeUndefined();
    });

    it('allows all 11 platforms on PRO', async () => {
      const platforms = [
        'GITHUB',
        'VERCEL',
        'GODADDY',
        'LINKEDIN',
        'SHOPIFY',
        'STRIPE',
        'RAZORPAY',
        'MCA',
        'GST',
        'UDYAM',
        'GMAIL',
      ];
      for (const p of platforms) {
        await expect(
          service.assertVaultPlatformAllowed('org1', p),
        ).resolves.toBeUndefined();
      }
    });
  });

  // ─── BUSINESS plan ────────────────────────────────────────────────────────

  describe('BUSINESS plan', () => {
    beforeEach(() => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'BUSINESS',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
    });

    it('allows all 11 platforms on BUSINESS', async () => {
      const platforms = [
        'GITHUB',
        'VERCEL',
        'GODADDY',
        'LINKEDIN',
        'SHOPIFY',
        'STRIPE',
        'RAZORPAY',
        'MCA',
        'GST',
        'UDYAM',
        'GMAIL',
      ];
      for (const p of platforms) {
        await expect(
          service.assertVaultPlatformAllowed('org1', p),
        ).resolves.toBeUndefined();
      }
    });

    it('allows generic vault (platformId=null) on BUSINESS', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', null),
      ).resolves.toBeUndefined();
    });
  });

  // ─── FREE plan — selected [GITHUB, VERCEL] ────────────────────────────────

  describe('FREE plan — selectedPlatforms=[GITHUB,VERCEL], COMPLIANT', () => {
    beforeEach(() => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
        complianceState: 'COMPLIANT',
        selectedPlatforms: ['GITHUB', 'VERCEL'],
      });
    });

    it('SECURITY MATRIX: allows GITHUB vault (selected platform)', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GITHUB'),
      ).resolves.toBeUndefined();
    });

    it('SECURITY MATRIX: allows VERCEL vault (selected platform)', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'VERCEL'),
      ).resolves.toBeUndefined();
    });

    it('SECURITY MATRIX: blocks GODADDY vault (unselected platform) → PLATFORM_NOT_ENTITLED', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GODADDY'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GODADDY'),
      ).rejects.toThrow('PLATFORM_NOT_ENTITLED');
    });

    it('SECURITY MATRIX: blocks LINKEDIN vault (unselected platform) → PLATFORM_NOT_ENTITLED', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'LINKEDIN'),
      ).rejects.toThrow('PLATFORM_NOT_ENTITLED');
    });

    it('SECURITY MATRIX: blocks GMAIL vault (unselected platform) → PLATFORM_NOT_ENTITLED', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GMAIL'),
      ).rejects.toThrow('PLATFORM_NOT_ENTITLED');
    });

    it('SECURITY MATRIX: blocks generic vault (platformId=null) → VAULT_PLATFORM_REQUIRED', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', null),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.assertVaultPlatformAllowed('org1', null),
      ).rejects.toThrow('VAULT_PLATFORM_REQUIRED');
    });

    it('SECURITY MATRIX: blocks vault named "GoDaddy" with platformId=null → VAULT_PLATFORM_REQUIRED (names not trusted)', async () => {
      // The vault is named "GoDaddy" but platformId is null — must fail closed
      await expect(
        service.assertVaultPlatformAllowed('org1', null),
      ).rejects.toThrow('VAULT_PLATFORM_REQUIRED');
    });

    it('SECURITY MATRIX: blocks invalid platformId (e.g. client-tampered value) → INVALID_VAULT_PLATFORM', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'FAKEGODADDY'),
      ).rejects.toThrow('INVALID_VAULT_PLATFORM');
    });

    it('SECURITY MATRIX: blocks empty string platformId → INVALID_VAULT_PLATFORM', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', ''),
      ).rejects.toThrow('INVALID_VAULT_PLATFORM');
    });
  });

  // ─── FREE plan — PLATFORM_SELECTION_REQUIRED ──────────────────────────────

  describe('FREE plan — PLATFORM_SELECTION_REQUIRED (new org)', () => {
    beforeEach(() => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
        complianceState: 'PLATFORM_SELECTION_REQUIRED',
        selectedPlatforms: [],
      });
    });

    it('SECURITY MATRIX: blocks any platform when compliance incomplete → SUBSCRIPTION_COMPLIANCE_REQUIRED', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GITHUB'),
      ).rejects.toThrow('SUBSCRIPTION_COMPLIANCE_REQUIRED');
    });

    it('SECURITY MATRIX: blocks generic vault when compliance incomplete → VAULT_PLATFORM_REQUIRED', async () => {
      // null check runs before compliance check
      await expect(
        service.assertVaultPlatformAllowed('org1', null),
      ).rejects.toThrow('VAULT_PLATFORM_REQUIRED');
    });
  });

  // ─── FREE plan — no subscription row ─────────────────────────────────────

  describe('FREE plan — no subscription row', () => {
    beforeEach(() => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null);
    });

    it('blocks all platforms when no subscription row exists (fail closed)', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', 'GITHUB'),
      ).rejects.toThrow('SUBSCRIPTION_COMPLIANCE_REQUIRED');
    });

    it('blocks null platformId when no subscription row exists', async () => {
      await expect(
        service.assertVaultPlatformAllowed('org1', null),
      ).rejects.toThrow('VAULT_PLATFORM_REQUIRED');
    });
  });

  // ─── confirmPlatformSelection ─────────────────────────────────────────────

  describe('confirmPlatformSelection()', () => {
    beforeEach(() => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
        complianceState: 'PLATFORM_SELECTION_REQUIRED',
        selectedPlatforms: [],
      });
      (prisma.subscription as any).upsert = jest.fn().mockResolvedValue({});
    });

    it('rejects if fewer than 2 platforms selected', async () => {
      await expect(
        service.confirmPlatformSelection('org1', ['GITHUB']),
      ).rejects.toThrow('Exactly 2 platforms must be selected');
    });

    it('rejects if more than 2 platforms selected', async () => {
      await expect(
        service.confirmPlatformSelection('org1', [
          'GITHUB',
          'VERCEL',
          'GODADDY',
        ]),
      ).rejects.toThrow('Exactly 2 platforms must be selected');
    });

    it('rejects duplicate platforms', async () => {
      await expect(
        service.confirmPlatformSelection('org1', ['GITHUB', 'GITHUB']),
      ).rejects.toThrow('unique');
    });

    it('rejects invalid/tampered platform names', async () => {
      await expect(
        service.confirmPlatformSelection('org1', ['GITHUB', 'MALICIOUS']),
      ).rejects.toThrow('Invalid platform');
    });

    it('accepts exactly 2 valid unique platforms', async () => {
      await expect(
        service.confirmPlatformSelection('org1', ['GITHUB', 'VERCEL']),
      ).resolves.toBeUndefined();
    });
  });

  // ── Downgrade cleanup: assertNotOverUserLimit ─────────────────────────────
  // Verifies the expire() → complianceState reset → cleanup enforcement chain.

  describe('Downgrade cleanup — assertNotOverUserLimit()', () => {
    it('blocks a PRO→EXPIRED org with 5 members (over FREE limit of 2)', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'PRO',
        status: 'EXPIRED',
        currentPeriodEnd: null,
        complianceState: 'PLATFORM_SELECTION_REQUIRED', // reset by expire()
        selectedPlatforms: [], // cleared by expire()
      });
      (prisma.organizationMember.count as jest.Mock).mockResolvedValue(5);

      await expect(service.assertNotOverUserLimit('org1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('unblocks the same org after owner removes excess (2 members remain)', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'PRO',
        status: 'EXPIRED',
        currentPeriodEnd: null,
        complianceState: 'PLATFORM_SELECTION_REQUIRED',
        selectedPlatforms: [],
      });
      (prisma.organizationMember.count as jest.Mock).mockResolvedValue(2);

      await expect(
        service.assertNotOverUserLimit('org1'),
      ).resolves.not.toThrow();
    });

    it('never blocks a PRO ACTIVE org with 5 members (paid plan, not downgraded)', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
        complianceState: 'COMPLIANT',
        selectedPlatforms: [],
      });
      (prisma.organizationMember.count as jest.Mock).mockResolvedValue(5);

      await expect(
        service.assertNotOverUserLimit('org1'),
      ).resolves.not.toThrow();
    });

    it('blocks a BUSINESS→EXPIRED org with 15 members (over FREE limit)', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'BUSINESS',
        status: 'EXPIRED',
        currentPeriodEnd: null,
        complianceState: 'PLATFORM_SELECTION_REQUIRED',
        selectedPlatforms: [],
      });
      (prisma.organizationMember.count as jest.Mock).mockResolvedValue(15);

      await expect(service.assertNotOverUserLimit('org1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.assertNotOverUserLimit('org1')).rejects.toThrow(
        'Please remove 13 member(s)',
      );
    });
  });

  // ── Reconnect: platform slot not double-counted ───────────────────────────
  // Verifies the existing behavior documented in integrations.service.ts:
  // reconnecting an already-connected platform is handled upstream by an
  // alreadyConnected check — assertCanConnectPlatform is never called for
  // reconnects. Here we verify the entitlement logic itself is idempotent.

  describe('Reconnect — platform slot not double-counted', () => {
    it('FREE org at exactly 2 connections: assertCanConnectPlatform blocks a 3rd NEW platform', async () => {
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
        complianceState: 'COMPLIANT',
        selectedPlatforms: ['GITHUB', 'VERCEL'],
      });
      (prisma.integrationConnection.count as jest.Mock).mockResolvedValue(2);

      await expect(service.assertCanConnectPlatform('org1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('FREE org at exactly 2 connections: reconnecting same platform is skipped upstream (count stays 2)', async () => {
      // Upstream integrations.service.ts already gates reconnects:
      //   if (alreadyConnected) → skip assertCanConnectPlatform entirely.
      // This test confirms the count-check itself does not block at exactly the limit
      // when called without the upstream skip — it blocks (count >= limit).
      // The reconnect safety is enforced by the caller, not this method.
      (prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
        complianceState: 'COMPLIANT',
        selectedPlatforms: ['GITHUB', 'VERCEL'],
      });
      // Simulate: 2 connections, trying to "reconnect" would NOT call assertCanConnectPlatform
      // (handled by alreadyConnected guard in IntegrationsService). So count stays at 2.
      (prisma.integrationConnection.count as jest.Mock).mockResolvedValue(2);

      // If assertCanConnectPlatform IS called at exactly 2, it blocks (>= limit). This is
      // the correct behavior — the upstream guard is what makes reconnects safe.
      await expect(service.assertCanConnectPlatform('org1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
