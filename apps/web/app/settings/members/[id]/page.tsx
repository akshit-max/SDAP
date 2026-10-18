'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '../../../../components/layout/DashboardShell';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { useOrgMembers } from '../../../../hooks/useOrganization';
import { useSessionsByMember, useRevokeSession, useRevokeAllForMember } from '../../../../hooks/useSessions';
import { Loading } from '../../../../components/common/Loading';
import { useToast } from '../../../../components/common/Toast';
import { ConfirmModal } from '../../../../components/common/ConfirmModal';
import { 
  ArrowLeft, 
  ShieldOff, 
  Trash2, 
  Loader2,
  Key,
  GitBranch,
  Globe,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Search
} from 'lucide-react';
import clsx from 'clsx';
import { SessionStatus } from '@repo/types';

const formatExpiry = (expiresAt: string | Date) => {
  const d = new Date(expiresAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins <= 0) return `Expired`;
  if (diffMins < 60) return `Expires in ${diffMins}m`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `Expires in ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `Expires in ${diffDays}d`;
};

const getStatusBadge = (status: SessionStatus, expiresAt: string | Date) => {
  if (status === 'REVOKED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/30 dark:border-red-900/30 flex-shrink-0">
        <XCircle className="w-3 h-3 mr-1" /> Revoked
      </span>
    );
  }

  if (status === 'EXPIRED' || new Date(expiresAt) <= new Date()) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/30 flex-shrink-0">
        <Clock className="w-3 h-3 mr-1" /> Expired
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 dark:border-emerald-900/20 flex-shrink-0">
      <CheckCircle className="w-3 h-3 mr-1" /> {status === 'REVOKE_FAILED' ? 'Retry' : 'Active'}
    </span>
  );
};

function ResourceIcon({ provider }: { provider?: string | null }) {
  if (provider === 'GITHUB') return <GitBranch className="w-3 h-3 text-slate-500" />;
  if (provider === 'GODADDY') return <Globe className="w-3 h-3 text-slate-500" />;
  return <Key className="w-3 h-3 text-slate-500" />;
}

type FilterType = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export default function MemberSessionsPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id as string;
  const { organization } = useAuth();
  const orgId = organization?.id || '';

  const { data: members = [], isLoading: isLoadingMembers } = useOrgMembers(orgId);
  const { data: allSessions = [], isLoading: isLoadingSessions, refetch } = useSessionsByMember(orgId, memberId);
  
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession(orgId);
  const { mutate: revokeAll, isPending: isRevokingAll } = useRevokeAllForMember(orgId);
  const { toast } = useToast();

  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  const member = members.find(m => m.userId === memberId);
  const memberName = member?.user?.fullName || member?.user?.email || 'Unknown Member';

  // Sort sessions: ACTIVE/REVOKE_FAILED first, then by date descending
  const sortedSessions = useMemo(() => {
    return [...allSessions].sort((a, b) => {
      const aActive = a.status === 'ACTIVE' || a.status === 'REVOKE_FAILED';
      const bActive = b.status === 'ACTIVE' || b.status === 'REVOKE_FAILED';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allSessions]);

  // Apply Filter and Search
  const filteredSessions = useMemo(() => {
    return sortedSessions.filter((session) => {
      if (filter === 'ACTIVE' && session.status !== 'ACTIVE' && session.status !== 'REVOKE_FAILED') return false;
      if (filter === 'EXPIRED' && session.status !== 'EXPIRED') return false;
      if (filter === 'REVOKED' && session.status !== 'REVOKED') return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const resourceName = ((session.resourceName || '').split('_deleted_')[0] || session.integrationProvider || 'Secret').toLowerCase();
        const caps = (session.capabilities || []).join(' ').toLowerCase();
        if (!resourceName.includes(query) && !caps.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [sortedSessions, filter, searchQuery]);

  // Apply Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, page, pageSize]);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  const activeSessionsCount = allSessions.filter((s: any) => s.status === 'ACTIVE' || s.status === 'REVOKE_FAILED').length;

  const handleRevokeOne = (sessionId: string) => {
    setRevokingSessionId(sessionId);
    revokeSession(sessionId, {
      onSuccess: () => {
        toast('success', 'Session revoked.');
        refetch();
        setRevokingSessionId(null);
      },
      onError: (err) => {
        toast('error', err.message || 'Failed to revoke session.');
        setRevokingSessionId(null);
      },
    });
  };

  const handleRevokeAll = () => {
    revokeAll(memberId, {
      onSuccess: (data) => {
        toast('success', `Revoked ${data.revokedCount} session${data.revokedCount !== 1 ? 's' : ''}.`);
        refetch();
      },
      onError: (err) => {
        toast('error', err.message || 'Failed to revoke all sessions.');
      },
    });
  };

  if (isLoadingMembers || isLoadingSessions) {
    return (
      <DashboardShell>
        <div className="p-6 bg-premium-surface">
          <Loading message="Loading member sessions..." />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-200/80 dark:border-white/10 gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => router.push('/settings/members')}
              className="p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-full bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 shadow-sm transition-all hover:scale-105"
              title="Back to Team"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-[1.5px] bg-sky-500" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  MEMBER ACCESS CONTROL
                </span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{memberName}</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Active credential authorizations and session delegations for this team member.
              </p>
            </div>
          </div>
          {activeSessionsCount > 0 && (
            <button
              onClick={() => setConfirmRevokeAll(true)}
              disabled={isRevokingAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              <span>Revoke All Active Access ({activeSessionsCount})</span>
            </button>
          )}
        </div>

        {/* Filters and Table */}
        <div className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-sky-500" />
              Filter by Status
            </h2>
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'px-3 py-1 text-[11px] font-bold rounded-full transition-all border',
                    filter === f 
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent shadow-sm'
                      : 'bg-white/60 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white border-zinc-200 dark:border-white/10'
                  )}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 py-3.5 border-b border-zinc-100 dark:border-white/10 bg-white/40 dark:bg-white/[0.01]">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search sessions by resource name or capability..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
              />
            </div>
          </div>

          {!filteredSessions.length ? (
            <div className="p-12 text-center text-xs font-medium text-zinc-400">
              No sessions found matching this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 dark:divide-white/5">
                <thead className="bg-zinc-50/50 dark:bg-white/[0.02]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Resource / Scope</th>
                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Capabilities</th>
                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Usage</th>
                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Status / Expiry</th>
                    <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {paginatedSessions.map((session: any) => {
                    const isActive = session.status === 'ACTIVE' || session.status === 'REVOKE_FAILED';
                    const isThisRevoking = revokingSessionId === session.id && isRevoking;
                    return (
                      <tr key={session.id} className={clsx(
                        'hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors',
                        !isActive && 'opacity-60'
                      )}>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <ResourceIcon provider={session.integrationProvider} />
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">
                              {(session.resourceName || '').split('_deleted_')[0] || session.integrationProvider || 'Secret'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {session.capabilities?.length > 0 ? session.capabilities.join(', ') : 'Full Access'}
                          </p>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          {session.scope !== 'INTEGRATION' ? (
                            <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                              {session.revealCount} / {session.maxReveals ?? '∞'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400 font-medium italic">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(session.status, session.expiresAt)}
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                              {formatExpiry(session.expiresAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-right">
                          {isActive && (
                            <button
                              onClick={() => handleRevokeOne(session.id)}
                              disabled={isThisRevoking || isRevoking}
                              title="Revoke this session"
                              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50 inline-flex items-center"
                            >
                              {isThisRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Page <span className="font-bold text-zinc-900 dark:text-white">{page}</span> of <span className="font-bold text-zinc-900 dark:text-white">{totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      disabled={page === 1} 
                      className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                      disabled={page === totalPages} 
                      className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmRevokeAll}
        title="Revoke All Access"
        message={`This will revoke all ${activeSessionsCount} active session${activeSessionsCount !== 1 ? 's' : ''} currently granted to ${memberName}. This cannot be undone.`}
        confirmLabel="Revoke All"
        danger
        isPending={isRevokingAll}
        onConfirm={() => { setConfirmRevokeAll(false); handleRevokeAll(); }}
        onCancel={() => setConfirmRevokeAll(false)}
      />
    </DashboardShell>
  );
}
