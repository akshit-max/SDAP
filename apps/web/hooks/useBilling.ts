'use client';
import { useState, useEffect, useCallback } from 'react';
import { billingApi } from '../lib/api/billing';
import type { SubscriptionStatusResponse, PlanTier, BillingCycle } from '../lib/api/billing';

/**
 * useOrgSubscription
 *
 * Fetches and returns the organization's current subscription status.
 * Returns null subscription if the org is on FREE plan (no DB row).
 * Refreshes when orgId changes.
 */
export function useOrgSubscription(orgId: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false); // true only after first real fetch with an orgId
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) {
      // No orgId yet — stay in loading state; don't mark as initialized
      setLoading(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await billingApi.getStatus(orgId);
      // If no subscription row, default to FREE
      setSubscription(data ?? { plan: 'FREE', billingCycle: 'MONTHLY', status: 'FREE' });
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to load subscription');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [orgId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { subscription, loading, initialized, error, refresh };
}

/**
 * useInitiatePayment
 *
 * Handles the payment initiation flow:
 * 1. Calls POST /billing/initiate with plan + billing cycle
 * 2. Redirects the browser to the HDFC payment link
 *
 * Security: the backend calculates the actual amount — we only send plan/cycle.
 */
export function useInitiatePayment(orgId: string | null) {
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiate = useCallback(
    async (plan: PlanTier, billingCycle: BillingCycle) => {
      if (!orgId) return;
      setInitiating(true);
      setError(null);
      try {
        const result = await billingApi.initiatePayment(orgId, plan, billingCycle);
        console.log('Initiate Payment Result:', result);
        // Redirect customer to HDFC checkout
        if (result && result.paymentLink) {
          window.location.href = result.paymentLink;
        } else {
          console.error('No payment link found in result!', result);
          setError('Could not get payment link from server.');
        }
      } catch (err: unknown) {
        setError((err as Error).message ?? 'Failed to initiate payment');
        setInitiating(false);
      }
      // Note: do not setInitiating(false) on success — browser is navigating away
    },
    [orgId],
  );

  return { initiate, initiating, error };
}

/**
 * useCancelSubscription
 *
 * Handles cancellation — marks subscription as CANCELLED.
 * Service continues until currentPeriodEnd.
 */
export function useCancelSubscription(orgId: string | null) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(
    async (reason?: string): Promise<SubscriptionStatusResponse | null> => {
      if (!orgId) return null;
      setCancelling(true);
      setError(null);
      try {
        const result = await billingApi.cancelSubscription(orgId, reason);
        return result;
      } catch (err: unknown) {
        setError((err as Error).message ?? 'Failed to cancel subscription');
        return null;
      } finally {
        setCancelling(false);
      }
    },
    [orgId],
  );

  return { cancel, cancelling, error };
}

/**
 * useComplianceStatus
 *
 * Fetches the compliance status for an org.
 * Returns complianceState, selectedPlatforms, selectionLockedUntil, plan,
 * activeUserCount, and userLimit.
 *
 * Used by:
 *  - ComplianceGate (platform selection gate)
 *  - DowngradeCleanupBanner (over-limit downgrade cleanup)
 *
 * Both read-only, no mutations.
 */
export function useComplianceStatus(orgId: string | null) {
  const [status, setStatus] = useState<import('../lib/api/billing').ComplianceStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await (await import('../lib/api/billing')).billingApi.getComplianceStatus(orgId);
      setStatus(data);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Failed to load compliance status');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { status, loading, error, refresh };
}
