import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { PlanTier } from '@prisma/client';

/**
 * EntitlementService
 *
 * Single source of truth for "what plan does this org have?"
 * Used by any module needing to gate features on subscription status.
 *
 * Rule: if subscription row is absent, null, FREE, EXPIRED, or CANCELLED-past-period-end
 * → org is on FREE plan. We never trust the client-sent plan.
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
}
