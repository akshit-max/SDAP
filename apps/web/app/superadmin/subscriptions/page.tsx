'use client';

import React from 'react';
import { CreditCard, TrendingUp, TrendingDown, Users, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';

function ComingSoonCard({
  icon: Icon,
  title,
  subtitle,
  badge = 'Coming Soon',
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="premium-card p-5 flex flex-col items-center justify-center text-center space-y-3 min-h-[130px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
      <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs font-bold text-premium-main">{title}</p>
        {subtitle && <p className="text-[10px] text-premium-muted mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        {badge}
      </span>
    </div>
  );
}

function ComingSoonChart({ title, description }: { title: string; description: string }) {
  return (
    <div className="premium-card p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[200px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs font-bold text-premium-main">{title}</p>
        <p className="text-[10px] text-premium-muted mt-1 leading-relaxed max-w-xs">{description}</p>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        Coming Soon
      </span>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-premium-main flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Subscriptions & Revenue
        </h2>
        <p className="text-[11px] text-premium-muted mt-0.5">Plans, billing, revenue analytics, and churn monitoring</p>
      </div>

      {/* Billing Integration Notice */}
      <div className="premium-card p-5 border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
              💳 Billing Integration Required
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              Subscription and revenue analytics will appear here once the payment gateway and subscription infrastructure are connected.
              This module is fully structured and ready to receive billing data — no redesign will be needed after integration.
            </p>
          </div>
        </div>
      </div>

      {/* Plans Overview — All KPIs Coming Soon */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Plans Overview</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <ComingSoonCard icon={Users} title="Free Organisations" subtitle="Count of organisations on the Free plan" />
          <ComingSoonCard icon={Users} title="Pro Organisations" subtitle="Count of organisations on the Pro plan" />
          <ComingSoonCard icon={DollarSign} title="MRR" subtitle="Monthly Recurring Revenue" />
          <ComingSoonCard icon={DollarSign} title="ARR" subtitle="Annual Recurring Revenue" />
        </div>
      </div>

      {/* Customer Activity */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Customer Activity</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <ComingSoonCard icon={TrendingUp} title="New Subscriptions" subtitle="New paid customers this period" />
          <ComingSoonCard icon={RefreshCw} title="Upgrades" subtitle="Free → Pro upgrades this period" />
          <ComingSoonCard icon={TrendingDown} title="Downgrades" subtitle="Pro → Free downgrades" />
          <ComingSoonCard icon={AlertCircle} title="Cancellations" subtitle="Subscription cancellations" />
        </div>
      </div>

      {/* Revenue Metrics */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Revenue Metrics</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <ComingSoonCard icon={TrendingDown} title="Churn Rate" subtitle="% of customers lost this period" />
          <ComingSoonCard icon={DollarSign} title="ARPO" subtitle="Average Revenue Per Organisation" />
          <ComingSoonCard icon={TrendingUp} title="Net Revenue Retention" subtitle="Revenue retained after churn" />
          <ComingSoonCard icon={RefreshCw} title="Lifetime Value" subtitle="Estimated customer LTV" />
        </div>
      </div>

      {/* Charts — All Coming Soon */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Revenue Analytics</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ComingSoonChart
            title="MRR Growth"
            description="Monthly Recurring Revenue trend over time. Available after billing gateway integration."
          />
          <ComingSoonChart
            title="Free → Pro Conversion"
            description="Conversion rate from Free to Pro plan over time. Available after billing integration."
          />
          <ComingSoonChart
            title="Organisation Churn"
            description="Monthly churn rate and churned organisations. Available after subscription lifecycle tracking is implemented."
          />
          <ComingSoonChart
            title="Subscription Timeline"
            description="New subscriptions, upgrades, downgrades, and cancellations over time."
          />
        </div>
      </div>

      {/* Billing Management Table */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Customers</p>
        <div className="premium-card p-8 flex flex-col items-center justify-center text-center space-y-3 border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-premium-main">Customer Billing Table</p>
            <p className="text-[10px] text-premium-muted mt-1 leading-relaxed max-w-sm">
              Organisation plan status, renewal dates, payment status, and billing history will appear here after payment gateway integration.
            </p>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Billing Integration Required
          </span>
        </div>
      </div>
    </div>
  );
}
