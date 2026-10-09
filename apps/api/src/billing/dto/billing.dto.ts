import type { BillingCycle, PlanTier } from '@prisma/client';

export class InitiateBillingDto {
  plan!: PlanTier;
  billingCycle!: BillingCycle;

  /**
   * Customer's billing phone number for HDFC mandate registration.
   * Must be exactly 10 digits. Validated in BillingService.
   * Not persisted in the database — used only for the HDFC session request.
   */
  phone!: string;
}

export class CancelSubscriptionDto {
  reason?: string;
}
