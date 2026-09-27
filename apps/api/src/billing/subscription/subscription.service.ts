import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { BillingCycle, PlanTier, Subscription } from '@prisma/client';

/**
 * SubscriptionService
 *
 * CRUD layer for the Subscription model.
 * Single source of truth for all subscription state transitions.
 *
 * State machine:
 *   FREE → PENDING (initiate)
 *   PENDING → ACTIVE (payment confirmed)
 *   ACTIVE → PAST_DUE (renewal failed, within grace period)
 *   PAST_DUE → ACTIVE (retry succeeded)
 *   PAST_DUE → EXPIRED (grace period exhausted, mandate revoked)
 *   ACTIVE → CANCELLED (owner requested)
 *   CANCELLED → EXPIRED (period ended, mandate revoked)
 */
@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find or create a FREE subscription record for an org.
   * Idempotent — safe to call multiple times.
   */
  async getOrCreate(organizationId: string): Promise<Subscription> {
    const existing = await this.prisma.subscription.findUnique({
      where: { organizationId },
    });
    if (existing) return existing;

    return this.prisma.subscription.create({
      data: {
        organizationId,
        plan: 'FREE',
        billingCycle: 'MONTHLY',
        status: 'FREE',
        // New FREE orgs must select 2 platforms before accessing Vault features.
        // The Prisma @default(COMPLIANT) protects existing migrated rows — only
        // newly created rows from this path start as PLATFORM_SELECTION_REQUIRED.
        complianceState: 'PLATFORM_SELECTION_REQUIRED',
        selectedPlatforms: [],
      },
    });
  }

  async findByOrgId(organizationId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { organizationId } });
  }

  /**
   * Set subscription to PENDING when a payment session is initiated.
   * Creates the Subscription row if it doesn't exist yet.
   */
  async setPending(
    organizationId: string,
    opts: {
      plan: PlanTier;
      billingCycle: BillingCycle;
      hdfcCustomerId: string;
      hdfcMandateId: string;
      baseAmount: number;
      extraUsers: number;
      extraUserRate: number;
      totalAmount: number;
    },
  ): Promise<Subscription> {
    return this.prisma.subscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        status: 'PENDING',
        plan: opts.plan,
        billingCycle: opts.billingCycle,
        hdfcCustomerId: opts.hdfcCustomerId,
        hdfcMandateId: opts.hdfcMandateId,
        baseAmount: opts.baseAmount,
        extraUsers: opts.extraUsers,
        extraUserRate: opts.extraUserRate,
        totalAmount: opts.totalAmount,
      },
      update: {
        status: 'PENDING',
        plan: opts.plan,
        billingCycle: opts.billingCycle,
        hdfcCustomerId: opts.hdfcCustomerId,
        hdfcMandateId: opts.hdfcMandateId,
        baseAmount: opts.baseAmount,
        extraUsers: opts.extraUsers,
        extraUserRate: opts.extraUserRate,
        totalAmount: opts.totalAmount,
      },
    });
  }

  /**
   * Activate subscription after confirmed payment.
   * Uses billing anchor: newPeriodStart = previousPeriodEnd (not now).
   * If no previous period exists (first activation), start = now.
   */
  async activate(
    organizationId: string,
    opts: {
      periodStart: Date;
      periodEnd: Date;
      seatsAtCharge: number;
      baseAmount: number;
      extraUsers: number;
      totalAmount: number;
    },
  ): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: opts.periodStart,
        currentPeriodEnd: opts.periodEnd,
        baseAmount: opts.baseAmount,
        extraUsers: opts.extraUsers,
        totalAmount: opts.totalAmount,
        failureCount: 0,
        lastFailureReason: null,
        graceUntil: null,
      },
    });
  }

  /**
   * Mark subscription as PAST_DUE after a failed renewal.
   * Sets grace period (3 days from now) and increments failure counter.
   */
  async markPastDue(
    organizationId: string,
    reason: string,
  ): Promise<Subscription> {
    const graceUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return this.prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'PAST_DUE',
        graceUntil,
        lastFailureReason: reason,
        failureCount: { increment: 1 },
      },
    });
  }

  /**
   * Expire subscription — called when grace period exhausted or mandate revoked.
   * Resets to FREE-equivalent state.
   *
   * IMPORTANT: complianceState is reset to PLATFORM_SELECTION_REQUIRED so that
   * a downgraded org must re-confirm their 2 allowed platforms before accessing
   * Vault features again. selectedPlatforms is cleared so no stale paid-plan
   * platforms remain accessible. The 15-day lock is also cleared so re-selection
   * can begin immediately. This closes the downgrade compliance-reset gap.
   */
  async expire(organizationId: string): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'EXPIRED',
        hdfcMandateId: null, // Mandate has been revoked
        currentPeriodEnd: null,
        graceUntil: null,
        // ── Downgrade compliance reset ─────────────────────────────────────
        // Reset platform selection so FREE restrictions re-apply correctly.
        // Owner must re-select exactly 2 platforms before Vault access resumes.
        complianceState: 'PLATFORM_SELECTION_REQUIRED',
        selectedPlatforms: [],
        selectionLockedUntil: null,
      },
    });
  }

  /**
   * Cancel subscription — service continues until period end, then expires.
   */
  async cancel(organizationId: string, reason: string): Promise<Subscription> {
    return this.prisma.subscription.update({
      where: { organizationId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });
  }

  /**
   * Find all subscriptions due for renewal within the next N hours.
   * The 26-hour window satisfies HDFC's 25-hour minimum lead time requirement.
   */
  async findDueForRenewal(windowHours = 26): Promise<Subscription[]> {
    const deadline = new Date(Date.now() + windowHours * 60 * 60 * 1000);
    return this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        hdfcMandateId: { not: null },
        cancelledAt: null,
        currentPeriodEnd: { lte: deadline },
      },
      take: 50, // Process in batches — remainder handled next sweep
    });
  }

  /**
   * Find subscriptions in PAST_DUE state still within their grace period.
   */
  async findPastDueInGrace(): Promise<Subscription[]> {
    const now = new Date();
    return this.prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
        hdfcMandateId: { not: null },
        graceUntil: { gt: now },
      },
      take: 50,
    });
  }

  /**
   * Find subscriptions in PAST_DUE state where grace period has expired.
   */
  async findGraceExpired(): Promise<Subscription[]> {
    const now = new Date();
    return this.prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
        OR: [{ graceUntil: { lte: now } }, { graceUntil: null }],
      },
      take: 50,
    });
  }

  /**
   * Find CANCELLED subscriptions whose period has ended — time to revoke mandate.
   */
  async findCancelledAndExpired(): Promise<Subscription[]> {
    const now = new Date();
    return this.prisma.subscription.findMany({
      where: {
        status: 'CANCELLED',
        currentPeriodEnd: { lte: now },
      },
      take: 50,
    });
  }

  /**
   * Count active members for billing (includes OWNER, ADMIN, MEMBER where removedAt IS NULL).
   */
  async countActiveSeats(organizationId: string): Promise<number> {
    return this.prisma.organizationMember.count({
      where: { organizationId, removedAt: null },
    });
  }
}
