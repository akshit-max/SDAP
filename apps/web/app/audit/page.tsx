'use client';

import React, { useState } from 'react';
import { useAuditEvents } from '../../hooks/useAudit';
import { DashboardShell } from '../../components/layout/DashboardShell';
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Mail,
  UserPlus,
  Check,
  X,
  Key,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { AuditEventDto } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';

// ─── Human-readable action config ───────────────────────────────────────────

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const ACTION_MAP: Record<string, ActionConfig> = {
  'secret.created':     { label: 'Secret Created',      icon: <Plus className="w-3.5 h-3.5" />,      color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30' },
  'secret.updated':     { label: 'Secret Updated',      icon: <Pencil className="w-3.5 h-3.5" />,    color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/30' },
  'secret.deleted':     { label: 'Secret Deleted',      icon: <Trash2 className="w-3.5 h-3.5" />,    color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30' },
  'secret.revealed':    { label: 'Secret Revealed',     icon: <Eye className="w-3.5 h-3.5" />,       color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-900/30' },
  'session.created':    { label: 'Session Granted',     icon: <Key className="w-3.5 h-3.5" />,       color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30' },
  'session.revoked':    { label: 'Session Revoked',     icon: <X className="w-3.5 h-3.5" />,         color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30' },
  'approval.requested': { label: 'Approval Requested',  icon: <Shield className="w-3.5 h-3.5" />,    color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30' },
  'approval.approved':  { label: 'Approval Granted',    icon: <Check className="w-3.5 h-3.5" />,     color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30' },
  'approval.rejected':  { label: 'Approval Rejected',   icon: <X className="w-3.5 h-3.5" />,         color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30' },
  'member.invited':     { label: 'Invitation Sent',     icon: <Mail className="w-3.5 h-3.5" />,      color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-900/30' },
  'member.joined':      { label: 'Member Joined',       icon: <UserPlus className="w-3.5 h-3.5" />,  color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30' },
  'user.login':         { label: 'Login',               icon: <LogIn className="w-3.5 h-3.5" />,     color: 'text-slate-700 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  'user.logout':        { label: 'Logout',              icon: <LogOut className="w-3.5 h-3.5" />,    color: 'text-slate-700 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  'mek.rotated':        { label: 'Key Rotated',         icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-900/30' },
};

const FALLBACK_ACTION: ActionConfig = {
  label: '',
  icon: <Activity className="w-3.5 h-3.5" />,
  color: 'text-slate-700 dark:text-slate-300',
  bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
};

function getActionConfig(action: string): ActionConfig {
  return ACTION_MAP[action] ?? {
    ...FALLBACK_ACTION,
    label: action.split('.').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  };
}

// ─── Relative timestamp ───────────────────────────────────────────────────────
function relativeTime(date: string | Date): string {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Action filter options ────────────────────────────────────────────────────
const ACTION_OPTIONS = [
  { value: '', label: 'All Events' },
  { value: 'secret.created', label: 'Secret Created' },
  { value: 'secret.revealed', label: 'Secret Revealed' },
  { value: 'secret.updated', label: 'Secret Updated' },
  { value: 'secret.deleted', label: 'Secret Deleted' },
  { value: 'session.created', label: 'Session Granted' },
  { value: 'session.revoked', label: 'Session Revoked' },
  { value: 'approval.requested', label: 'Approval Requested' },
  { value: 'approval.approved', label: 'Approval Granted' },
  { value: 'approval.rejected', label: 'Approval Rejected' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading } = useAuditEvents(orgId, {
    action: actionFilter || undefined,
    page: String(page),
    limit: '20',
  });

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Security and operational events across <span className="font-semibold">{organization?.name}</span>.
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-end shadow-sm">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Event Type</label>
            <select
              className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-800 dark:text-slate-200 text-xs"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setActionFilter(''); setPage(1); }}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-xs transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Event</th>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actor</th>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Resource</th>
                  <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">When</th>
                  <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-400">
                      <Activity className="w-5 h-5 mx-auto mb-2 animate-pulse text-slate-300" />
                      Loading events...
                    </td>
                  </tr>
                ) : data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Shield className="w-8 h-8 mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No events found</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Events will appear here as your team uses WITHUS.
                      </p>
                    </td>
                  </tr>
                ) : (
                  data?.data?.map((event: AuditEventDto) => {
                    const cfg = getActionConfig(event.action);
                    const actorName = (event.actor as any)?.fullName || (event.actor as any)?.email || 'System';
                    const actorEmail = (event.actor as any)?.fullName ? (event.actor as any)?.email : null;

                    // Build a friendly resource label (never show raw UUID)
                    const typeLabel = event.resourceType
                      ? event.resourceType.charAt(0) + event.resourceType.slice(1).toLowerCase().replace('_', ' ')
                      : null;
                    const resourceLabel = typeLabel
                      ? ((event as any).resourceName ? `${typeLabel}: ${(event as any).resourceName}` : typeLabel)
                      : null;

                    return (
                      <React.Fragment key={event.id}>
                        <tr className="hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors">
                          {/* Event */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>

                          {/* Actor */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                  {actorName[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{actorName}</p>
                                {actorEmail && <p className="text-[10px] text-slate-400">{actorEmail}</p>}
                              </div>
                            </div>
                          </td>

                          {/* Resource */}
                          <td className="px-5 py-3.5 whitespace-nowrap hidden sm:table-cell">
                            {resourceLabel ? (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {resourceLabel}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          {/* When */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className="text-xs text-slate-500 dark:text-slate-400 font-medium"
                              title={new Date(event.createdAt).toLocaleString()}
                            >
                              {relativeTime(event.createdAt)}
                            </span>
                          </td>

                          {/* Details toggle */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={() => toggleRow(event.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                              title="View details"
                            >
                              {expandedRow === event.id ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {expandedRow === event.id && (
                          <tr className="bg-slate-50/80 dark:bg-slate-900/80">
                            <td colSpan={5} className="px-5 py-4">
                              <div className="text-xs text-slate-700 dark:text-slate-300">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Event Time</p>
                                    <p className="font-medium">{new Date(event.createdAt).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Resource Type</p>
                                    <p className="font-medium">{event.resourceType || '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Event Version</p>
                                    <p className="font-medium">v{event.eventVersion}</p>
                                  </div>
                                </div>
                                {Boolean(event.metadata) && Object.keys(event.metadata as object).length > 0 && (
                                  <>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Metadata</p>
                                    <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[10px] leading-relaxed font-mono">
                                      {JSON.stringify(event.metadata, null, 2)}
                                    </pre>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Page <span className="font-bold text-slate-700 dark:text-slate-200">{page}</span> of{' '}
                <span className="font-bold text-slate-700 dark:text-slate-200">{data.totalPages}</span>
                {' '}· <span className="font-bold text-slate-700 dark:text-slate-200">{data.total}</span> total events
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
