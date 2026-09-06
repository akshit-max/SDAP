'use client';

import React, { useEffect, useState } from 'react';
import { superAdminApi } from '../../../lib/api/superadmin';
import { Vault, Eye, Shield, BarChart3, Loader2, RefreshCw, Activity, Clock } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';

// ─── Types ─────────────────────────────────────────────────────────────────────

type VaultAnalytics = {
  summary: {
    totalVaults: number;
    totalSecrets: number;
    activeSessions: number;
    totalReveals: number;
  };
  secretsByType: { type: string; count: number }[];
  secretsByStatus: { status: string; count: number }[];
  topVaults: { id: string; name: string; orgName: string; orgId: string; secretCount: number }[];
  topRevealedSecrets: {
    id: string;
    name: string;
    type: string;
    revealCount: number;
    lastRevealedAt: string | null;
    vaultName: string;
    orgName: string;
  }[];
  sessionsByScope: { scope: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    createdAt: string;
    actor: { email: string; fullName: string } | null;
    organization: { name: string } | null;
  }[];
};

// ─── Secret type display names ─────────────────────────────────────────────────

const SECRET_TYPE_LABELS: Record<string, string> = {
  PASSWORD: 'Password',
  API_KEY: 'API Key',
  TOKEN: 'Token',
  SSH_KEY: 'SSH Key',
  CERTIFICATE: 'Certificate',
  OAUTH: 'OAuth Token',
  COOKIE: 'Cookie',
  TEXT: 'Text',
  JSON: 'JSON',
  OTHER: 'Other',
};

const SECRET_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' },
  DISABLED: { label: 'Disabled', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  PENDING_ROTATION: { label: 'Pending Rotation', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' },
  DELETED: { label: 'Deleted', cls: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' },
};

const SCOPE_LABELS: Record<string, string> = {
  VAULT: 'Vault-scoped',
  SECRET: 'Secret-scoped',
  INTEGRATION: 'Integration-scoped',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-number">{value.toLocaleString()}</p>
      {sub && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function VaultAnalyticsPage() {
  const [data, setData] = useState<VaultAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    superAdminApi.getVaultAnalytics()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load vault analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const [topVaultsPage, setTopVaultsPage] = useState(1);
  const [topSecretsPage, setTopSecretsPage] = useState(1);
  const [recentActivityPage, setRecentActivityPage] = useState(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400 mr-2" />
        <span className="text-sm text-slate-500">Loading vault analytics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="p-6 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-center">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error || 'No data available.'}</p>
        </div>
      </div>
    );
  }

  const { summary, secretsByType, secretsByStatus, topVaults, topRevealedSecrets, sessionsByScope, recentActivity } = data;

  const VAULTS_LIMIT = 5;
  const totalVaultPages = Math.max(1, Math.ceil(topVaults.length / VAULTS_LIMIT));
  const paginatedTopVaults = topVaults.slice((topVaultsPage - 1) * VAULTS_LIMIT, topVaultsPage * VAULTS_LIMIT);

  const SECRETS_LIMIT = 5;
  const totalSecretsPages = Math.max(1, Math.ceil(topRevealedSecrets.length / SECRETS_LIMIT));
  const paginatedTopSecrets = topRevealedSecrets.slice((topSecretsPage - 1) * SECRETS_LIMIT, topSecretsPage * SECRETS_LIMIT);

  const ACTIVITY_LIMIT = 10;
  const totalActivityPages = Math.max(1, Math.ceil(recentActivity.length / ACTIVITY_LIMIT));
  const paginatedActivity = recentActivity.slice((recentActivityPage - 1) * ACTIVITY_LIMIT, recentActivityPage * ACTIVITY_LIMIT);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div className="pb-3 border-b border-slate-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Vault className="w-5 h-5" />
          Vault Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Real data from Vault, Secret, and Delegated Session models. No schema changes — derived from existing database.
        </p>
      </div>

      {/* ── KPI Summary Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Vaults" value={summary.totalVaults} icon={Vault} sub="Active vaults across all organisations" />
        <StatCard label="Total Secrets" value={summary.totalSecrets} icon={Shield} sub="Active secrets stored in vaults" />
        <StatCard label="Active Sessions" value={summary.activeSessions} icon={Activity} sub="Currently active delegated sessions" />
        <StatCard label="Total Reveals" value={summary.totalReveals} icon={Eye} sub="Cumulative secret reveal count" />
      </div>

      {/* ── Two-column: Secret by Type + Secret by Status ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Secrets by type */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Secrets by Type</h2>
          </div>
          {secretsByType.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-xs text-slate-400">No secrets found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {secretsByType.map(({ type, count }) => {
                const total = secretsByType.reduce((s, t) => s + t.count, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={type} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{SECRET_TYPE_LABELS[type] || type}</p>
                        <div className="mt-1 w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5">
                          <div
                            className="bg-slate-700 dark:bg-slate-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-number">{count.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Secrets by status + Session scope */}
        <div className="space-y-4">
          {/* Secrets by status */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Secrets by Status</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {secretsByStatus.map(({ status, count }) => {
                const meta = SECRET_STATUS_LABELS[status] || { label: status, cls: 'bg-zinc-100 text-zinc-600' };
                return (
                  <div key={status} className="px-5 py-3 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-number">{count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session scope distribution */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50">
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Session Distribution by Scope</h2>
            </div>
            {sessionsByScope.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-slate-400">No sessions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {sessionsByScope.map(({ scope, count }) => (
                  <div key={scope} className="px-5 py-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{SCOPE_LABELS[scope] || scope}</p>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-number">{count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top 10 Vaults by Secret Count ──────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Top Vaults by Secret Count</h2>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total {topVaults.length} vaults
          </span>
        </div>
        {topVaults.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-xs text-slate-400">No vaults found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                <thead className="bg-slate-50 dark:bg-zinc-800/50">
                  <tr>
                    {['#', 'Vault Name', 'Organisation', 'Secrets'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {paginatedTopVaults.map((v, i) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-400 font-number">{(topVaultsPage - 1) * VAULTS_LIMIT + i + 1}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-900 dark:text-slate-100">{v.name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-700 dark:text-slate-300">{v.orgName}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 font-number text-right">{v.secretCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Page <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{topVaultsPage}</span> of{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{totalVaultPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={topVaultsPage <= 1}
                  onClick={() => setTopVaultsPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={topVaultsPage >= totalVaultPages}
                  onClick={() => setTopVaultsPage(p => Math.min(totalVaultPages, p + 1))}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Top 10 Most Accessed Secrets ───────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Top Most Accessed Secrets</h2>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total {topRevealedSecrets.length} secrets
          </span>
        </div>
        {topRevealedSecrets.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Eye className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">No secrets have been revealed yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                <thead className="bg-slate-50 dark:bg-zinc-800/50">
                  <tr>
                    {['Secret Name', 'Type', 'Vault', 'Organisation', 'Reveals', 'Last Revealed'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${i >= 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {paginatedTopSecrets.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{SECRET_TYPE_LABELS[s.type] || s.type}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{s.vaultName}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{s.orgName}</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 font-number text-right">{s.revealCount}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400 text-right font-number">
                        {s.lastRevealedAt ? formatDate(s.lastRevealedAt) : <span className="text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Page <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{topSecretsPage}</span> of{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{totalSecretsPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={topSecretsPage <= 1}
                  onClick={() => setTopSecretsPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={topSecretsPage >= totalSecretsPages}
                  onClick={() => setTopSecretsPage(p => Math.min(totalSecretsPages, p + 1))}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Recent Vault Activity ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recent Vault Activity</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Last vault/secret/session events from the audit log</p>
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Total {recentActivity.length} events
          </span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="text-xs text-slate-400">No vault activity recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                <thead className="bg-slate-50 dark:bg-zinc-800/50">
                  <tr>
                    {['Action', 'Actor', 'Organisation', 'Resource', 'Timestamp'].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                  {paginatedActivity.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-slate-900 dark:text-slate-100">{e.action}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-700 dark:text-slate-300">
                        {e.actor?.email ?? <span className="text-slate-400">System</span>}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                        {e.organization?.name ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {e.resourceType ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-800 dark:text-slate-200 text-right font-number">{formatDate(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/30">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Page <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{recentActivityPage}</span> of{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{totalActivityPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={recentActivityPage <= 1}
                  onClick={() => setRecentActivityPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={recentActivityPage >= totalActivityPages}
                  onClick={() => setRecentActivityPage(p => Math.min(totalActivityPages, p + 1))}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
