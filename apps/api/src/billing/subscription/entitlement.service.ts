import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { PlanTier } from '@prisma/client';
import {
  WITHUS_VAULT_PLATFORMS,
  isValidVaultPlatformId,
} from './platform-catalog';

// â”€â”€â”€ Plan Limits (server-side source of truth) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
 * â†’ org is on FREE plan. We never trust the client-sent plan.
 *
 * IMPORTANT: This service is an ADDITIONAL restriction layer.
 * It never grants permissions that the existing PermissionEvaluator/PermissionsGuard would deny.
 * Authorization model: existing RBAC AND subscription entitlement â†’ allow action.
 */
@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the effective plan for an org.
   * CANCELLED subs that still have time remaining are still treated as the paid plan.
   * Once period ends they become EXPIRED â†’ FREE.
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
        // Still within paid period â€” honour the plan
        const now = new Date();
        if (sub.currentPeriodEnd && sub.currentPeriodEnd > now) {
          return sub.plan;
        }
        return 'FREE';
      }
      case 'PAST_DUE':
        // Still within grace period â€” keep plan access
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

  // â”€â”€â”€ Limit Checks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Throws ForbiddenException if adding a new active member would exceed the plan's user limit.
   * Call this BEFORE creating an OrganizationMember or accepting an invitation.
   * Does not affect existing RBAC â€” purely an additive subscription limit.
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
   * Does not affect existing RBAC â€” purely an additive subscription limit.
   */
  async assertCanAddAdmin(organizationId: string): Promise<void> {
    const plan = await this.getEffectivePlan(organizationId);
    const limit = ADMIN_LIMITS[plan];

    if (limit === null) return; // BUSINESS â€” unlimited admins

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
   * Does not affect existing RBAC â€” purely an additive subscription limit.
   */
  async assertCanConnectPlatform(organizationId: string): Promise<void> {
    const plan = await this.getEffectivePlan(organizationId);
    const limit = PLATFORM_LIMITS[plan];

    if (limit === null) return; // PRO/BUSINESS â€” unlimited platforms

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

  // â”€â”€â”€ Vault Platform Entitlement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Asserts the org is entitled to use the given Vault platform.
   *
   * Rules:
   *  - PRO / BUSINESS: all 11 platforms allowed; generic (null) Vaults allowed.
   *  - FREE: platformId must be non-null, must be in the 11-catalog, org must be
   *    COMPLIANT, and the platform must be in selectedPlatforms.
   *
   * Authorization uses trusted DB state only â€” never client-supplied platform values.
   * Call this BEFORE creating a Vault, a Session, or performing a Secret reveal.
   */
  async assertVaultPlatformAllowed(
    organizationId: string,
    platformId: string | null,
  ): Promise<void> {
    const plan = await this.getEffectivePlan(organizationId);

    // PRO / BUSINESS: all platforms allowed; generic vaults (null) allowed
    if (plan === 'PRO' || plan === 'BUSINESS') return;

    // FREE: generic Vault (platformId = null) is not allowed for credential operations
    if (platformId === null) {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (FREE): attempted operation on generic Vault (platformId=null)`,
      );
      throw new ForbiddenException('VAULT_PLATFORM_REQUIRED');
    }

    // FREE: platformId must be in the authoritative 11-platform catalog
    if (!isValidVaultPlatformId(platformId)) {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (FREE): invalid Vault platformId "${platformId}"`,
      );
      throw new ForbiddenException('INVALID_VAULT_PLATFORM');
    }

    // FREE: load compliance state and selected platforms from trusted DB
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId },
      select: { complianceState: true, selectedPlatforms: true },
    });

    if (!sub || sub.complianceState !== 'COMPLIANT') {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (FREE): compliance state is ${sub?.complianceState ?? 'MISSING'} â€” blocking Vault operation`,
      );
      throw new ForbiddenException('SUBSCRIPTION_COMPLIANCE_REQUIRED');
    }

    if (!sub.selectedPlatforms.includes(platformId)) {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (FREE): platform "${platformId}" not in selectedPlatforms [${sub.selectedPlatforms.join(', ')}]`,
      );
      throw new ForbiddenException('PLATFORM_NOT_ENTITLED');
    }
  }

  // â”€â”€â”€ OTP Entitlement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Asserts the org is entitled to use the OTP retrieval feature.
   * FREE plans cannot use OTP. PRO and BUSINESS can.
   * Call this at the top of fetchOtp() BEFORE any Gmail interaction.
   */
  async assertCanUseOtp(organizationId: string): Promise<void> {
    const plan = await this.getEffectivePlan(organizationId);

    if (plan === 'FREE') {
      this.logger.warn(
        `[ENTITLEMENT] Org ${organizationId} (FREE): OTP retrieval is a paid feature`,
      );
      throw new ForbiddenException(
        'OTP retrieval requires a PRO or BUSINESS plan. Please upgrade to use this feature.',
      );
    }
  }

  // â”€â”€â”€ Compliance State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Returns the current compliance status for the org.
   * Used by the frontend ComplianceGate and the compliance API endpoint.
   */
  async getComplianceStatus(organizationId: string): Promise<{
    complianceState: string;
    selectedPlatforms: string[];
    selectionLockedUntil: Date | null;
    plan: PlanTier;
  }> {
    const plan = await this.getEffectivePlan(organizationId);

    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId },
      select: {
        complianceState: true,
        selectedPlatforms: true,
        selectionLockedUntil: true,
      },
    });

    return {
      complianceState: sub?.complianceState ?? 'PLATFORM_SELECTION_REQUIRED',
      selectedPlatforms: sub?.selectedPlatforms ?? [],
      selectionLockedUntil: sub?.selectionLockedUntil ?? null,
      plan,
    };
  }

  /**
   * Validates and stores exactly 2 platform selections for a FREE org.
   * Sets selectionLockedUntil = now + 15 days, complianceState = COMPLIANT.
   * Throws if not exactly 2, if duplicates exist, or if any platform is invalid.
   * Call ONLY after the user submits the platform selection form.
   */
  async confirmPlatformSelection(
    organizationId: string,
    platforms: string[],
  ): Promise<void> {
    // Server-side validation â€” never trust client
    if (platforms.length !== 2) {
      throw new ForbiddenException(
        'Exactly 2 platforms must be selected for the Free plan.',
      );
    }

    const unique = [...new Set(platforms)];
    if (unique.length !== 2) {
      throw new ForbiddenException('Selected platforms must be unique.');
    }

    for (const p of platforms) {
      if (!isValidVaultPlatformId(p)) {
        throw new ForbiddenException(
          `Invalid platform: "${p}". Must be one of the 11 WITHUS Vault platforms.`,
        );
      }
    }

    const lockedUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days

    await this.prisma.subscription.update({
      where: { organizationId },
      data: {
        selectedPlatforms: platforms,
        selectionLockedUntil: lockedUntil,
        complianceState: 'COMPLIANT',
      },
    });

    this.logger.log(
      `[ENTITLEMENT] Org ${organizationId}: platform selection confirmed [${platforms.join(', ')}], locked until ${lockedUntil.toISOString()}`,
    );
  }
}
