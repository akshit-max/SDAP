'use client';

import React, { useState } from 'react';
import { useAuditEvents } from '../../hooks/useAudit';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useOrgMembers } from '../../hooks/useOrganization';
import { formatDate, formatDateTime } from '../../lib/formatters';
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
  Clock,
  Timer,
  UserX,
  ShieldOff,
  Link,
  Link2Off,
  Lock,
  Download,
} from 'lucide-react';
import { AuditEventDto } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';
import { auditApi } from '../../lib/api/audit';

// ─── Human-readable action config ───────────────────────────────────────────

interface ActionConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const ACTION_MAP: Record<string, ActionConfig> = {
  'secret.created':     { label: 'Secret Created',      icon: <Plus className="w-3.5 h-3.5" />,      color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30' },
  'secret.updated':     { label: 'Secret Updated',      icon: <Pencil className="w-3.5 h-3.5" />,    color: 'text-indigo-700 dark:text-indigo-400',     bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/30' },
  'secret.deleted':     { label: 'Secret Deleted',      icon: <Trash2 className="w-3.5 h-3.5" />,    color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30' },
  'secret.revealed':    { label: 'Secret Revealed',     icon: <Eye className="w-3.5 h-3.5" />,       color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-900/30' },
  'session.created':    { label: 'Session Granted',     icon: <Key className="w-3.5 h-3.5" />,       color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30' },
  'session.revoked':    { label: 'Session Revoked',     icon: <X className="w-3.5 h-3.5" />,         color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30' },
  'session.expired':    { label: 'Session Expired',     icon: <Clock className="w-3.5 h-3.5" />,     color: 'text-slate-600 dark:text-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  'approval.requested': { label: 'Approval Requested',  icon: <Shield className="w-3.5 h-3.5" />,    color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/30' },
  'approval.approved':  { label: 'Approval Granted',    icon: <Check className="w-3.5 h-3.5" />,     color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30' },
  'approval.rejected':  { label: 'Approval Rejected',   icon: <X className="w-3.5 h-3.5" />,         color: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30' },
  'member.invited':     { label: 'Invitation Sent',     icon: <Mail className="w-3.5 h-3.5" />,      color: 'text-indigo-700 dark:text-indigo-400',     bg: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/30' },
  'member.joined':      { label: 'Member Joined',       icon: <UserPlus className="w-3.5 h-3.5" />,  color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30' },
  'user.login':         { label: 'Login',               icon: <LogIn className="w-3.5 h-3.5" />,     color: 'text-slate-700 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  'user.logout':        { label: 'Logout',              icon: <LogOut className="w-3.5 h-3.5" />,    color: 'text-slate-700 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
  'mek.rotated':        { label: 'Key Rotated',         icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-900/30' },
  // ─── Phase 2 events ─────────────────────────────────────────────────────────
  'session.revoke_all':         { label: 'Sessions Bulk Revoked',    icon: <ShieldOff className="w-3.5 h-3.5" />, color: 'text-red-700 dark:text-red-400',           bg: 'bg-red-50 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/30' },
  'member.offboarded':          { label: 'Member Offboarded',        icon: <UserX className="w-3.5 h-3.5" />,     color: 'text-orange-700 dark:text-orange-400',     bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200/50 dark:border-orange-900/30' },
  'integration.connected':      { label: 'Integration Connected',    icon: <Link className="w-3.5 h-3.5" />,      color: 'text-emerald-700 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/30' },
  'integration.disconnected':   { label: 'Integration Disconnected', icon: <Link2Off className="w-3.5 h-3.5" />,  color: 'text-slate-600 dark:text-slate-400',       bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
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
  return formatDate(date);
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
  { value: 'session.expired', label: 'Session Expired' },
  { value: 'session.revoke_all', label: 'Sessions Bulk Revoked' },
  { value: 'approval.requested', label: 'Approval Requested' },
  { value: 'approval.approved', label: 'Approval Granted' },
  { value: 'approval.rejected', label: 'Approval Rejected' },
  { value: 'member.offboarded', label: 'Member Offboarded' },
  { value: 'integration.connected', label: 'Integration Connected' },
  { value: 'integration.disconnected', label: 'Integration Disconnected' },
];

// ─── Duration formatter ───────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} minute${m !== 1 ? 's' : ''}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h} hour${h !== 1 ? 's' : ''}`;
}

// ─── Smart metadata row renderer ─────────────────────────────────────────────
// Shows human-readable fields for known session events.
// For all events, a collapsible "View raw" section preserves the original JSON.
function AuditMetaDetails({ action, metadata }: { action: string; metadata: Record<string, any> }) {
  const [showRaw, setShowRaw] = useState(false);
  const hasRaw = Object.keys(metadata).length > 0;

  const platformLabel = metadata.platform
    ? metadata.platform.charAt(0) + metadata.platform.slice(1).toLowerCase()
    : null;

  const expiresLabel = metadata.expiresAt
    ? formatDateTime(metadata.expiresAt)
    : null;

  const durationLabel =
    typeof metadata.durationSeconds === 'number'
      ? formatDuration(metadata.durationSeconds)
      : null;

  // Fields to render per action type
  const rows: { label: string; value: string }[] = [];

  if (action === 'session.created') {
    if (platformLabel) rows.push({ label: 'Platform', value: platformLabel });
    if (metadata.grantee) rows.push({ label: 'Granted to', value: String(metadata.grantee) });
    if (metadata.reason) rows.push({ label: 'Reason', value: String(metadata.reason) });
    if (metadata.scope) rows.push({ label: 'Scope', value: String(metadata.scope) });
    if (expiresLabel) rows.push({ label: 'Expires', value: expiresLabel });
  } else if (action === 'session.revoked') {
    if (platformLabel) rows.push({ label: 'Platform', value: platformLabel });
    if (durationLabel) rows.push({ label: 'Duration', value: durationLabel });
    if (metadata.reason) rows.push({ label: 'Reason', value: String(metadata.reason) });
  } else if (action === 'session.expired') {
    if (platformLabel) rows.push({ label: 'Platform', value: platformLabel });
    if (durationLabel) rows.push({ label: 'Duration', value: durationLabel });
    rows.push({ label: 'Status', value: 'Expired — automatic' });
  } else if (action === 'session.revoke_all') {
    if (typeof metadata.revokedCount === 'number') rows.push({ label: 'Revoked', value: `${metadata.revokedCount} session${metadata.revokedCount !== 1 ? 's' : ''}` });
    if (typeof metadata.skippedCount === 'number' && metadata.skippedCount > 0) rows.push({ label: 'Retrying', value: `${metadata.skippedCount} failed (scheduled retry)` });
  } else if (action === 'member.offboarded') {
    if (metadata.name || metadata.email) rows.push({ label: 'Member', value: String(metadata.name || metadata.email) });
    if (typeof metadata.sessionsRevoked === 'number') rows.push({ label: 'Sessions', value: `${metadata.sessionsRevoked} revoked` });
    if (typeof metadata.refreshTokensRevoked === 'number') rows.push({ label: 'Tokens', value: `${metadata.refreshTokensRevoked} invalidated` });
    if (typeof metadata.approvalsCancelled === 'number' && metadata.approvalsCancelled > 0) rows.push({ label: 'Approvals', value: `${metadata.approvalsCancelled} cancelled` });
  }

  return (
    <div className="space-y-2">
      {/* Human-readable fields — shown when we know the event type */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-1.5 min-w-[140px]">
              <span className="text-[10px] font-bold text-premium-muted uppercase tracking-wider w-20 flex-shrink-0">{label}</span>
              <span className="text-xs font-semibold text-premium-main">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Raw JSON — always available, collapsed by default */}
      {hasRaw && (
        <div>
          <button
            onClick={() => setShowRaw(r => !r)}
            className="flex items-center gap-1 text-[10px] font-bold text-premium-muted hover:text-premium-main uppercase tracking-wider transition-colors mt-1"
          >
            {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showRaw ? 'Hide raw details' : 'View raw details'}
          </button>
          {showRaw && (
            <pre className="mt-1.5 bg-slate-950 border border-premium/50 text-emerald-450 p-3 rounded-lg overflow-x-auto text-[10px] leading-relaxed font-mono">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Fallback for events with no metadata at all */}
      {!hasRaw && rows.length === 0 && (
        <span className="text-xs text-premium-muted italic">No additional details.</span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: membersData = [] } = useOrgMembers(orgId);

  const { data, isLoading, isError } = useAuditEvents(orgId, {
    action: actionFilter || undefined,
    actorId: actorFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: String(page),
    limit: '10',
  });

  // Plan is returned by the backend alongside audit data — no second API call needed.
  const plan = (data as any)?.plan ?? null;
  const isFree = plan === 'FREE';
  const isBusiness = plan === 'BUSINESS';

  // Calculate the minimum allowed date (7 days ago) for Free plan to restrict UI date picker
  const minAllowedDate = isFree
    ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : undefined;

  const handleExport = async () => {
    if (!orgId) return;
    setIsExporting(true);
    try {
      const blob = await auditApi.exportAuditCsv(orgId, {
        action: actionFilter || undefined,
        actorId: actorFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `withus-audit-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Backend returns 403 for non-Business — UI already hides the button,
      // but this guard prevents any edge-case error from being unhandled.
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setActorFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-2">
              <Shield className="w-3 h-3 text-indigo-500" />
              Compliance & Forensics
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Audit Trail
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Immutable chronological record of security and operational events across <span className="font-medium text-zinc-800 dark:text-zinc-200">{organization?.name}</span>.
            </p>
          </div>
          {/* BUSINESS: Export CSV button */}
          {isBusiness && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-all shadow-sm flex-shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
        </div>

        {/* FREE: 7-day history restriction banner */}
        {isFree && (
          <div className="flex items-start gap-3.5 p-4 rounded-[20px] border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/15">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">7-Day Retention Limit (Free Workspace)</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                Free plan displays events from the last 7 days.
                {' '}<a href="/pricing" className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100 transition-colors">Upgrade to Pro or Business</a>
                {' '}for perpetual retention and cryptographic export verification.
              </p>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="rounded-[24px] border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event type */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Event Type</label>
              <select
                className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-all"
                value={actionFilter}
                onChange={handleFilterChange(setActionFilter)}
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900">{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Actor / member */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Actor</label>
              <select
                className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-all"
                value={actorFilter}
                onChange={handleFilterChange(setActorFilter)}
              >
                <option value="" className="bg-white dark:bg-zinc-900">All Members</option>
                {membersData.map((m: any) => (
                  <option key={m.userId} value={m.userId} className="bg-white dark:bg-zinc-900">
                    {m.user?.fullName || m.user?.email || m.userId}
                  </option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">From Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-all"
                value={startDate}
                onChange={handleFilterChange(setStartDate)}
                max={endDate || undefined}
                min={minAllowedDate}
              />
            </div>

            {/* End date */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">To Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-all"
                  value={endDate}
                  onChange={handleFilterChange(setEndDate)}
                  min={startDate || undefined}
                />
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-[28px] border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-zinc-200/60 dark:divide-white/10">
              <thead className="bg-zinc-50/60 dark:bg-white/[0.02]">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Event</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Actor</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">Target Resource</th>
                  <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-zinc-400">
                      <Activity className="w-5 h-5 mx-auto mb-2 animate-pulse text-zinc-400" />
                      Loading events...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <ShieldOff className="w-8 h-8 mx-auto mb-3 text-red-500/50" />
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">Failed to load audit events</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Please try refreshing the page.
                      </p>
                    </td>
                  </tr>
                ) : !data?.data?.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <Shield className="w-8 h-8 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No events found</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Events will appear here as your team performs operations.
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.data.map((event: AuditEventDto) => {
                    const cfg = getActionConfig(event.action);
                    const actorName = (event.actor as any)?.fullName || (event.actor as any)?.email || 'System';
                    const actorEmail = (event.actor as any)?.fullName ? (event.actor as any)?.email : null;

                    // Build a friendly resource label (never show raw UUID)
                    const typeLabel = event.resourceType
                      ? event.resourceType.charAt(0) + event.resourceType.slice(1).toLowerCase().replace('_', ' ')
                      : null;
                    const resourceLabel = typeLabel
                      ? ((event as any).resourceName ? `${typeLabel}: ${(event as any).resourceName.split('_deleted_')[0]}` : typeLabel)
                      : null;

                    return (
                      <React.Fragment key={event.id}>
                        <tr className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          {/* Event */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>

                          {/* Actor */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                                  {actorName[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-zinc-900 dark:text-white">{actorName}</p>
                                {actorEmail && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{actorEmail}</p>}
                              </div>
                            </div>
                          </td>

                          {/* Resource */}
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            {resourceLabel ? (
                              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">
                                {resourceLabel}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
                            )}
                          </td>

                          {/* When */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="text-xs text-zinc-500 dark:text-zinc-400"
                              title={formatDateTime(event.createdAt)}
                            >
                              {relativeTime(event.createdAt)}
                            </span>
                          </td>

                          {/* Details toggle */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => toggleRow(event.id)}
                              className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                              title="View details"
                            >
                              {expandedRow === event.id ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {expandedRow === event.id && (
                          <tr className="bg-zinc-50/50 dark:bg-white/[0.01]">
                            <td colSpan={5} className="px-6 py-4 border-t border-zinc-200/40 dark:border-white/5">
                              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Event Timestamp</p>
                                    <p className="font-medium text-zinc-900 dark:text-white">{formatDateTime(event.createdAt)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Resource Class</p>
                                    <p className="font-medium text-zinc-900 dark:text-white">{event.resourceType || '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">Schema Version</p>
                                    <p className="font-medium text-zinc-900 dark:text-white">v{event.eventVersion}</p>
                                  </div>
                                </div>
                                {Boolean(event.metadata) && (
                                  <>
                                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Context Metadata</p>
                                    <AuditMetaDetails
                                      action={event.action}
                                      metadata={(event.metadata as Record<string, any>) ?? {}}
                                    />
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
            <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-between bg-zinc-50/40 dark:bg-white/[0.01]">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Page <span className="font-semibold text-zinc-900 dark:text-white">{page}</span> of{' '}
                <span className="font-semibold text-zinc-900 dark:text-white">{data.totalPages}</span>
                {' '}· <span className="font-semibold text-zinc-900 dark:text-white">{data.total}</span> total events
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
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
