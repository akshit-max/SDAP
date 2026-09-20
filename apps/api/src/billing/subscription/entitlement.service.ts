import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { PlanTier } from '@prisma/client';

// ─── Plan Limits (server-side source of truth) ───────────────────────────────
// Must stay in sync with apps/web/lib/subscription/pricing.config.ts
const USER_LIMITS: Record<PlanTier, number> = {
  FREE: 2,
  PRO: 5,
  BUSINESS: 15,
};
const ADMIN_LIMITS: Record<PlanTier, number | null> = {
  FREE: 1,
  PRO: 2,
  BUSINESS: null, // unlimited
};
const PLATFORM_LIMITS: Record<PlanTier, number | null> = {
  FREE: 2,
  PRO: null, // all 11
  BUSINESS: null, // all 11
};

/**
 * EntitlementService
 *
 * Single source of truth for "what plan does this org have?"
 * Used by any module needing to gate features on subscription status.
 *
 * Rule: if subscription row is absent, null, FREE, EXPIRED, or CANCELLED-past-period-end
 * → org is on FREE plan. We never trust the client-sent plan.
 *
 * IMPORTANT: This service is an ADDITIONAL restriction layer.
 * It never grants permissions that the existing PermissionEvaluator/PermissionsGuard would deny.
 * Authorization model: existing RBAC AND subscription entitlement → allow action.
 */
@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the effective plan for an org.
   * CANCELLED subs that still have time remaining are still treated as the paid plan.
   * Once period ends they become EXPIRED → FREE.
   */
  async getEffectivePlan(organizationId: string): Promise<PlanTier> {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId },
      select: { plan: true, status: true, currentPeriodEnd: true },
    });

    if (!sub) return 'FREE';

    switch (sub.status) {
      case 'ACTIVE':
        return sub.plan;
      case 'CANCELLED': {
        // Still within paid period — honour the plan
        const now = new Date();
        if (sub.currentPeriodEnd && sub.currentPeriodEnd > now) {
          return sub.plan;
        }
        return 'FREE';
      }
      case 'PAST_DUE':
        // Still within grace period — keep plan access
        return sub.plan;
      case 'FREE':
      case 'PENDING':
      case 'EXPIRED':
      default:
        return 'FREE';
    }
  }

  /**
   * Returns true if the org is on a paid plan (PRO or BUSINESS).
   */
  async isPaidPlan(organizationId: string): Promise<boolean> {
    const plan = await this.getEffectivePlan(organizationId);
    return plan === 'PRO' || plan === 'BUSINESS';
  }

  // ─── Limit Checks ─────────────────────────────────────────────────────────

  /**
   * Throws ForbiddenException if adding a new active member would exceed the plan's user limit.
   * Call this BEFORE creating an OrganizationMember or accepting an invitation.
   * Does not affect existing RBAC — purely an additive subscription limit.
   */
  async assertCanAddUser(organizationId: string): Promise<void> {
    const plan = await this.getEffectivePlan(organizationId);
    const limit = USER_LIMITS[plan];

    const current = await this.prisma.organizationMember.count({
      where: { organizationId, removedAt: null },
    });

    if (current >= limit) {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (${plan}) at user limit ${current}/${limit}`,
      );
      throw new ForbiddenException(
        `Your ${plan} plan allows up to ${limit} active user(s). ` +
          `Please upgrade or remove a member before adding more.`,
      );
    }
  }

  /**
   * Throws ForbiddenException if assigning ADMIN role would exceed the plan's admin limit.
   * Call this BEFORE changing a member's role to ADMIN.
   * Does not affect existing RBAC — purely an additive subscription limit.
   */
  async assertCanAddAdmin(organizationId: string): Promise<void> {
    const plan = await this.getEffectivePlan(organizationId);
    const limit = ADMIN_LIMITS[plan];

    if (limit === null) return; // BUSINESS — unlimited admins

    const currentAdmins = await this.prisma.organizationMember.count({
      where: {
        organizationId,
        removedAt: null,
        role: { in: ['ADMIN', 'OWNER'] },
      },
    });

    if (currentAdmins >= limit) {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (${plan}) at admin limit ${currentAdmins}/${limit}`,
      );
      throw new ForbiddenException(
        `Your ${plan} plan allows up to ${limit} admin(s). ` +
          `Please upgrade to add more admins.`,
      );
    }
  }

  /**
   * Throws ForbiddenException if connecting a new platform would exceed the plan's platform limit.
   * Call this BEFORE creating an IntegrationConnection.
   * Does not affect existing RBAC — purely an additive subscription limit.
   */
  async assertCanConnectPlatform(organizationId: string): Promise<void> {
    const plan = await this.getEffectivePlan(organizationId);
    const limit = PLATFORM_LIMITS[plan];

    if (limit === null) return; // PRO/BUSINESS — unlimited platforms

    const current = await this.prisma.integrationConnection.count({
      where: { organizationId, deletedAt: null },
    });

    if (current >= limit) {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (${plan}) at platform limit ${current}/${limit}`,
      );
      throw new ForbiddenException(
        `Your ${plan} plan allows up to ${limit} connected platform(s). ` +
          `Please upgrade to connect more platforms.`,
      );
    }
  }
}
