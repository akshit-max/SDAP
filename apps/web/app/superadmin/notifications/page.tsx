'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { superAdminApi } from '../../../lib/api/superadmin';
import { Bell, AlertCircle, Info, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

type AlertLevel = 'critical' | 'warning' | 'info';

function AlertCard({ level, title, message, time }: { level: AlertLevel; title: string; message: string; time?: string | Date | null }) {
  const map = {
    critical: { icon: AlertCircle, cls: 'border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/10', icon_cls: 'text-red-500', label: 'CRITICAL' },
    warning: { icon: AlertTriangle, cls: 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/10', icon_cls: 'text-amber-500', label: 'WARNING' },
    info: { icon: Info, cls: 'border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/10', icon_cls: 'text-blue-400', label: 'INFO' },
  };
  const style = map[level] || map.info;
  const Icon = style.icon;
  return (
    <div className={`premium-card p-4 border ${style.cls} flex items-start gap-3`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.icon_cls}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold uppercase tracking-widest ${style.icon_cls}`}>{style.label}</span>
          {time && (
            <span className="text-[9px] text-premium-muted">{new Date(time).toLocaleString()}</span>
          )}
        </div>
        <p className="text-xs font-semibold text-premium-main">{title}</p>
        <p className="text-[10px] text-premium-muted mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminApi.getNotifications();
      setData(res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const alerts: any[] = data?.alerts || [];
  const recentAdminActions: any[] = data?.recentAdminActions || [];

  const criticals = alerts.filter((a) => a.level === 'critical');
  const warnings = alerts.filter((a) => a.level === 'warning');
  const infos = alerts.filter((a) => a.level === 'info');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-premium-main flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications & Alerts
          </h2>
          <p className="text-[11px] text-premium-muted mt-0.5">Platform alerts derived from real-time data</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 premium-button-secondary py-1.5 px-3 text-xs font-semibold">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="premium-card p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="premium-card p-4 text-center">
          <p className="text-xl font-bold text-red-500">{loading ? '—' : criticals.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted mt-1">🔴 Critical</p>
        </div>
        <div className="premium-card p-4 text-center">
          <p className="text-xl font-bold text-amber-500">{loading ? '—' : warnings.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted mt-1">🟠 Warning</p>
        </div>
        <div className="premium-card p-4 text-center">
          <p className="text-xl font-bold text-blue-500">{loading ? '—' : infos.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted mt-1">🔵 Information</p>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Active Alerts</p>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="premium-card p-4 h-16 animate-pulse bg-zinc-100 dark:bg-zinc-800" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="premium-card p-8 flex flex-col items-center justify-center text-center gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-premium-main">All Systems Normal</p>
              <p className="text-[10px] text-premium-muted mt-0.5">No active alerts at this time.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {criticals.map((a, i) => <AlertCard key={`c-${i}`} level="critical" title={a.title} message={a.message} time={a.time} />)}
            {warnings.map((a, i) => <AlertCard key={`w-${i}`} level="warning" title={a.title} message={a.message} time={a.time} />)}
            {infos.map((a, i) => <AlertCard key={`i-${i}`} level="info" title={a.title} message={a.message} time={a.time} />)}
          </div>
        )}
      </div>

      {/* Future alert types — present but marked coming soon */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Future Alert Types</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { level: '🟠', title: 'High Error Rate', note: 'Requires error rate monitoring middleware' },
            { level: '🔵', title: 'New Pro Customer', note: 'Requires billing & subscription integration' },
            { level: '🔵', title: 'Plan Upgrade / Downgrade', note: 'Requires subscription lifecycle tracking' },
            { level: '🟠', title: 'Security Anomaly Detection', note: 'Requires pattern analysis over audit events' },
          ].map((item) => (
            <div key={item.title} className="premium-card p-4 border-dashed border-2 border-zinc-200 dark:border-zinc-700/60 flex items-start gap-3">
              <span className="text-base">{item.level}</span>
              <div>
                <p className="text-xs font-semibold text-premium-main">{item.title}</p>
                <p className="text-[10px] text-premium-muted mt-0.5">{item.note}</p>
                <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Coming Soon</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Admin Actions */}
      {recentAdminActions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Recent Admin Actions (7 Days)</p>
          <div className="premium-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-premium">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Action</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Admin</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-premium">
                {recentAdminActions.map((evt: any) => (
                  <tr key={evt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-[10px] text-premium-muted">{evt.action}</td>
                    <td className="px-5 py-3 text-premium-main font-medium">{evt.actor?.email || '—'}</td>
                    <td className="px-5 py-3 text-premium-muted">{new Date(evt.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
