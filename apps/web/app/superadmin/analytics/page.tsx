'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { superAdminApi } from '../../../lib/api/superadmin';
import { BarChart3, RefreshCw, AlertTriangle, TrendingUp, Users, Zap, Clock, AlertCircle } from 'lucide-react';

function ComingSoonCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="premium-card p-5 flex flex-col items-center justify-center text-center space-y-2 min-h-[120px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs font-bold text-premium-main">{title}</p>
        {subtitle && <p className="text-[10px] text-premium-muted mt-0.5">{subtitle}</p>}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        Coming Soon
      </span>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  color = 'text-premium-main',
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  note?: string;
  color?: string;
}) {
  return (
    <div className="premium-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-400" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {note && <p className="text-[9px] text-premium-muted italic leading-relaxed">{note}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminApi.getProductAnalytics(days);
      setData(res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-premium-main flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Product Analytics
          </h2>
          <p className="text-[11px] text-premium-muted mt-0.5">Acquisition, activation, engagement, retention, and conversion</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs border border-premium rounded bg-premium-surface text-premium-main px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 premium-button-secondary py-1.5 px-3 text-xs font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="premium-card p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* Acquisition */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Acquisition</p>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="premium-card p-5 h-28 animate-pulse bg-zinc-100 dark:bg-zinc-800" />)
          ) : (
            <>
              <MetricCard
                icon={TrendingUp}
                label="New Organisations"
                value={data?.acquisition?.newOrgs ?? '—'}
                note={`Last ${days} days`}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <MetricCard
                icon={Users}
                label="New Users"
                value={data?.acquisition?.newUsers ?? '—'}
                note={`Last ${days} days`}
                color="text-blue-600 dark:text-blue-400"
              />
              <ComingSoonCard
                icon={TrendingUp}
                title="Registration Source"
                subtitle="Source tracking requires UTM parameters stored at registration"
              />
              <ComingSoonCard
                icon={TrendingUp}
                title="Referral"
                subtitle="Referral code tracking requires a referral system integrated at sign-up"
              />
              <ComingSoonCard
                icon={TrendingUp}
                title="Campaign Attribution"
                subtitle="Campaign tracking requires UTM parameter capture at registration"
              />
            </>
          )}
        </div>
      </div>

      {/* Activation */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Activation</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {loading ? (
            [0, 1, 2, 3].map((i) => <div key={i} className="premium-card p-5 h-28 animate-pulse bg-zinc-100 dark:bg-zinc-800" />)
          ) : (
            <>
              <MetricCard
                icon={Zap}
                label="Orgs with First Session"
                value={data?.activation?.orgsWithSession ?? '—'}
                note="Organisations that ran at least one delegated session"
                color="text-purple-600 dark:text-purple-400"
              />
              <MetricCard
                icon={Zap}
                label="Activation Rate"
                value={`${data?.activation?.activationRate ?? '—'}%`}
                note="Orgs with at least one session / total orgs"
              />
              <MetricCard
                icon={Zap}
                label="Orgs with Vault"
                value={data?.activation?.orgsWithVault ?? '—'}
                note="Organisations with at least one vault created"
              />
              <ComingSoonCard icon={Clock} title="Time to Activation" subtitle="Registration → first session duration" />
            </>
          )}
        </div>
      </div>

      {/* Engagement */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Engagement</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {loading ? (
            [0, 1, 2, 3].map((i) => <div key={i} className="premium-card p-5 h-28 animate-pulse bg-zinc-100 dark:bg-zinc-800" />)
          ) : (
            <>
              <MetricCard
                icon={Users}
                label="Active Users (7d)"
                value={data?.engagement?.activeUsersLast7d ?? '—'}
                note="Approx. from audit activity"
                color="text-emerald-600 dark:text-emerald-400"
              />
              <MetricCard
                icon={Users}
                label="Active Users (30d)"
                value={data?.engagement?.activeUsersLast30d ?? '—'}
                note="Approx. from audit activity"
              />
              <MetricCard
                icon={BarChart3}
                label="Audit Events"
                value={data?.engagement?.auditEventsInPeriod ?? '—'}
                note={`Last ${days} days`}
              />
              <MetricCard
                icon={Zap}
                label="Credential Events"
                value={data?.engagement?.credentialEvents ?? '—'}
                note="Secret created/updated/deleted/revealed"
              />
            </>
          )}
        </div>

        {!loading && data?.engagement?.note && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-premium-muted italic">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {data.engagement.note}
          </div>
        )}
      </div>

      {/* Retention */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Retention</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComingSoonCard
            icon={Clock}
            title="7-Day Retention"
            subtitle="Users/orgs active in the 7 days after their first activity"
          />
          <ComingSoonCard
            icon={Clock}
            title="30-Day Retention"
            subtitle="Users/orgs active in the 30 days after their first activity"
          />
          <ComingSoonCard
            icon={Clock}
            title="90-Day Retention"
            subtitle="Requires a dedicated daily-active-user tracking table for precision"
          />
        </div>
      </div>

      {/* Conversion & Churn */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Conversion & Churn</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-premium-main">Free → Pro Conversion</p>
              <p className="text-[10px] text-premium-muted mt-1 leading-relaxed max-w-xs">
                Conversion rate from Free to Pro plan. Available after subscription & billing integration.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Billing Integration Required
            </span>
          </div>
          <div className="premium-card p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-premium-main">Churn Analytics</p>
              <p className="text-[10px] text-premium-muted mt-1 leading-relaxed max-w-xs">
                Cancelled organisations, inactive churn, and churn reasons. Available after subscription tracking.
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Billing Integration Required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
