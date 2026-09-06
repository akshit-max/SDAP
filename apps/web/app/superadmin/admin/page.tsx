'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { superAdminApi } from '../../../lib/api/superadmin';
import { Crown, RefreshCw, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

export default function AdminManagementPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminApi.getSuperAdmins();
      setData(res.data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const admins: any[] = data?.admins || [];
  const recentActivity: any[] = data?.recentActivity || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-premium-main flex items-center gap-2">
            <Crown className="w-4 h-4" /> Admin Management
          </h2>
          <p className="text-[11px] text-premium-muted mt-0.5">
            Platform Super Administrators — view-only in Phase 1
          </p>
        </div>
        <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 premium-button-secondary py-1.5 px-3 text-xs font-semibold">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Security Notice */}
      <div className="premium-card p-4 border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-premium-main mb-1">View-Only Access</p>
            <p className="text-[10px] text-premium-muted leading-relaxed">
              Super Admin promotion and removal requires a controlled administrative workflow and will not be available as a self-service action.
              The first Super Admin is established through a manual, controlled process. Promotion/removal features will be unlocked in a future phase after a dedicated security review.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="premium-card p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {/* Super Admins Table */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">
          Platform Super Admins ({loading ? '—' : admins.length})
        </p>
        {loading ? (
          <div className="premium-card p-5 h-32 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
        ) : admins.length === 0 ? (
          <div className="premium-card p-8 text-center">
            <Crown className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs text-premium-muted">No Super Admins found.</p>
          </div>
        ) : (
          <div className="premium-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-premium">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Name</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Email</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Last Login</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Created</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-premium">
                {admins.map((admin: any) => (
                  <tr key={admin.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3 font-semibold text-premium-main">{admin.fullName || '—'}</td>
                    <td className="px-5 py-3 text-premium-muted">{admin.email}</td>
                    <td className="px-5 py-3">
                      {admin.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-premium-muted">
                      {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-premium-muted">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 uppercase tracking-widest">
                        Coming Soon
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promote / Remove — Coming Soon */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Admin Management Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="premium-card p-5 flex flex-col items-center justify-center text-center space-y-2 min-h-[120px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
            <Crown className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="text-xs font-bold text-premium-main">Promote User to Super Admin</p>
              <p className="text-[10px] text-premium-muted mt-0.5">Requires a secure confirmation and audited approval workflow</p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Secured Workflow — Coming Soon
            </span>
          </div>
          <div className="premium-card p-5 flex flex-col items-center justify-center text-center space-y-2 min-h-[120px] border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
            <Shield className="w-5 h-5 text-zinc-400" />
            <div>
              <p className="text-xs font-bold text-premium-main">Revoke Super Admin Access</p>
              <p className="text-[10px] text-premium-muted mt-0.5">Requires secure confirmation, full audit trail, and session invalidation</p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Secured Workflow — Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Platform Audit Activity */}
      {recentActivity.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Recent Platform Admin Activity</p>
          <div className="premium-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-premium">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Action</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Admin</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Target</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-premium-muted">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-premium">
                {recentActivity.map((evt: any) => (
                  <tr key={evt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-[10px] text-premium-muted">{evt.action}</td>
                    <td className="px-5 py-3 font-medium text-premium-main">{evt.actor?.email || '—'}</td>
                    <td className="px-5 py-3 text-premium-muted">{evt.targetId || '—'}</td>
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
