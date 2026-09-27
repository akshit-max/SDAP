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

export type ComplianceState =
  | 'COMPLIANT'
  | 'PLATFORM_SELECTION_REQUIRED'
  | 'TEAM_CLEANUP_REQUIRED'
  | 'UPGRADE_PROMPT';

export const WITHUS_VAULT_PLATFORMS = [
  'GITHUB', 'VERCEL', 'GODADDY', 'LINKEDIN', 'SHOPIFY',
  'STRIPE', 'RAZORPAY', 'MCA', 'GST', 'UDYAM', 'GMAIL',
] as const;
export type VaultPlatformId = typeof WITHUS_VAULT_PLATFORMS[number];

export const PLATFORM_LABELS: Record<VaultPlatformId, string> = {
  GITHUB: 'GitHub',
  VERCEL: 'Vercel',
  GODADDY: 'GoDaddy',
  LINKEDIN: 'LinkedIn',
  SHOPIFY: 'Shopify',
  STRIPE: 'Stripe',
  RAZORPAY: 'Razorpay',
  MCA: 'MCA Portal',
  GST: 'GST Portal',
  UDYAM: 'Udyam',
  GMAIL: 'Gmail',
};

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

export interface ComplianceStatusResponse {
  complianceState: ComplianceState;
  selectedPlatforms: string[];
  selectionLockedUntil: string | null;
  plan: PlanTier;
  /** Number of currently active (non-removed) members in the org. */
  activeUserCount: number;
  /** Maximum members allowed by the effective plan (2 / 5 / 15). */
  userLimit: number;
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
    // NestJS returns the object directly, not wrapped in a data field.
    // However, if the subscription is totally null (e.g., 204 No Content), response.data might be empty.
    if (!response.data) return null;
    return response.data;
  },

  /**
   * Fetch the compliance status for a FREE org.
   * Returns complianceState, selectedPlatforms, and plan.
   * PRO/BUSINESS orgs always return COMPLIANT.
   */
  getComplianceStatus: async (orgId: string): Promise<ComplianceStatusResponse> => {
    const response = await apiClient.get(`/organizations/${orgId}/billing/compliance`);
    return response.data;
  },

  /**
   * Submit exactly 2 platform selections for a FREE org.
   * Sets complianceState=COMPLIANT and locks the selection for 15 days.
   */
  confirmPlatformSelection: async (orgId: string, platforms: string[]): Promise<void> => {
    await apiClient.post(`/organizations/${orgId}/billing/compliance/confirm`, { platforms });
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
    return response.data;
  },

  /**
   * Cancel the organization's subscription.
   * Service continues until the current period ends.
   */
  cancelSubscription: async (orgId: string, reason?: string): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient.post(`/organizations/${orgId}/billing/cancel`, {
      reason: reason ?? 'User requested cancellation',
    });
    return response.data;
  },
};
