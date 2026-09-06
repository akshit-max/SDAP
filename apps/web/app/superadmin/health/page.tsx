'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { superAdminApi } from '../../../lib/api/superadmin';
import { HeartPulse, Database, Cpu, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '../../../lib/formatters';

type HealthStatus = 'operational' | 'degraded' | 'down' | 'unknown';

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === 'operational') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'degraded') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (status === 'down') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-zinc-400" />;
}

function StatusBadge({ status }: { status: HealthStatus | string }) {
  const map: Record<string, string> = {
    operational: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
    down: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
    ERROR: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
    DISCONNECTED: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  };
  const cls = map[status] || 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="premium-card p-5 flex flex-col items-center justify-center text-center space-y-2 min-h-[120px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Clock className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs font-bold text-premium-main">{title}</p>
        <p className="text-[10px] text-premium-muted mt-0.5 leading-relaxed max-w-xs">{description}</p>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        Monitoring Required
      </span>
    </div>
  );
}

export default function SystemHealthPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [errorEvents, setErrorEvents] = useState<any[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminApi.getSystemHealth();
      setData(res.data);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const apiStatus: HealthStatus = data?.api?.status || 'unknown';
  const dbStatus: HealthStatus = data?.database?.status || 'unknown';
  const dbLatency: number = data?.database?.latencyMs || 0;
  const integrations: any[] = data?.integrations || [];
  const errorEventsLastHour: number = data?.errorEventsLastHour || 0;

  // Group integration statuses
  const integrationMap = new Map<string, Record<string, number>>();
  for (const row of integrations) {
    if (!integrationMap.has(row.provider)) integrationMap.set(row.provider, {});
    integrationMap.get(row.provider)![row.status] = row.count;
  }

  // Load error events when errors tab is active
  useEffect(() => {
    if (tabParam !== 'errors') return;
    setErrorsLoading(true);
    superAdminApi.getGlobalAudit({ page: 1, limit: 100 })
      .then((res) => {
        const all = res.data?.data || [];
        const errors = all.filter((e: any) =>
          e.action?.includes('fail') ||
          e.action?.includes('error') ||
          e.action?.includes('denied') ||
          e.action?.includes('revoked') ||
          e.action?.includes('unauthorized') ||
          e.action?.includes('revoke_failed') ||
          e.action === 'integration.error'
        );
        setErrorEvents(errors);
      })
      .finally(() => setErrorsLoading(false));
  }, [tabParam]);

  const [errorsPage, setErrorsPage] = useState(1);

  // ── Errors tab early return ───────────────────────────────────────────────
  if (tabParam === 'errors') {
    const LIMIT = 10;
    const totalErrorPages = Math.max(1, Math.ceil(errorEvents.length / LIMIT));
    const paginatedErrors = errorEvents.slice((errorsPage - 1) * LIMIT, errorsPage * LIMIT);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-premium-main flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Error Events
            </h2>
            <p className="text-[11px] text-premium-muted mt-0.5">
              Recent error and failure events from the platform audit log (last 100 entries).
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-number bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded border border-slate-200 dark:border-zinc-700">
            Total {errorEvents.length} error events
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          {errorsLoading ? (
            <div className="px-5 py-12 text-center">
              <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
              <p className="text-xs text-slate-500">Loading error events...</p>
            </div>
          ) : errorEvents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-500">No error events found in recent audit log.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800">
                  <thead className="bg-slate-50 dark:bg-zinc-800/50">
                    <tr>
                      {['Action', 'Actor', 'Organisation', 'Resource', 'Timestamp'].map((h, i) => (
                        <th key={h} scope="col" className={`px-5 py-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                    {paginatedErrors.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-bold text-rose-700 dark:text-rose-400">{e.action}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-800 dark:text-slate-200">
                          {e.actor?.email ?? <span className="text-slate-400">System</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
                          {e.organization?.name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">
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
                  Page <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{errorsPage}</span> of{' '}
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-number">{totalErrorPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={errorsPage <= 1}
                    onClick={() => setErrorsPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={errorsPage >= totalErrorPages}
                    onClick={() => setErrorsPage(p => Math.min(totalErrorPages, p + 1))}
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-premium-main flex items-center gap-2">
            <HeartPulse className="w-4 h-4" /> System Health
          </h2>
          <p className="text-[11px] text-premium-muted mt-0.5">
            Real-time platform status. Auto-refreshes every 30 seconds.
            {lastRefresh && (
              <span className="ml-2 text-zinc-400">Last updated: {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 premium-button-secondary py-1.5 px-3 text-xs font-semibold"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh Now
        </button>
      </div>

      {error && (
        <div className="premium-card p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* Core Services */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Core Services</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* API */}
          <div className="premium-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-zinc-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">API Server</p>
            </div>
            {loading ? (
              <div className="h-10 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon status={apiStatus} />
                  <span className="text-xs font-semibold text-premium-main capitalize">{apiStatus}</span>
                </div>
                <StatusBadge status={apiStatus} />
              </div>
            )}
          </div>

          {/* Database */}
          <div className="premium-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-zinc-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Database</p>
            </div>
            {loading ? (
              <div className="h-10 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIcon status={dbStatus} />
                  <span className="text-xs font-semibold text-premium-main capitalize">{dbStatus}</span>
                </div>
                <div className="text-right">
                  <StatusBadge status={dbStatus} />
                  {dbLatency > 0 && (
                    <p className="text-[9px] text-premium-muted mt-1">{dbLatency}ms latency</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Memory */}
          <div className="premium-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Server</p>
            </div>
            {loading ? (
              <div className="h-10 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-premium-main">Heap threshold: 150 MB</span>
                </div>
                <p className="text-[9px] text-premium-muted mt-1">Monitored via @nestjs/terminus</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Events */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Errors</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Error Events (Last Hour)</p>
            {loading ? (
              <div className="h-8 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded" />
            ) : (
              <div className="flex items-center gap-3">
                {errorEventsLastHour === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
                <span className="text-xl font-bold text-premium-main">{errorEventsLastHour}</span>
                <span className="text-xs text-premium-muted">error-related audit events</span>
              </div>
            )}
          </div>

          <ComingSoonCard
            title="Error Rate & P50/P95 Response Time"
            description="Requires instrumentation middleware (e.g. pino-http or OpenTelemetry). Monitoring setup required."
          />
        </div>
      </div>

      {/* Integration Status */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Integration Status</p>
        {loading ? (
          <div className="premium-card p-5 h-40 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
        ) : (
          <div className="premium-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-premium">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Platform</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Active</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Failed</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Disconnected</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-premium">
                {['VERCEL', 'GITHUB', 'GODADDY', 'GMAIL'].map((provider) => {
                  const stats = integrationMap.get(provider) || {};
                  const active = stats['ACTIVE'] || 0;
                  const failed = stats['ERROR'] || 0;
                  const disconnected = stats['DISCONNECTED'] || 0;
                  const overallStatus = failed > 0 ? 'ERROR' : active > 0 ? 'ACTIVE' : 'DISCONNECTED';
                  return (
                    <tr key={provider} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-5 py-3 font-bold text-premium-main">{provider}</td>
                      <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{active}</td>
                      <td className="px-5 py-3 text-red-600 dark:text-red-400 font-semibold">{failed}</td>
                      <td className="px-5 py-3 text-zinc-500">{disconnected}</td>
                      <td className="px-5 py-3"><StatusBadge status={overallStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* External Platform Uptime — clearly unavailable */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">External Platform Uptime</p>
        <div className="premium-card p-5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-premium-main mb-1">External Health Unavailable</p>
              <p className="text-[10px] text-premium-muted leading-relaxed">
                Third-party platform uptime (GitHub, Vercel, GoDaddy, Gmail) cannot be reliably monitored from the WITHUS backend.
                For external platform status, check each provider&apos;s official status page.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { name: 'GitHub Status', url: 'https://www.githubstatus.com' },
                  { name: 'Vercel Status', url: 'https://www.vercel-status.com' },
                  { name: 'Google Status', url: 'https://www.google.com/appsstatus' },
                ].map((l) => (
                  <a
                    key={l.name}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  >
                    {l.name} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
