'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuth } from '../../lib/auth/AuthContext';
import { useOrgMembers } from '../../hooks/useOrganization';
import {
  Check,
  X,
  CreditCard,
  Users,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  PRICING_CONFIG,
  PLAN_FEATURES,
  TOTAL_PLATFORM_COUNT,
  CURRENCY_SYMBOL,
  ANNUAL_SAVINGS_LABEL,
} from '../../lib/subscription/pricing.config';
import {
  getBillingCalculation,
  formatINR,
  formatMonthly,
  formatAnnual,
} from '../../lib/subscription/billing';
import type { BillingCycle, PlanTier } from '../../lib/subscription/types';
import { useOrgSubscription, useInitiatePayment, useCancelSubscription } from '../../hooks/useBilling';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

// ─── Feature Matrix Value Renderer ───────────────────────────────────────────

type FeatureValue = boolean | string | number | null;

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <Check className="w-3 h-3 stroke-[3]" />
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600">
        <X className="w-3 h-3 stroke-[2.5]" />
      </span>
    );
  return (
    <span className="text-[11px] font-bold text-premium-main tracking-tight font-number">
      {String(value ?? '—')}
    </span>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan, currentPlan }: { plan: PlanTier; currentPlan: PlanTier }) {
  if (plan !== currentPlan) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Current Plan
    </span>
  );
}

// ─── Main Pricing Page Component ──────────────────────────────────────────────

export default function PricingPage() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const { data: membersData } = useOrgMembers(orgId);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [showFeatureMatrix, setShowFeatureMatrix] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { toast } = useToast();

  // Active users = members where removedAt IS NULL (admins included)
  const activeUsers: number = Array.isArray(membersData)
    ? membersData.filter((m: any) => !m.removedAt).length
    : 1;

  const { subscription, loading: subLoading, refresh: refreshSub } = useOrgSubscription(orgId);
  const { initiate, initiating } = useInitiatePayment(orgId);
  const { cancel, cancelling } = useCancelSubscription(orgId);

  // Detect HDFC redirect result from URL params and refetch subscription
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const status = params.get('status');

    if (success === 'true') {
      toast('success', '✅ Payment successful! Your plan has been upgraded.');
      // Refetch subscription from backend to reflect new plan
      void refreshSub();
      // Clean URL
      window.history.replaceState({}, '', '/pricing');
    } else if (error) {
      const messages: Record<string, string> = {
        payment_failed: 'Payment failed or was declined. Please try again.',
        payment_not_found: 'Payment record not found. Please contact support.',
        internal_error: 'An internal error occurred. Please contact support.',
      };
      toast('error', `❌ ${messages[error] ?? 'Payment could not be processed.'}`);
      window.history.replaceState({}, '', '/pricing');
    } else if (status === 'pending') {
      toast('info', '⏳ Payment is being processed. Your plan will update shortly.');
      window.history.replaceState({}, '', '/pricing');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a toast message if the subscription has expired
  React.useEffect(() => {
    if (subscription?.status === 'EXPIRED') {
      toast('error', 'Your premium subscription has expired. You have been switched to the Free tier.');
    }
  }, [subscription?.status, toast]);

  // Determine effective plan and cycle based on status
  // If the plan is CANCELLED, we 'reset' the currentPlan to FREE in the UI
  // so the user can freely upgrade/resubscribe, even though the backend maintains the grace period.
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'PAST_DUE';
  const currentPlan: PlanTier = isActive ? subscription.plan : 'FREE';
  const currentBillingCycle: BillingCycle = isActive ? subscription.billingCycle : 'MONTHLY';

  const billing = {
    FREE: getBillingCalculation('FREE', billingCycle, activeUsers),
    PRO: getBillingCalculation('PRO', billingCycle, activeUsers),
    BUSINESS: getBillingCalculation('BUSINESS', billingCycle, activeUsers),
  };


  // ─── Categorized Feature Matrix ─────────────────────────────────────────────

  const featureSections: Array<{
    category: string;
    rows: Array<{
      label: string;
      free: FeatureValue;
      pro: FeatureValue;
      business: FeatureValue;
    }>;
  }> = [
    {
      category: 'Capacity & Pricing',
      rows: [
        {
          label: 'Included Base Users',
          free: `${PRICING_CONFIG.FREE.baseUsers} users`,
          pro: `${PRICING_CONFIG.PRO.baseUsers} users`,
          business: `${PRICING_CONFIG.BUSINESS.baseUsers} users`,
        },
        {
          label: 'Supported Platform Accounts',
          free: `2 of ${TOTAL_PLATFORM_COUNT} platforms`,
          pro: `All ${TOTAL_PLATFORM_COUNT} platforms`,
          business: `All ${TOTAL_PLATFORM_COUNT} platforms`,
        },
        {
          label: 'Extra User Billing Rate',
          free: 'Not allowed',
          pro: `${CURRENCY_SYMBOL}${PRICING_CONFIG.PRO.extraUserMonthly}/user/mo`,
          business: `${CURRENCY_SYMBOL}${PRICING_CONFIG.BUSINESS.extraUserMonthly}/user/mo`,
        },
        {
          label: 'Max Admin Slots Allowed',
          free: `${PLAN_FEATURES.FREE.adminLimit} admin`,
          pro: `${PLAN_FEATURES.PRO.adminLimit} admins`,
          business: 'Unlimited',
        },
      ],
    },
    {
      category: 'Core Security & Automation',
      rows: [
        {
          label: 'Automated OTP Retrieval (Gmail)',
          free: false,
          pro: true,
          business: true,
        },
        {
          label: 'Granular Module-Based Access Control',
          free: false,
          pro: false,
          business: true,
        },
        {
          label: 'Platform Integration Health Checks',
          free: false,
          pro: true,
          business: true,
        },
        {
          label: 'Audit Trail & Event Logging',
          free: 'Basic (Recent)',
          pro: 'Full History',
          business: 'Advanced & Exportable',
        },
      ],
    },
    {
      category: 'Governance & Operations',
      rows: [
        {
          label: 'Platform Selection Change Cooldown',
          free: `${PLAN_FEATURES.FREE.platformCooldownDays} Days`,
          pro: 'Instant (0 Days)',
          business: 'Instant (0 Days)',
        },
        {
          label: 'Dedicated Priority Support',
          free: false,
          pro: true,
          business: true,
        },
      ],
    },
  ];

  // ─── Plan Cards Metadata ───────────────────────────────────────────────────

  const plans: Array<{
    id: PlanTier;
    name: string;
    icon: React.ReactNode;
    tagline: string;
    highlighted: boolean;
    badgeText?: string;
  }> = [
    {
      id: 'FREE',
      name: 'Free',
      icon: <Shield className="w-5 h-5" />,
      tagline: 'Essential access delegation for small teams',
      highlighted: false,
    },
    {
      id: 'PRO',
      name: 'Pro',
      icon: <Zap className="w-5 h-5" />,
      tagline: 'Advanced automation & scaling team access',
      highlighted: true,
      badgeText: 'MOST POPULAR',
    },
    {
      id: 'BUSINESS',
      name: 'Business',
      icon: <Building2 className="w-5 h-5" />,
      tagline: 'Complete module control & priority ops',
      highlighted: false,
    },
  ];

  return (
    <DashboardShell>
      <div className="flex flex-col h-full overflow-y-auto bg-[#f5f5f7] dark:bg-[#09090b]">
        <div className="max-w-6xl mx-auto w-full px-6 py-8 space-y-8">

          {/* ─── Hero Header & Status Banner ─────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-premium pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-premium-muted">
                  Billing & Organization Plans
                </span>
              </div>
              <h1 className="text-2xl font-black text-premium-main tracking-tight font-number">
                Subscription & Pricing
              </h1>
              <p className="text-xs text-premium-muted font-medium max-w-xl">
                Scale your security infrastructure with flexible per-user billing. Seamlessly upgrade or adjust capacity at any time.
              </p>
            </div>



            {/* Active Seats Summary Card */}
            <div className="flex items-center gap-4 px-4 py-3 bg-premium-surface border border-premium shadow-sm rounded-none">
              <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Active Org Seats</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 text-premium-main font-number">
                    {activeUsers}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-premium-main font-number mt-0.5">
                  {activeUsers} Member{activeUsers !== 1 ? 's' : ''} <span className="text-[10px] font-semibold text-premium-muted">(incl. Admins)</span>
                </p>
              </div>
            </div>
          </div>

          {/* ─── Billing Cycle Segmented Switcher ─────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-premium-surface border border-premium p-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-premium-muted" />
              <span className="text-xs font-bold text-premium-main">Billing Cadence</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-900 border border-premium rounded-none">
                <button
                  type="button"
                  onClick={() => setBillingCycle('MONTHLY')}
                  className={`px-4 py-1.5 text-xs font-extrabold transition-all ${
                    billingCycle === 'MONTHLY'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'text-premium-muted hover:text-premium-main'
                  }`}
                  id="billing-cycle-monthly"
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('ANNUAL')}
                  className={`px-4 py-1.5 text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    billingCycle === 'ANNUAL'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'text-premium-muted hover:text-premium-main'
                  }`}
                  id="billing-cycle-annual"
                >
                  <span>Annual Billing</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white dark:bg-emerald-600 rounded-none">
                    Save 17%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Plan Tier Cards Grid ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const calc = billing[plan.id];
              const isCurrent = plan.id === currentPlan && billingCycle === currentBillingCycle;
              const isOnDifferentCycleOfSamePlan = plan.id === currentPlan && billingCycle !== currentBillingCycle;
              const hasActiveSubscription = currentPlan !== 'FREE';
              const isHighlighted = plan.highlighted;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-premium-surface border transition-all duration-200 ${
                    isHighlighted
                      ? 'border-zinc-900 dark:border-zinc-100 shadow-xl ring-1 ring-zinc-900 dark:ring-zinc-100'
                      : 'border-premium hover:border-zinc-400 dark:hover:border-zinc-700 shadow-sm'
                  }`}
                  id={`plan-card-${plan.id.toLowerCase()}`}
                >
                  {/* Highlight Banner */}
                  {plan.badgeText && (
                    <div className="w-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-black uppercase tracking-widest py-1 text-center font-number">
                      {plan.badgeText}
                    </div>
                  )}

                  <div className="p-6 flex flex-col justify-between flex-1 gap-6">
                    {/* Header & Title */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-sm ${
                            isHighlighted 
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' 
                              : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                          }`}>
                            {plan.icon}
                          </div>
                          <h3 className="text-base font-black text-premium-main tracking-tight font-number">
                            {plan.name}
                          </h3>
                        </div>
                        <PlanBadge plan={plan.id} currentPlan={currentPlan} />
                      </div>
                      <p className="text-[11px] font-semibold text-premium-muted leading-relaxed">
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Price Section */}
                    <div className="space-y-2 py-3 border-y border-premium">
                      {calc.totalAmount === null ? (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-premium-main font-number tracking-tight">
                              {formatINR(calc.basePrice)}
                            </span>
                            <span className="text-xs font-extrabold text-premium-muted">
                              /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Annual extra-user rate pending confirmation
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-premium-main font-number tracking-tight">
                              {formatINR(calc.totalAmount)}
                            </span>
                            <span className="text-xs font-extrabold text-premium-muted">
                              /{billingCycle === 'MONTHLY' ? 'month' : 'year'}
                            </span>
                          </div>
                          {plan.id !== 'FREE' && (
                            <p className="text-[10px] font-bold text-premium-muted mt-1 font-number">
                              Base: {billingCycle === 'MONTHLY' ? formatMonthly(calc.basePrice) : formatAnnual(calc.basePrice)}
                              {' · '}Includes {PRICING_CONFIG[plan.id].baseUsers} users
                            </p>
                          )}
                        </div>
                      )}

                      {/* Extra User Itemized Calculation Pill */}
                      {calc.extraUsers > 0 && (
                        <div className="p-2.5 bg-zinc-100/70 dark:bg-zinc-900/80 border border-premium space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-black text-premium-main">
                            <span>Extra Users ({calc.extraUsers})</span>
                            <span className="font-number">
                              +{calc.extraUsersCharge !== null ? formatINR(calc.extraUsersCharge) : 'TBD'}
                            </span>
                          </div>
                          <p className="text-[9px] font-semibold text-premium-muted">
                            {calc.extraUsers} user{calc.extraUsers > 1 ? 's' : ''} above {PRICING_CONFIG[plan.id].baseUsers} base limit @ {calc.extraUserRate !== null ? formatINR(calc.extraUserRate) : 'TBD'}/user
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Features Checklist */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-premium-muted">
                        Key Entitlements
                      </span>
                      <ul className="space-y-2 text-[11px] font-semibold text-premium-main">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>
                            <strong>{PRICING_CONFIG[plan.id].baseUsers} Active Users</strong> Included
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>
                            {plan.id === 'FREE'
                              ? `Select any ${PLAN_FEATURES.FREE.platformLimit} of ${TOTAL_PLATFORM_COUNT} platforms`
                              : `Access all ${TOTAL_PLATFORM_COUNT} supported platforms`}
                          </span>
                        </li>
                        {plan.id !== 'FREE' && (
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>
                              Extra Seats @ {CURRENCY_SYMBOL}{PRICING_CONFIG[plan.id as 'PRO' | 'BUSINESS'].extraUserMonthly}/user/mo
                            </span>
                          </li>
                        )}
                        {PLAN_FEATURES[plan.id].otpFetching && (
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Automated Gmail OTP Extraction</span>
                          </li>
                        )}
                        {PLAN_FEATURES[plan.id].moduleBasedControl && (
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Module-Level Element Redaction</span>
                          </li>
                        )}
                        {PLAN_FEATURES[plan.id].prioritySupport && (
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Priority Operations Support</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isCurrent ? (
                        <div className="flex flex-col gap-2">
                          <button
                            disabled={subscription?.status === 'ACTIVE' || initiating}
                            onClick={() => {
                              if (subscription?.status === 'PAST_DUE') {
                                void initiate(plan.id, billingCycle);
                              }
                            }}
                            className={`w-full py-2.5 px-4 text-xs font-black uppercase tracking-wider text-center transition-colors shadow-sm ${
                              subscription?.status === 'PAST_DUE' && !initiating
                                ? 'bg-rose-600 text-white hover:bg-rose-700 border border-transparent animate-pulse'
                                : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 border border-premium cursor-not-allowed'
                            }`}
                            id={`cta-current-${plan.id.toLowerCase()}`}
                          >
                            {initiating ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Processing...
                              </div>
                            ) : subscription?.status === 'PAST_DUE' ? (
                              'Retry Payment'
                            ) : (
                              'Active Subscription'
                            )}
                          </button>
                          {subscription?.currentPeriodEnd && subscription.status === 'ACTIVE' && (
                            <p className="text-[10px] font-bold text-center text-premium-muted">
                              {(() => {
                                const end = new Date(subscription.currentPeriodEnd);
                                const now = new Date();
                                const diffTime = end.getTime() - now.getTime();
                                const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                                return `Renews in ${daysLeft} days (${end.toLocaleDateString()})`;
                              })()}
                            </p>
                          )}
                        </div>
                      ) : isOnDifferentCycleOfSamePlan ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 text-xs font-black uppercase tracking-wider bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 border border-premium cursor-not-allowed text-center"
                          id={`cta-switch-cycle-${plan.id.toLowerCase()}`}
                        >
                          Active on {currentBillingCycle === 'MONTHLY' ? 'Monthly' : 'Annual'}
                        </button>
                      ) : plan.id === 'FREE' ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 text-xs font-extrabold text-premium-muted border border-premium cursor-not-allowed text-center"
                          id={`cta-downgrade-${plan.id.toLowerCase()}`}
                        >
                          Included Base Tier
                        </button>
                      ) : (
                        <button
                          disabled={initiating || calc.totalAmount === null || hasActiveSubscription}
                          onClick={() => {
                            if (plan.id === 'PRO' || plan.id === 'BUSINESS') {
                              void initiate(plan.id, billingCycle);
                            }
                          }}
                          className={`w-full py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            initiating || calc.totalAmount === null || hasActiveSubscription
                              ? 'opacity-50 cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                              : isHighlighted
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md hover:scale-[1.02]'
                                : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-premium hover:bg-zinc-200 dark:hover:bg-zinc-700'
                          }`}
                          id={`cta-upgrade-${plan.id.toLowerCase()}`}
                        >
                          {initiating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )}
                          <span>{hasActiveSubscription ? 'Requires Cancellation' : `Upgrade to ${plan.name}`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );

            })}
          </div>

          {/* ─── Subscription Status Banner ───────────────────────────────── */}
          {subscription && (subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE') && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-premium-main">Subscription Status: {subscription.status}</h4>
                  <p className="text-[11px] text-premium-muted font-medium mt-0.5">
                    Plan: {subscription.plan} | Cycle: {subscription.billingCycle}
                  </p>
                  {subscription.currentPeriodEnd && (
                    <p className="text-[10px] font-bold text-premium-muted mt-1">
                      {(() => {
                        const isPastDue = subscription.status === 'PAST_DUE';
                        const graceUntil = (subscription as any).graceUntil;
                        const targetDateStr = isPastDue && graceUntil ? graceUntil : subscription.currentPeriodEnd;
                        const end = new Date(targetDateStr);
                        const now = new Date();
                        const diffTime = end.getTime() - now.getTime();
                        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                        return `${isPastDue ? 'Grace period ends' : 'Renews'} in ${daysLeft} days (${end.toLocaleDateString()})`;
                      })()}
                    </p>
                  )}
                </div>
              </div>

              {/* Cancel Subscription Action */}
              {(subscription.status === 'ACTIVE' || subscription.status === 'PAST_DUE') && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={cancelling}
                  className="px-4 py-2 text-[11px] font-black uppercase tracking-wider text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-sm transition-colors flex items-center gap-2"
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  <span>Cancel Plan</span>
                </button>
              )}
            </div>
          )}

          {/* ─── Expandable Feature Comparison Table ───────────────────────────── */}
          <div className="bg-premium-surface border border-premium">
            <button
              type="button"
              className="w-full flex items-center justify-between px-6 py-4 border-b border-premium hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              onClick={() => setShowFeatureMatrix(v => !v)}
              id="feature-matrix-toggle"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-premium-muted" />
                <span className="text-xs font-black uppercase tracking-wider text-premium-main">
                  Detailed Feature Breakdown
                </span>
              </div>
              <div className="flex items-center gap-2 text-premium-muted text-xs font-semibold">
                <span>{showFeatureMatrix ? 'Collapse Table' : 'Expand Matrix'}</span>
                {showFeatureMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showFeatureMatrix && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" id="feature-comparison-table">
                  <thead>
                    <tr className="border-b border-premium bg-zinc-100/50 dark:bg-zinc-900/50">
                      <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-premium-muted w-5/12">
                        System Capability / Module
                      </th>
                      <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-wider text-premium-muted w-2/12">
                        Free
                      </th>
                      <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-800/50 w-2/12">
                        Pro
                      </th>
                      <th className="px-4 py-3.5 text-center text-[10px] font-black uppercase tracking-wider text-premium-muted w-3/12">
                        Business
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-premium">
                    {featureSections.map((section) => (
                      <React.Fragment key={section.category}>
                        <tr className="bg-zinc-100 dark:bg-zinc-900">
                          <td
                            colSpan={4}
                            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-premium-muted"
                          >
                            {section.category}
                          </td>
                        </tr>
                        {section.rows.map((row) => (
                          <tr key={row.label} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-6 py-3 text-[11px] font-bold text-premium-main">
                              {row.label}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <FeatureCell value={row.free} />
                            </td>
                            <td className="px-4 py-3 text-center bg-zinc-50/50 dark:bg-zinc-900/20">
                              <FeatureCell value={row.pro} />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <FeatureCell value={row.business} />
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── Platform Selection Policy & Billing Calculation Rules ───────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Free Plan Policy */}
            <div className="p-5 bg-premium-surface border border-premium space-y-2.5">
              <div className="flex items-center gap-2 text-premium-main">
                <AlertCircle className="w-4 h-4 text-premium-muted" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Free Tier Platform Selection Rule
                </h4>
              </div>
              <p className="text-[11px] font-medium text-premium-muted leading-relaxed">
                Free accounts can select any <strong className="text-premium-main">2 of {TOTAL_PLATFORM_COUNT} supported platforms</strong>. To prevent abuse, once selected, a platform can only be replaced after a <strong className="text-premium-main">{PLAN_FEATURES.FREE.platformCooldownDays}-day waiting period</strong>.
              </p>
            </div>

            {/* Automated Seat Recalculation Rules */}
            <div className="p-5 bg-premium-surface border border-premium space-y-2.5">
              <div className="flex items-center gap-2 text-premium-main">
                <Activity className="w-4 h-4 text-premium-muted" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Automated Seat Recalculation
                </h4>
              </div>
              <p className="text-[11px] font-medium text-premium-muted leading-relaxed">
                Subscription totals automatically adjust as active organization members are added or removed. All admins and owners count towards the total active seat count.
              </p>
            </div>
          </div>

          {/* ─── Cancel Plan Modal ──────────────────────────────────────────────── */}
          {showCancelModal && subscription && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
              <div className="bg-premium-surface border border-premium max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 pb-0 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-500/10 text-rose-600 rounded-full">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-premium-main tracking-tight">Cancel Subscription</h3>
                      <p className="text-xs font-semibold text-premium-muted mt-1">
                        Are you sure you want to cancel your {subscription.plan} plan?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-premium p-4 rounded-sm">
                    <p className="text-sm font-semibold text-premium-main">
                      Your subscription will remain active until the end of the current billing cycle.
                    </p>
                    {subscription.currentPeriodEnd && (
                      <div className="mt-3 flex items-center justify-between text-xs font-bold font-number">
                        <span className="text-premium-muted">Billing Cycle Ends:</span>
                        <span className="text-rose-600 dark:text-rose-400">
                          {(() => {
                            const end = new Date(subscription.currentPeriodEnd);
                            const now = new Date();
                            const diffTime = end.getTime() - now.getTime();
                            const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                            return `${daysLeft} days remaining (${end.toLocaleDateString()})`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-premium-muted font-medium">
                    After cancellation, your organization will be downgraded to the FREE tier, and excess users or platforms will lose access.
                  </p>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border-t border-premium flex justify-end gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                    className="px-4 py-2 text-xs font-bold text-premium-main hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-transparent rounded-sm"
                  >
                    Keep My Plan
                  </button>
                  <button
                    onClick={async () => {
                      await cancel();
                      void refreshSub();
                      setShowCancelModal(false);
                    }}
                    disabled={cancelling}
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 transition-colors rounded-sm flex items-center gap-2 shadow-sm"
                  >
                    {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardShell>
  );
}
