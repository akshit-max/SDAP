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
  XCircle
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

  // Apply Filter
  const filteredSessions = useMemo(() => {
    return sortedSessions.filter((session) => {
      if (filter === 'ALL') return true;
      if (filter === 'ACTIVE') return session.status === 'ACTIVE' || session.status === 'REVOKE_FAILED';
      if (filter === 'EXPIRED') return session.status === 'EXPIRED';
      if (filter === 'REVOKED') return session.status === 'REVOKED';
      return true;
    });
  }, [sortedSessions, filter]);

  // Apply Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, page, pageSize]);

  // Reset page when filter changes
  React.useEffect(() => {
    setPage(1);
  }, [filter]);

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
        <div className="flex items-center justify-between pb-2 border-b border-premium">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/settings/members')}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-premium-main">{memberName}</h1>
              <p className="text-xs text-premium-muted mt-0.5">
                Manage granted sessions for this team member.
              </p>
            </div>
          </div>
          {activeSessionsCount > 0 && (
            <button
              onClick={() => setConfirmRevokeAll(true)}
              disabled={isRevokingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Revoke All Active Access
            </button>
          )}
        </div>

        {/* Filters and Table */}
        <div className="premium-card overflow-hidden shadow-none">
          <div className="px-5 py-3 border-b border-premium bg-slate-50/20 dark:bg-zinc-900/10 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-premium-main uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-premium-muted" />
              Filter by Status
            </h2>
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'px-2.5 py-1 text-[10px] font-bold rounded-md border transition-colors',
                    filter === f 
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                      : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                  )}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {!filteredSessions.length ? (
            <div className="p-6 text-center text-xs font-semibold text-slate-550 dark:text-slate-400 bg-premium-surface">
              No sessions found matching this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-premium">
                <thead className="bg-slate-50/20 dark:bg-zinc-900/10">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Resource / Scope</th>
                    <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Capabilities</th>
                    <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Usage</th>
                    <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Status / Expiry</th>
                    <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-premium bg-premium-surface">
                  {paginatedSessions.map((session: any) => {
                    const isActive = session.status === 'ACTIVE' || session.status === 'REVOKE_FAILED';
                    const isThisRevoking = revokingSessionId === session.id && isRevoking;
                    return (
                      <tr key={session.id} className={clsx(
                        'hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors border-b border-premium/65 last:border-b-0',
                        !isActive && 'opacity-70'
                      )}>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <ResourceIcon provider={session.integrationProvider} />
                            <p className="text-xs font-bold text-premium-main">
                              {session.resourceName || session.integrationProvider || 'Secret'}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="text-[10px] text-premium-muted font-semibold">
                            {session.capabilities?.length > 0 ? session.capabilities.join(', ') : 'Full Access'}
                          </p>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {session.scope !== 'INTEGRATION' ? (
                            <div className="flex flex-col text-[10px] font-bold text-premium-muted">
                              <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic">N/A</span>
                          )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(session.status, session.expiresAt)}
                            <div className="text-[10px] text-premium-muted flex flex-col font-bold">
                              <span>{formatExpiry(session.expiresAt)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          {isActive && (
                            <button
                              onClick={() => handleRevokeOne(session.id)}
                              disabled={isThisRevoking || isRevoking}
                              title="Revoke this session"
                              className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors disabled:opacity-50 inline-flex items-center"
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
                <div className="px-5 py-3 border-t border-premium flex items-center justify-between bg-premium-surface/50">
                  <p className="text-xs text-premium-muted font-bold">
                    Page <span className="text-premium-main">{page}</span> of <span className="text-premium-main">{totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      disabled={page === 1} 
                      className="premium-button-secondary py-1 px-2.5 text-[10px]"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                      disabled={page === totalPages} 
                      className="premium-button-secondary py-1 px-2.5 text-[10px]"
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
