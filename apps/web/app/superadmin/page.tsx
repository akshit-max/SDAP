'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { superAdminApi } from '../../lib/api/superadmin';
import { SupportCard } from '../../components/common/SupportCard';
import {
  Users, Building2, Zap, Database, Activity, ShieldAlert, Loader2,
  KeyRound, Server, Wifi, WifiOff, RefreshCw, CreditCard, TrendingDown, AlertCircle,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Overview {
  users: { total: number; active: number; newInPeriod: number; inactive: number };
  organizations: { total: number; active: number; newInPeriod: number; inactive: number };
  vaults: { total: number };
  secrets: { total: number };
  sessions: { active: number; pending: number; revoked: number; expired: number; total: number };
  connections: { total: number; failed: number; healthy: number };
  audit: { eventsLast7Days: number };
  topPlatforms: { provider: string; activeSessions: number }[];
  billing: null;
}

type TimeRange = 'today' | '7d' | '30d' | '3m' | '6m' | '1y' | 'custom';

const TIME_RANGES: { label: string; value: TimeRange; days: number | null }[] = [
  { label: 'Today', value: 'today', days: 1 },
  { label: '7 Days', value: '7d', days: 7 },
  { label: '30 Days', value: '30d', days: 30 },
  { label: '3 Months', value: '3m', days: 90 },
  { label: '6 Months', value: '6m', days: 180 },
  { label: '1 Year', value: '1y', days: 365 },
];

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, accentBorder,
}: {
  icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; accentBorder?: string;
}) {
  return (
    <div className="premium-card p-5 space-y-3 shadow-none relative overflow-hidden">
      {accentBorder && <div className={`absolute top-0 left-0 right-0 h-[2px] ${accentBorder}`} />}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 border border-premium rounded-sm">
          <Icon className="w-4 h-4 text-premium-main" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-premium-main tracking-tight font-number">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-xs text-premium-muted font-medium mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function ComingSoonStatCard({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="premium-card p-5 space-y-3 shadow-none relative overflow-hidden border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-sm">
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
      </div>
      <div>
        <div className="text-xl font-bold text-zinc-400">—</div>
        <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="premium-card p-3 shadow-lg text-xs border border-premium bg-premium-surface space-y-1">
      <p className="font-bold text-premium-muted text-[10px]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function ComingSoonChart({ title }: { title: string }) {
  return (
    <div className="premium-card p-6 flex flex-col items-center justify-center text-center space-y-2 min-h-[180px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Activity className="w-4 h-4 text-zinc-400" />
      </div>
      <p className="text-xs font-bold text-premium-main">{title}</p>
      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        Coming Soon — Billing Integration Required
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperAdminOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [growthData, setGrowthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const getDateRange = useCallback((range: TimeRange) => {
    const now = new Date();
    const days = TIME_RANGES.find((r) => r.value === range)?.days || 30;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: now.toISOString(), days };
  }, []);

  const fetchData = useCallback(async (range: TimeRange) => {
    try {
      setLoading(true);
      setError(null);
      const { from, to, days } = getDateRange(range);
      const [overviewRes, growthRes] = await Promise.all([
        superAdminApi.getOverview({ from, to }),
        superAdminApi.getGrowthData(days),
      ]);
      setOverview(overviewRes.data);
      setGrowthData(growthRes.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load platform overview.');
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData(timeRange);
  }, [fetchData, timeRange]);

  // Build chart data from growth response
  const chartData = growthData
    ? growthData.labels.map((date: string, i: number) => ({
        date: date.slice(5), // Show MM-DD
        Orgs: growthData.orgs[i],
        Users: growthData.users[i],
        Sessions: growthData.sessions[i],
        Events: growthData.auditEvents[i],
      }))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header + Time Filter */}
      <div className="pb-4 border-b border-premium flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-premium-main">Platform Dashboard</h1>
          <p className="text-xs text-premium-muted mt-0.5">
            Real-time analytics across WITHUS. Billing-dependent metrics are marked as Coming Soon.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time filter */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded p-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded transition-colors ${
                  timeRange === r.value
                    ? 'bg-white dark:bg-zinc-700 text-premium-main shadow-sm'
                    : 'text-zinc-500 hover:text-premium-main'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchData(timeRange)}
            disabled={loading}
            className="flex items-center gap-1.5 premium-button-secondary py-1.5 px-3 text-xs font-semibold"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="premium-card p-4 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 font-semibold">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && !overview ? (
        <div className="flex items-center justify-center h-64 text-premium-muted text-xs font-semibold gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-premium-main" />
          Loading platform analytics...
        </div>
      ) : (
        <>
          {/* ─── Row 1: All 12 KPI Cards — Available + Coming Soon ──────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Key Performance Indicators</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* 🟢 AVAILABLE */}
              <StatCard
                icon={Building2}
                label="Total Organisations"
                value={overview?.organizations.total ?? 0}
                sub={`${overview?.organizations.active} active · ${overview?.organizations.inactive} inactive`}
                accentBorder="bg-blue-500"
              />
              <StatCard
                icon={Building2}
                label="Active Organisations"
                value={overview?.organizations.active ?? 0}
                sub={`${overview?.organizations.newInPeriod} new this period`}
                accentBorder="bg-emerald-500"
              />
              <StatCard
                icon={Users}
                label="Total Users"
                value={overview?.users.total ?? 0}
                sub={`${overview?.users.active} active · ${overview?.users.inactive} inactive`}
                accentBorder="bg-purple-500"
              />
              <StatCard
                icon={Users}
                label="Active Users"
                value={overview?.users.active ?? 0}
                sub={`${overview?.users.newInPeriod} new this period`}
                accentBorder="bg-indigo-500"
              />
              <StatCard
                icon={Building2}
                label="New Organisations"
                value={overview?.organizations.newInPeriod ?? 0}
                sub="New in selected period"
                accentBorder="bg-sky-500"
              />
              <StatCard
                icon={Users}
                label="New Users"
                value={overview?.users.newInPeriod ?? 0}
                sub="New in selected period"
                accentBorder="bg-cyan-500"
              />
              <StatCard
                icon={Wifi}
                label="Platform Connections"
                value={overview?.connections.total ?? 0}
                sub={`${overview?.connections.healthy} healthy · ${overview?.connections.failed} failed`}
                accentBorder="bg-teal-500"
              />
              <StatCard
                icon={WifiOff}
                label="Failed Connections"
                value={overview?.connections.failed ?? 0}
                sub="Integration connections in error state"
                accentBorder="bg-red-500"
              />

              {/* 🟡 COMING SOON — Billing-dependent */}
              <ComingSoonStatCard icon={CreditCard} label="Free Organisations" />
              <ComingSoonStatCard icon={CreditCard} label="Pro Organisations" />
              <ComingSoonStatCard icon={TrendingDown} label="MRR" />
              <ComingSoonStatCard icon={AlertCircle} label="Churned Organisations" />
            </div>
          </div>

          {/* ─── Row 2: Sessions + Vault/Secrets ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Lifecycle */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted">
                Delegated Session Lifecycle
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Active', value: overview?.sessions.active ?? 0, dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', note: 'Currently delegated' },
                  { label: 'Pending', value: overview?.sessions.pending ?? 0, dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', note: 'Awaiting approval' },
                  { label: 'Revoked', value: overview?.sessions.revoked ?? 0, dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', note: 'Manual revocation' },
                  { label: 'Expired', value: overview?.sessions.expired ?? 0, dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', note: 'TTL lapsed' },
                ].map((s) => (
                  <div key={s.label} className="premium-card p-4 shadow-none space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.label}</span>
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    </div>
                    <div className="text-2xl font-bold text-premium-main font-number">{s.value}</div>
                    <p className="text-[10px] text-premium-muted">{s.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vault & Secrets + Audit */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted">
                Credential & Audit Summary
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="premium-card p-4 shadow-none space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Vaults</span>
                  </div>
                  <div className="text-2xl font-bold text-premium-main font-number">{overview?.vaults.total ?? 0}</div>
                </div>
                <div className="premium-card p-4 shadow-none space-y-1">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Secrets</span>
                  </div>
                  <div className="text-2xl font-bold text-premium-main font-number">{overview?.secrets.total ?? 0}</div>
                </div>
                <div className="premium-card p-4 shadow-none space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Events (7d)</span>
                  </div>
                  <div className="text-2xl font-bold text-premium-main font-number">{overview?.audit.eventsLast7Days ?? 0}</div>
                </div>
              </div>

              {/* Top Platforms */}
              <div className="premium-card p-4 shadow-none space-y-2">
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Top Platforms by Active Sessions</span>
                </div>
                {!overview?.topPlatforms.length ? (
                  <p className="text-[10px] text-premium-muted py-2">No active integration sessions.</p>
                ) : (
                  <div className="space-y-1.5">
                    {overview.topPlatforms.map((p) => (
                      <div key={p.provider} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-premium-main">{p.provider}</span>
                        <span className="text-[10px] font-bold text-premium-muted font-number">
                          {p.activeSessions} session{p.activeSessions !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Row 3: Charts ────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Analytics Charts</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Organisation + User Growth */}
              <div className="premium-card p-5 space-y-3">
                <p className="text-[11px] font-bold text-premium-main uppercase tracking-wider">Organisation & User Growth</p>
                {loading || !chartData.length ? (
                  <div className="h-44 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} width={28} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="Orgs" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Users" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Session Activity */}
              <div className="premium-card p-5 space-y-3">
                <p className="text-[11px] font-bold text-premium-main uppercase tracking-wider">Session Activity</p>
                {loading || !chartData.length ? (
                  <div className="h-44 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} width={28} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Sessions" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Active vs Inactive Orgs */}
              <div className="premium-card p-5 space-y-3">
                <p className="text-[11px] font-bold text-premium-main uppercase tracking-wider">Active vs Inactive Organisations</p>
                {loading || !overview ? (
                  <div className="h-44 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={[
                        { name: 'Active', value: overview.organizations.active },
                        { name: 'Inactive', value: overview.organizations.inactive },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} width={28} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Audit / Security Activity */}
              <div className="premium-card p-5 space-y-3">
                <p className="text-[11px] font-bold text-premium-main uppercase tracking-wider">Security & Audit Activity</p>
                {loading || !chartData.length ? (
                  <div className="h-44 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} tickLine={false} width={28} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Events" fill="#6366f1" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* MRR Growth — Coming Soon */}
              <ComingSoonChart title="MRR Growth — Billing Integration Required" />

              {/* Org Churn — Coming Soon */}
              <ComingSoonChart title="Organisation Churn — Billing Integration Required" />
            </div>

            {/* Support / Help Section */}
            <div className="pt-4">
              <SupportCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
