'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { superAdminApi } from '../../../../lib/api/superadmin';
import {
  ArrowLeft, Building2, Users, Database, Zap, Plug2, Shield, Loader2,
  CheckCircle, XCircle, CreditCard, AlertCircle, Clock, Activity,
} from 'lucide-react';
import { formatDate } from '../../../../lib/formatters';

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'connections' | 'usage' | 'subscription'>('overview');

  useEffect(() => {
    superAdminApi.getOrganizationDetail(params.id as string)
      .then((res) => setOrg(res.data))
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-premium-muted text-xs font-semibold gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
      Loading organization details...
    </div>
  );

  if (!org) return (
    <div className="premium-card p-6 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs text-red-600 dark:text-red-400 font-semibold">
      Organization not found.
    </div>
  );

  const owner = org.members?.find((m: any) => m.role === 'OWNER');

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'connections', label: 'Platform Connections', icon: Plug2 },
    { id: 'usage', label: 'Usage', icon: Activity },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className="premium-button-secondary py-1.5 px-3 text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Organizations
      </button>

      {/* Header Card */}
      <div className="premium-card p-6 shadow-none">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 border border-premium flex-shrink-0">
            <Building2 className="w-6 h-6 text-premium-main" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-premium-main tracking-tight">{org.name}</h1>
              {org.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 dark:border-emerald-900/20">
                  <CheckCircle className="w-3 h-3 mr-1" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/30 dark:border-red-900/30">
                  <XCircle className="w-3 h-3 mr-1" /> Inactive
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-premium-muted mt-0.5">/{org.slug}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-premium-muted font-medium">
              <span>Created: <strong className="text-premium-main">{formatDate(org.createdAt)}</strong></span>
              <span>Owner: <strong className="text-premium-main">{owner?.user?.email || '—'}</strong></span>
              <span>Last Active: <strong className="text-premium-main">{org.lastActiveAt ? formatDate(org.lastActiveAt) : '—'}</strong></span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-4 border-t border-premium">
          {[
            { label: 'Members', value: org._count?.members ?? 0 },
            { label: 'Vaults', value: org._count?.vaults ?? 0 },
            { label: 'Secrets', value: org.secretCount ?? 0 },
            { label: 'Active Sessions', value: org.activeSessionCount ?? 0 },
          ].map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-2xl font-bold text-premium-main font-number">{s.value}</div>
              <div className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-premium">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vaults */}
          <div className="premium-card p-5 shadow-none space-y-4">
            <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium pb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-premium-muted" /> Vaults
            </h2>
            <div className="space-y-2">
              {org.vaults?.slice(0, 8).map((v: any) => (
                <div key={v.id} className="flex items-center justify-between py-1 border-b border-premium/50 last:border-b-0">
                  <span className="text-xs font-semibold text-premium-main">{v.name}</span>
                  <span className="text-[10px] font-bold text-premium-muted font-number">{v._count?.secrets ?? 0} secrets</span>
                </div>
              ))}
              {org.vaults?.length === 0 && <div className="text-xs text-premium-muted py-2 font-medium">No vaults found.</div>}
            </div>
          </div>

          {/* Recent Audit */}
          <div className="premium-card p-5 shadow-none space-y-4">
            <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium pb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-premium-muted" /> Recent Audit Events
            </h2>
            <div className="space-y-2">
              {org.recentAudit?.slice(0, 6).map((e: any) => (
                <div key={e.id} className="flex items-start justify-between gap-2 py-1 border-b border-premium/50 last:border-b-0">
                  <div>
                    <div className="text-[11px] font-mono font-semibold text-premium-main">{e.action}</div>
                    <div className="text-[10px] text-premium-muted font-medium">by {e.actor?.email || 'system'}</div>
                  </div>
                  <span className="text-[10px] text-premium-muted font-bold whitespace-nowrap">{formatDate(e.createdAt)}</span>
                </div>
              ))}
              {org.recentAudit?.length === 0 && <div className="text-xs text-premium-muted py-2 font-medium">No recent activity.</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="premium-card shadow-none overflow-hidden">
          <div className="px-5 py-3 border-b border-premium">
            <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Organization Members ({org.members?.length ?? 0})
            </h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-premium">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Name</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Email</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Role</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Status</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Last Login</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-premium">
              {org.members?.map((m: any) => (
                <tr key={m.user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="px-5 py-3 font-semibold text-premium-main">{m.user.fullName || '—'}</td>
                  <td className="px-5 py-3 font-mono text-[11px] text-premium-muted">{m.user.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-premium-main border border-premium/50 rounded">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {m.user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-premium-muted font-number text-[11px]">
                    {m.user.lastLoginAt ? formatDate(m.user.lastLoginAt) : (
                      <span className="text-zinc-400 italic">Never</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-premium-muted font-number text-[11px]">
                    {m.joinedAt ? formatDate(m.joinedAt) : '—'}
                  </td>
                </tr>
              ))}
              {org.members?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-premium-muted">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="premium-card shadow-none overflow-hidden">
          <div className="px-5 py-3 border-b border-premium">
            <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider flex items-center gap-1.5">
              <Plug2 className="w-3.5 h-3.5" /> Platform Connections ({org.integrationConnections?.length ?? 0})
            </h2>
          </div>
          {org.integrationConnections?.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-premium-muted">No integrations connected.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-premium">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Provider</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Last Checked</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Connected Since</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Last Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-premium">
                {org.integrationConnections?.map((ic: any) => (
                  <tr key={ic.provider} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-premium-main">{ic.provider}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                        ic.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : ic.status === 'ERROR'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {ic.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-premium-muted text-[11px] font-number">{ic.lastCheckedAt ? formatDate(ic.lastCheckedAt) : '—'}</td>
                    <td className="px-5 py-3 text-premium-muted text-[11px] font-number">{formatDate(ic.createdAt)}</td>
                    <td className="px-5 py-3 text-rose-600 dark:text-rose-400 text-[11px] font-mono">{ic.lastError || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Members', value: org._count?.members ?? 0, icon: Users },
              { label: 'Vaults', value: org._count?.vaults ?? 0, icon: Database },
              { label: 'Secrets', value: org.secretCount ?? 0, icon: Zap },
              { label: 'Active Sessions', value: org.activeSessionCount ?? 0, icon: Activity },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="premium-card p-4 shadow-none space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-premium-main font-number">{s.value}</div>
                </div>
              );
            })}
          </div>

          <div className="premium-card p-5 shadow-none">
            <h3 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-premium pb-2">
              <Clock className="w-3.5 h-3.5" /> Recent Activity (from Audit Log)
            </h3>
            <div className="space-y-2">
              {org.recentAudit?.slice(0, 10).map((e: any) => (
                <div key={e.id} className="flex items-start justify-between gap-2 py-1 border-b border-premium/50 last:border-b-0">
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-premium-main">{e.action}</span>
                    {e.actor?.email && <span className="text-[10px] text-premium-muted ml-2">by {e.actor.email}</span>}
                    {e.resourceType && <span className="text-[10px] text-premium-muted ml-2">· {e.resourceType}</span>}
                  </div>
                  <span className="text-[10px] text-premium-muted font-bold whitespace-nowrap font-number">{formatDate(e.createdAt)}</span>
                </div>
              ))}
              {(!org.recentAudit || org.recentAudit.length === 0) && (
                <p className="text-xs text-premium-muted py-2">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Billing Integration Required notice */}
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
                  Subscription plan, billing status, renewal date, and payment history for this organisation
                  will appear here once the payment gateway and subscription infrastructure are connected.
                  This section is fully structured and ready to receive billing data.
                </p>
              </div>
            </div>
          </div>

          {/* Subscription KPI placeholders */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Current Plan', icon: CreditCard },
              { label: 'Billing Status', icon: CheckCircle },
              { label: 'Next Renewal', icon: Clock },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="premium-card p-5 flex flex-col items-center justify-center text-center space-y-2 min-h-[100px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
                  <Icon className="w-4 h-4 text-zinc-400" />
                  <p className="text-xs font-bold text-premium-main">{item.label}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    Billing Required
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
