import type { BillingCycle, PlanTier } from '@prisma/client';

export class InitiateBillingDto {
  plan!: PlanTier;
  billingCycle!: BillingCycle;
}

export class CancelSubscriptionDto {
  reason?: string;
}
