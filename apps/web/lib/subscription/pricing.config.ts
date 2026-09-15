/**
 * WITHUS Pricing Configuration — Single Source of Truth
 *
 * ALL pricing values, limits, and feature entitlements are defined here.
 * No price, limit, or feature flag should be hardcoded in UI components.
 *
 * To update pricing later from admin/backend:
 *   - In Phase 1: modify this file.
 *   - In Phase 2: replace this static config with an API-fetched config
 *     without changing any billing calculation or UI component logic.
 *
 * CONFIRMED PRICING (as of client approval 2026-09-02):
 *   Free:     ₹0 / 2 users / any 2 of 10 platforms
 *   Pro:      ₹499/month | ₹4,990/year / 5 users / ₹50 extra/month | ₹500 extra/year
 *   Business: ₹1,999/month | ₹19,990/year / 15 users / ₹50 extra/month | annual extra TBD
 *
 * PENDING:
 *   businessAnnualExtraUserRate — client has NOT confirmed this value yet.
 *   Set to null until explicitly confirmed. Do NOT invent a value.
 *
 * Platform counts:
 *   10 supported platforms = product pricing concept
 *   (GitHub, Vercel, GoDaddy, LinkedIn, Shopify, Stripe, Razorpay, MCA, GST, Udyam)
 *   These are separate from the 3 backend integration adapters currently implemented.
 */

import type { PlanFeatures } from './types';

// ─── Plan Pricing ─────────────────────────────────────────────────────────────

export const PRICING_CONFIG = {
  FREE: {
    /** Base monthly price in INR (₹) */
    baseMonthly: 0,
    /** Base annual price in INR (₹) */
    baseAnnual: 0,
    /** Users included in base price */
    baseUsers: 2,
    /** Additional user price per month (Free plan has no extras) */
    extraUserMonthly: null as null,
    /** Additional user price per year (Free plan has no extras) */
    extraUserAnnual: null as null,
  },

  PRO: {
    baseMonthly: 499,
    baseAnnual: 4990,
    baseUsers: 5,
    /** ₹50 per additional user per month */
    extraUserMonthly: 50,
    /** ₹500 per additional user per year (2 months free vs monthly) */
    extraUserAnnual: 500,
  },

  BUSINESS: {
    baseMonthly: 1999,
    baseAnnual: 19990,
    baseUsers: 15,
    /** ₹50 per additional user per month */
    extraUserMonthly: 50,
    /**
     * Annual extra-user rate: PENDING client confirmation.
     * Do NOT assume ₹500 or ₹600 — keep null until confirmed.
     */
    extraUserAnnual: null as null | number,
  },
} as const;

// ─── Platform Configuration ───────────────────────────────────────────────────

/**
 * Total supported platforms in the WITHUS product.
 * This is a PRODUCT concept, not the count of backend integration adapters.
 *
 * The 11 platforms supported by the WITHUS extension (platform-reconciliation confirmed 2026-09-15):
 * GitHub, Vercel, GoDaddy, LinkedIn, Shopify, Stripe, Razorpay, MCA Portal, GST Portal, Udyam Portal, Gmail
 *
 * Gmail was added as the 11th platform (OAuth/extension autofill support confirmed).
 */
export const TOTAL_PLATFORM_COUNT = 11;

export const PLATFORM_NAMES: Record<string, string> = {
  GITHUB: 'GitHub',
  VERCEL: 'Vercel',
  GODADDY: 'GoDaddy',
  LINKEDIN: 'LinkedIn',
  SHOPIFY: 'Shopify',
  STRIPE: 'Stripe',
  RAZORPAY: 'Razorpay',
  MCA: 'MCA Portal',
  GST: 'GST Portal',
  UDYAM: 'Udyam Portal',
  GMAIL: 'Gmail',
};

// ─── Free Plan Platform Restriction ──────────────────────────────────────────

export const FREE_PLAN_CONFIG = {
  /** Max platforms accessible on Free plan */
  platformLimit: 2,
  /**
   * Days before a platform selection can be changed.
   * Phase 1: stored in config only.
   * Phase 2: enforced via platformSelectedAt timestamp in Organization.settings.
   */
  platformCooldownDays: 15,
};

// ─── Feature Matrix ───────────────────────────────────────────────────────────

/**
 * Feature entitlement matrix per plan.
 * These are product features — completely separate from RBAC permissions.
 * Do NOT use these to gate organization actions or modify permissions.ts.
 */
export const PLAN_FEATURES: Record<'FREE' | 'PRO' | 'BUSINESS', PlanFeatures> = {
  FREE: {
    platformLimit: FREE_PLAN_CONFIG.platformLimit,
    userLimit: PRICING_CONFIG.FREE.baseUsers,
    adminLimit: 1,
    platformCooldownDays: FREE_PLAN_CONFIG.platformCooldownDays,
    otpFetching: false,
    moduleBasedControl: false,
    auditHistory: 'BASIC',
    integrationHealthMonitoring: false,
    prioritySupport: false,
  },
  PRO: {
    platformLimit: TOTAL_PLATFORM_COUNT,
    userLimit: PRICING_CONFIG.PRO.baseUsers,
    adminLimit: 2,
    platformCooldownDays: 0,
    otpFetching: true,
    moduleBasedControl: false,
    auditHistory: 'FULL',
    integrationHealthMonitoring: true,
    prioritySupport: true,
  },
  BUSINESS: {
    platformLimit: TOTAL_PLATFORM_COUNT,
    userLimit: PRICING_CONFIG.BUSINESS.baseUsers,
    adminLimit: null, // Unlimited
    platformCooldownDays: 0,
    otpFetching: true,
    moduleBasedControl: true,
    auditHistory: 'ADVANCED',
    integrationHealthMonitoring: true,
    prioritySupport: true,
  },
};

// ─── Display Helpers ──────────────────────────────────────────────────────────

/** Currency symbol for display */
export const CURRENCY_SYMBOL = '₹';

/** Annual billing savings label */
export const ANNUAL_SAVINGS_LABEL = '2 months free';
