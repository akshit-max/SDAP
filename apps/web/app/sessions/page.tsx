'use client';

import React, { useState } from 'react';
import { useIncomingSessions, useOutgoingSessions, useRevokeSession } from '../../hooks/useSessions';
import { sessionsApi } from '../../lib/api/sessions';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { CreateSessionModal } from '../../components/sessions/CreateSessionModal';
import { RequestAccessModal } from '../../components/sessions/RequestAccessModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PromptModal } from '../../components/common/PromptModal';
import { Plus, Trash2, Clock, CheckCircle2, XCircle, Eye, Loader2, Users, ArrowRight, Shield } from 'lucide-react';
import { SessionStatus } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { hasPermission } from '../../lib/auth/permissions';

export default function SessionsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const { toast } = useToast();

  const { data: incomingSessions, isLoading: isLoadingIncoming, refetch: refetchIncoming } = useIncomingSessions(orgId);
  const { data: outgoingSessions, isLoading: isLoadingOutgoing } = useOutgoingSessions(orgId);
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession(orgId);

  const canGrantAccess = hasPermission(organization?.role, 'SESSION_REVOKE');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incPage, setIncPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const paginatedIncoming = incomingSessions?.slice((incPage - 1) * ITEMS_PER_PAGE, incPage * ITEMS_PER_PAGE);
  const totalIncPages = incomingSessions ? Math.ceil(incomingSessions.length / ITEMS_PER_PAGE) : 0;

  const paginatedOutgoing = outgoingSessions?.slice((outPage - 1) * ITEMS_PER_PAGE, outPage * ITEMS_PER_PAGE);
  const totalOutPages = outgoingSessions ? Math.ceil(outgoingSessions.length / ITEMS_PER_PAGE) : 0;

  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const canCreateSession = !!orgId;

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
    if (status === SessionStatus.REVOKED) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-400/30 flex-shrink-0">
          <XCircle className="w-3 h-3" />
          <span>Revoked</span>
        </span>
      );
    }

    if (status === SessionStatus.EXPIRED || new Date(expiresAt) <= new Date()) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/10 flex-shrink-0">
          <Clock className="w-3 h-3" />
          <span>Expired</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-400/30 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Active</span>
      </span>
    );
  };

  const handleRevokeConfirmed = () => {
    if (!confirmRevokeId) return;
    const id = confirmRevokeId;
    setConfirmRevokeId(null);
    revokeSession(id, {
      onSuccess: () => toast('success', 'Session revoked.'),
      onError: () => toast('error', 'Failed to revoke session.'),
    });
  };

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <div className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider mb-0.5">
              TEMPORARY ALLOCATIONS
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Delegated Sessions
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-normal">
              Manage live, time-bound credential sessions with instant kill-switch revocation.
            </p>
          </div>

          {canCreateSession && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{canGrantAccess ? 'Create Delegated Session' : 'Request Temporary Access'}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Incoming Sessions */}
          <section className="space-y-2.5">
            <div className="flex justify-between items-end px-0.5">
              <h2 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                My Delegated Access
              </h2>
            </div>

            <div className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              {isLoadingIncoming ? (
                <div className="p-8 text-center text-xs text-[#86868B]">Loading active sessions…</div>
              ) : !incomingSessions?.length ? (
                <div className="p-8 text-center text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">
                  No active sessions assigned to you. Request temporary access to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#E5E5EA]/60 dark:divide-[#2C2C2E]/60">
                    <thead className="bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
                      <tr>
                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Resource</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Granted By</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Status / Uses</th>
                        <th scope="col" className="px-6 py-3.5 text-right text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                      {paginatedIncoming?.map((session) => {
                        const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                        return (
                          <tr key={session.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.04] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                {(session.scope as string) === 'INTEGRATION' ? (
                                  `${(session as any).integrationProvider} Access`
                                ) : `${session.scope} Access`}
                              </p>
                              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {(session.scope as string) === 'INTEGRATION' ? (
                                  (session as any).integrationProvider === 'GODADDY' ? `Domain: ${(session as any).integrationResourceExternalId}` : 
                                  (session as any).integrationProvider === 'VERCEL' ? `Project: ${(session as any).integrationResourceExternalId}` : 
                                  `Repository: ${(session as any).integrationResourceExternalId}`
                                ) : (session.resourceName || session.resourceId).split('_deleted_')[0]}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-semibold">
                                {session.grantor?.fullName || session.grantor?.email || session.grantorId}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {getStatusBadge(session.status, session.expiresAt)}
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-col font-medium">
                                  <span>{formatExpiry(session.expiresAt)}</span>
                                  {(session.scope as string) !== 'INTEGRATION' && (
                                    <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {isActive && (session.scope as string) === 'INTEGRATION' && (
                                (session as any).integrationProvider === 'GODADDY' || 
                                (session as any).integrationProvider === 'HOSTINGER' || 
                                (session as any).integrationProvider === 'CPANEL' ? (
                                  <a
                                    href={(session as any).integrationProvider === 'GODADDY' ? 'https://sso.godaddy.com/' : 
                                          (session as any).integrationProvider === 'HOSTINGER' ? 'https://hpanel.hostinger.com/' : 
                                          'https://cpanel.net/'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-sm"
                                  >
                                    <span>Launch Session</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    Managed by Extension
                                  </span>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {totalIncPages > 1 && (
                    <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        Page <span className="font-bold text-zinc-900 dark:text-white">{incPage}</span> of <span className="font-bold text-zinc-900 dark:text-white">{totalIncPages}</span>
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setIncPage(p => Math.max(1, p - 1))} disabled={incPage === 1} className="px-3 py-1 rounded-full text-xs font-semibold border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 disabled:opacity-40">Prev</button>
                        <button onClick={() => setIncPage(p => Math.min(totalIncPages, p + 1))} disabled={incPage === totalIncPages} className="px-3 py-1 rounded-full text-xs font-semibold border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 disabled:opacity-40">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
  
          {canGrantAccess && (
            <section className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <h2 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Access I&apos;ve Granted
                </h2>
              </div>

              <div className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {isLoadingOutgoing ? (
                  <div className="p-8 text-center text-xs text-[#86868B]">Loading granted sessions…</div>
                ) : !outgoingSessions?.length ? (
                  <div className="p-8 text-center text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">
                    No active sessions granted yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E5E5EA]/60 dark:divide-[#2C2C2E]/60">
                      <thead className="bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
                        <tr>
                          <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Grantee</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Scope / Resource</th>
                          <th scope="col" className="px-6 py-3.5 text-left text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Status / Uses</th>
                          <th scope="col" className="px-6 py-3.5 text-right text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-widest">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                        {paginatedOutgoing?.map((session) => {
                          const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                          return (
                            <tr key={session.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.04] transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                  {session.grantee?.fullName || session.grantee?.email || session.granteeId}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                  {(session.scope as string) === 'INTEGRATION' ? (
                                    (session as any).integrationProvider === 'GODADDY' ? 'Browser Extension' : 
                                    (session as any).integrationProvider === 'VERCEL' ? `Vercel · ${(session as any).integrationResourceExternalId}` :
                                    `GitHub · ${(session as any).integrationResourceExternalId}`
                                  ) : `${session.scope} · ${(session.resourceName || session.resourceId).split('_deleted_')[0]}`}
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  {getStatusBadge(session.status, session.expiresAt)}
                                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-col font-medium">
                                    <span>{formatExpiry(session.expiresAt)}</span>
                                    {(session.scope as string) !== 'INTEGRATION' && (
                                      <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                {isActive && (
                                  <button
                                    onClick={() => setConfirmRevokeId(session.id)}
                                    disabled={isRevoking}
                                    aria-label="Revoke session"
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-rose-200/60 dark:border-rose-400/30 transition-colors disabled:opacity-50"
                                    title="Revoke Session"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Revoke</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {totalOutPages > 1 && (
                      <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                          Page <span className="font-bold text-zinc-900 dark:text-white">{outPage}</span> of <span className="font-bold text-zinc-900 dark:text-white">{totalOutPages}</span>
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setOutPage(p => Math.max(1, p - 1))} disabled={outPage === 1} className="px-3 py-1 rounded-full text-xs font-semibold border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 disabled:opacity-40">Prev</button>
                          <button onClick={() => setOutPage(p => Math.min(totalOutPages, p + 1))} disabled={outPage === totalOutPages} className="px-3 py-1 rounded-full text-xs font-semibold border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 disabled:opacity-40">Next</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {canGrantAccess ? (
          <CreateSessionModal
            orgId={orgId}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        ) : (
          <RequestAccessModal
            orgId={orgId}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        )}

        {/* Revoke Confirm Modal */}
        <ConfirmModal
          isOpen={!!confirmRevokeId}
          title="Revoke Session"
          message="Are you sure you want to revoke this session? The user will immediately lose access."
          confirmLabel="Revoke"
          danger
          isPending={isRevoking}
          onConfirm={handleRevokeConfirmed}
          onCancel={() => setConfirmRevokeId(null)}
        />
      </div>
    </DashboardShell>
  );
}
