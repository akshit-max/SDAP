import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { EntitlementService } from './entitlement.service';
import { PrismaService } from '../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Entitlement Service Tests
// ---------------------------------------------------------------------------
// These tests verify that subscription limits are enforced server-side.
// They do NOT test existing RBAC — that is covered by existing spec files.
// ---------------------------------------------------------------------------

const mockPrisma = {
  subscription: { findUnique: jest.fn() },
  organizationMember: { count: jest.fn() },
  integrationConnection: { count: jest.fn() },
};

describe('EntitlementService', () => {
  let service: EntitlementService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<EntitlementService>(EntitlementService);
  });

  // ── getEffectivePlan ──────────────────────────────────────────────────────

  describe('getEffectivePlan()', () => {
    it('returns FREE when no subscription row exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      expect(await service.getEffectivePlan('org-1')).toBe('FREE');
    });

    it('returns FREE when status is PENDING', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'PENDING',
        currentPeriodEnd: null,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('FREE');
    });

    it('returns FREE when status is EXPIRED', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'EXPIRED',
        currentPeriodEnd: null,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('FREE');
    });

    it('returns FREE when status is FREE', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('FREE');
    });

    it('returns the plan when status is ACTIVE', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('PRO');
    });

    it('returns BUSINESS when ACTIVE', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'BUSINESS',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('BUSINESS');
    });

    it('returns plan when CANCELLED but still within period', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: futureDate,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('PRO');
    });

    it('returns FREE when CANCELLED and period has ended', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'CANCELLED',
        currentPeriodEnd: pastDate,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('FREE');
    });

    it('returns plan when PAST_DUE (grace period)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'PAST_DUE',
        currentPeriodEnd: null,
      });
      expect(await service.getEffectivePlan('org-1')).toBe('PRO');
    });
  });

  // ── assertCanAddUser — FREE ───────────────────────────────────────────────

  describe('assertCanAddUser() — FREE plan (limit = 2)', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
      });
    });

    it('allows adding user when current count is 1', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(1);
      await expect(service.assertCanAddUser('org-1')).resolves.not.toThrow();
    });

    it('rejects 3rd active user on FREE plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(2);
      await expect(service.assertCanAddUser('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── assertCanAddUser — PRO ────────────────────────────────────────────────

  describe('assertCanAddUser() — PRO plan (limit = 5)', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
    });

    it('allows adding 5th user on PRO plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(4);
      await expect(service.assertCanAddUser('org-1')).resolves.not.toThrow();
    });

    it('rejects 6th active user on PRO plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(5);
      await expect(service.assertCanAddUser('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── assertCanAddUser — BUSINESS ──────────────────────────────────────────

  describe('assertCanAddUser() — BUSINESS plan (limit = 15)', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'BUSINESS',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
    });

    it('allows adding 15th user on BUSINESS plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(14);
      await expect(service.assertCanAddUser('org-1')).resolves.not.toThrow();
    });

    it('rejects 16th active user on BUSINESS plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(15);
      await expect(service.assertCanAddUser('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── assertCanAddUser — PENDING falls back to FREE ────────────────────────

  describe('assertCanAddUser() — PENDING subscription (should use FREE limits)', () => {
    it('rejects 3rd user when subscription is PENDING', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'PENDING',
        currentPeriodEnd: null,
      });
      mockPrisma.organizationMember.count.mockResolvedValue(2);
      await expect(service.assertCanAddUser('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── assertCanAddAdmin — FREE ──────────────────────────────────────────────

  describe('assertCanAddAdmin() — FREE plan (limit = 1)', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
      });
    });

    it('rejects 2nd admin on FREE plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(1); // 1 OWNER already
      await expect(service.assertCanAddAdmin('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows first admin when there are 0 admins/owners', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(0);
      await expect(service.assertCanAddAdmin('org-1')).resolves.not.toThrow();
    });
  });

  // ── assertCanAddAdmin — PRO ───────────────────────────────────────────────

  describe('assertCanAddAdmin() — PRO plan (limit = 2)', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
    });

    it('allows 2nd admin on PRO plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(1); // 1 OWNER
      await expect(service.assertCanAddAdmin('org-1')).resolves.not.toThrow();
    });

    it('rejects 3rd admin on PRO plan', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(2); // 1 OWNER + 1 ADMIN
      await expect(service.assertCanAddAdmin('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── assertCanAddAdmin — BUSINESS ─────────────────────────────────────────

  describe('assertCanAddAdmin() — BUSINESS plan (unlimited)', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'BUSINESS',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
    });

    it('never rejects admin on BUSINESS plan regardless of count', async () => {
      mockPrisma.organizationMember.count.mockResolvedValue(999);
      await expect(service.assertCanAddAdmin('org-1')).resolves.not.toThrow();
    });
  });

  // ── assertCanConnectPlatform — FREE ──────────────────────────────────────

  describe('assertCanConnectPlatform() — FREE plan (limit = 2)', () => {
    beforeEach(() => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
      });
    });

    it('allows 2nd platform on FREE plan', async () => {
      mockPrisma.integrationConnection.count.mockResolvedValue(1);
      await expect(
        service.assertCanConnectPlatform('org-1'),
      ).resolves.not.toThrow();
    });

    it('rejects 3rd platform on FREE plan', async () => {
      mockPrisma.integrationConnection.count.mockResolvedValue(2);
      await expect(service.assertCanConnectPlatform('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── assertCanConnectPlatform — PRO / BUSINESS ─────────────────────────────

  describe('assertCanConnectPlatform() — PRO/BUSINESS plan (unlimited)', () => {
    it('never rejects PRO regardless of platform count', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
      mockPrisma.integrationConnection.count.mockResolvedValue(11);
      await expect(
        service.assertCanConnectPlatform('org-1'),
      ).resolves.not.toThrow();
    });

    it('never rejects BUSINESS regardless of platform count', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'BUSINESS',
        status: 'ACTIVE',
        currentPeriodEnd: null,
      });
      mockPrisma.integrationConnection.count.mockResolvedValue(11);
      await expect(
        service.assertCanConnectPlatform('org-1'),
      ).resolves.not.toThrow();
    });
  });

  // ── assertNotOverUserLimit — downgrade cleanup enforcement ────────────────

  describe('assertNotOverUserLimit()', () => {
    describe('FREE plan (limit = 2) — ACTIVE', () => {
      beforeEach(() => {
        mockPrisma.subscription.findUnique.mockResolvedValue({
          plan: 'FREE',
          status: 'FREE',
          currentPeriodEnd: null,
        });
      });

      it('allows org with exactly 2 members (at limit)', async () => {
        mockPrisma.organizationMember.count.mockResolvedValue(2);
        await expect(
          service.assertNotOverUserLimit('org-1'),
        ).resolves.not.toThrow();
      });

      it('allows org with 1 member (under limit)', async () => {
        mockPrisma.organizationMember.count.mockResolvedValue(1);
        await expect(
          service.assertNotOverUserLimit('org-1'),
        ).resolves.not.toThrow();
      });

      it('blocks org with 3 members (over limit after downgrade)', async () => {
        mockPrisma.organizationMember.count.mockResolvedValue(3);
        await expect(service.assertNotOverUserLimit('org-1')).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.assertNotOverUserLimit('org-1')).rejects.toThrow(
          '3 active members',
        );
      });

      it('blocks org with 10 members (PRO→FREE downgrade scenario)', async () => {
        mockPrisma.organizationMember.count.mockResolvedValue(10);
        await expect(service.assertNotOverUserLimit('org-1')).rejects.toThrow(
          ForbiddenException,
        );
        await expect(service.assertNotOverUserLimit('org-1')).rejects.toThrow(
          'Please remove 8 member(s)',
        );
      });
    });

    describe('EXPIRED plan (effective FREE — over-limit after downgrade)', () => {
      beforeEach(() => {
        mockPrisma.subscription.findUnique.mockResolvedValue({
          plan: 'PRO',
          status: 'EXPIRED',
          currentPeriodEnd: null,
        });
      });

      it('blocks org with 5 members that was PRO (now EXPIRED→FREE)', async () => {
        mockPrisma.organizationMember.count.mockResolvedValue(5);
        await expect(service.assertNotOverUserLimit('org-1')).rejects.toThrow(
          ForbiddenException,
        );
      });

      it('allows EXPIRED org with exactly 2 members (under FREE limit)', async () => {
        mockPrisma.organizationMember.count.mockResolvedValue(2);
        await expect(
          service.assertNotOverUserLimit('org-1'),
        ).resolves.not.toThrow();
      });
    });

    describe('PRO plan — ACTIVE (exempt from over-limit check)', () => {
      beforeEach(() => {
        mockPrisma.subscription.findUnique.mockResolvedValue({
          plan: 'PRO',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 86400000),
        });
      });

      it('never blocks PRO ACTIVE orgs regardless of member count', async () => {
        // PRO allows 5 — even passing count=5 should not block
        mockPrisma.organizationMember.count.mockResolvedValue(5);
        await expect(
          service.assertNotOverUserLimit('org-1'),
        ).resolves.not.toThrow();
      });
    });

    describe('BUSINESS plan — ACTIVE (exempt from over-limit check)', () => {
      beforeEach(() => {
        mockPrisma.subscription.findUnique.mockResolvedValue({
          plan: 'BUSINESS',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 86400000),
        });
      });

      it('never blocks BUSINESS ACTIVE orgs regardless of member count', async () => {
        mockPrisma.organizationMember.count.mockResolvedValue(15);
        await expect(
          service.assertNotOverUserLimit('org-1'),
        ).resolves.not.toThrow();
      });
    });
  });

  // ── assertCanUseOtp ───────────────────────────────────────────────────────

  describe('assertCanUseOtp()', () => {
    it('allows PRO plan to use OTP', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      await expect(service.assertCanUseOtp('org-1')).resolves.not.toThrow();
    });

    it('allows BUSINESS plan to use OTP', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'BUSINESS',
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      await expect(service.assertCanUseOtp('org-1')).resolves.not.toThrow();
    });

    it('blocks FREE plan from using OTP', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'FREE',
        status: 'FREE',
        currentPeriodEnd: null,
      });
      await expect(service.assertCanUseOtp('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('blocks EXPIRED plan from using OTP (effective FREE)', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({
        plan: 'PRO',
        status: 'EXPIRED',
        currentPeriodEnd: null,
      });
      await expect(service.assertCanUseOtp('org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
