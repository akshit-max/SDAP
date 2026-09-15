import { apiClient } from './client';

// ─── Types (mirroring backend Prisma enums) ───────────────────────────────────

export type PlanTier = 'FREE' | 'PRO' | 'BUSINESS';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus =
  | 'FREE'
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED';

export interface SubscriptionStatusResponse {
  id?: string;
  plan: PlanTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelledAt?: string;
  failureCount?: number;
  graceUntil?: string;
}

export interface InitiatePaymentResponse {
  paymentLink: string;
  orderId: string;
}

// ─── API Client Functions ─────────────────────────────────────────────────────

export const billingApi = {
  /**
   * Fetch the subscription status for an organization.
   * Returns null subscription data if the org is on FREE plan (no DB row).
   */
  getStatus: async (orgId: string): Promise<SubscriptionStatusResponse | null> => {
    const response = await apiClient.get(`/organizations/${orgId}/billing/status`);
    return response.data?.data ?? null;
  },

  /**
   * Initiate a payment session. Returns a HDFC payment link.
   * The frontend redirects the customer to this link.
   * Amount is calculated server-side — client only sends plan and billing cycle.
   */
  initiatePayment: async (
    orgId: string,
    plan: PlanTier,
    billingCycle: BillingCycle,
  ): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/billing/initiate`, {
      plan,
      billingCycle,
    });
    return response.data?.data ?? response.data;
  },

  /**
   * Cancel the organization's subscription.
   * Service continues until the current period ends.
   */
  cancelSubscription: async (orgId: string, reason?: string): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/billing/cancel`, {
      reason: reason ?? 'User requested cancellation',
    });
    return response.data?.data ?? response.data;
  },
};
