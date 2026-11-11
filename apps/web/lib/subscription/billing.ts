/**
 * WITHUS Billing Calculator
 *
 * Pure functions for calculating subscription amounts.
 * No side effects. No API calls. No React. Testable in isolation.
 *
 * Pricing logic (client-approved 2026-09-02):
 *
 *   PRO Monthly:  ₹499 + ₹50 × max(0, activeUsers − 5)
 *   PRO Annual:   ₹4,990 + ₹500 × max(0, activeUsers − 5)
 *
 *   BUSINESS Monthly:  ₹999 + ₹50 × max(0, activeUsers − 15)
 *   BUSINESS Annual:   ₹9,990 + TBD × max(0, activeUsers − 15)
 *                      → returns null until extra rate is confirmed
 *
 *   FREE: always ₹0. Extra users not allowed.
 *
 * Active user definition:
 *   OrganizationMember records where removedAt IS NULL.
 *   Admins (OWNER, ADMIN) ARE included in the total count.
 */

import { PRICING_CONFIG } from './pricing.config';
import type { BillingCalculation, BillingCycle, PlanTier } from './types';

// ─── Core Calculators ─────────────────────────────────────────────────────────

/**
 * Calculate monthly subscription price for given plan and active user count.
 * Returns the total INR amount.
 */
export function calculateMonthlyPrice(
  plan: PlanTier,
  activeUsers: number,
): number {
  const config = PRICING_CONFIG[plan];

  if (plan === 'FREE') return 0;

  const extraUsers = Math.max(0, activeUsers - config.baseUsers);
  const extraRate = config.extraUserMonthly ?? 0;

  return config.baseMonthly + extraRate * extraUsers;
}

/**
 * Calculate annual subscription price for given plan and active user count.
 * Returns null if extra-user annual rate is not yet defined (Business annual).
 */
export function calculateAnnualPrice(
  plan: PlanTier,
  activeUsers: number,
): number | null {
  const config = PRICING_CONFIG[plan];

  if (plan === 'FREE') return 0;

  const extraUsers = Math.max(0, activeUsers - config.baseUsers);

  // If extra users needed and rate is undefined, return null (TBD)
  if (extraUsers > 0 && config.extraUserAnnual === null) {
    return null;
  }

  const extraRate = (config.extraUserAnnual ?? 0) as number;
  return config.baseAnnual + extraRate * extraUsers;
}

/**
 * Full billing calculation breakdown for a given plan, cycle, and user count.
 * Use this for displaying itemized pricing in the UI.
 */
export function getBillingCalculation(
  plan: PlanTier,
  billingCycle: BillingCycle,
  activeUsers: number,
): BillingCalculation {
  const config = PRICING_CONFIG[plan];
  const basePrice =
    billingCycle === 'MONTHLY' ? config.baseMonthly : config.baseAnnual;
  const extraUsers = plan === 'FREE' ? 0 : Math.max(0, activeUsers - config.baseUsers);

  let extraUserRate: number | null = null;
  let extraUsersCharge: number | null = null;
  let totalAmount: number | null = null;

  if (plan !== 'FREE') {
    extraUserRate =
      billingCycle === 'MONTHLY'
        ? (config.extraUserMonthly ?? null)
        : (config.extraUserAnnual ?? null);

    if (extraUserRate !== null) {
      extraUsersCharge = extraUserRate * extraUsers;
      totalAmount = basePrice + extraUsersCharge;
    } else if (extraUsers === 0) {
      // No extra users — rate undefined doesn't matter
      extraUsersCharge = 0;
      totalAmount = basePrice;
    }
    // else: extraUsers > 0 and rate is null → totalAmount stays null (TBD)
  } else {
    extraUsersCharge = 0;
    totalAmount = 0;
  }

  return {
    plan,
    billingCycle,
    activeUsers,
    basePrice,
    extraUsers,
    extraUserRate,
    extraUsersCharge,
    totalAmount,
    currency: 'INR',
  };
}

// ─── Display Formatters ───────────────────────────────────────────────────────

/**
 * Format an INR amount for display: ₹1,999 or ₹19,990
 */
export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Format a monthly amount with period label: ₹649/month
 */
export function formatMonthly(amount: number): string {
  return `${formatINR(amount)}/month`;
}

/**
 * Format an annual amount with period label: ₹6,490/year
 */
export function formatAnnual(amount: number): string {
  return `${formatINR(amount)}/year`;
}

// ─── Verification Examples (matches client spec exactly) ──────────────────────

/*
  Verified against client-approved examples:

  Pro Monthly:
    5 users  → ₹499 + ₹50×0 = ₹499  ✓
    6 users  → ₹499 + ₹50×1 = ₹549  ✓
    8 users  → ₹499 + ₹50×3 = ₹649  ✓

  Pro Annual:
    5 users  → ₹4,990 + ₹500×0 = ₹4,990  ✓
    6 users  → ₹4,990 + ₹500×1 = ₹5,490  ✓
    8 users  → ₹4,990 + ₹500×3 = ₹6,490  ✓

  Business Monthly:
    15 users → ₹999 + ₹50×0  = ₹999   ✓
    16 users → ₹999 + ₹50×1  = ₹1,049 ✓

  Business Annual extra: null until confirmed  ✓
*/
