import type { BillingCycle, PlanTier } from '@prisma/client';

export class InitiateBillingDto {
  plan!: PlanTier;
  billingCycle!: BillingCycle;

  /**
   * Customer's billing phone number for HDFC mandate registration.
   * If omitted, will be loaded from organization.settings.billingPhone.
   * Must be exactly 10 digits. Validated in BillingService.
   */
  phone?: string;
}

export class CancelSubscriptionDto {
  reason?: string;
}
