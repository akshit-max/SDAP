'use client';

import React, { useState } from 'react';
import { useIncomingSessions, useOutgoingSessions, useRevokeSession } from '../../hooks/useSessions';
import { sessionsApi } from '../../lib/api/sessions';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { CreateSessionModal } from '../../components/sessions/CreateSessionModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PromptModal } from '../../components/common/PromptModal';
import { Plus, Trash2, Clock, CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { SessionStatus } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../../components/common/Toast';

export default function SessionsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const { toast } = useToast();

  const { data: incomingSessions, isLoading: isLoadingIncoming, refetch: refetchIncoming } = useIncomingSessions(orgId);
  const { data: outgoingSessions, isLoading: isLoadingOutgoing } = useOutgoingSessions(orgId);
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession(orgId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [revealModal, setRevealModal] = useState<{ value: string; sessionId: string } | null>(null);

  // Pagination states
  const [incPage, setIncPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const paginatedIncoming = incomingSessions?.slice((incPage - 1) * ITEMS_PER_PAGE, incPage * ITEMS_PER_PAGE);
  const totalIncPages = incomingSessions ? Math.ceil(incomingSessions.length / ITEMS_PER_PAGE) : 0;

  const paginatedOutgoing = outgoingSessions?.slice((outPage - 1) * ITEMS_PER_PAGE, outPage * ITEMS_PER_PAGE);
  const totalOutPages = outgoingSessions ? Math.ceil(outgoingSessions.length / ITEMS_PER_PAGE) : 0;

  // Prompt modal state (replaces window.prompt for reveal reason)
  const [promptState, setPromptState] = useState<{
    sessionId: string;
    sessionOrgId: string;
  } | null>(null);

  // Confirm modal state (replaces window.confirm for revoke)
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
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/30 dark:border-red-900/30 flex-shrink-0">
          <XCircle className="w-3 h-3 mr-1" /> Revoked
        </span>
      );
    }

    if (status === SessionStatus.EXPIRED || new Date(expiresAt) <= new Date()) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/30 flex-shrink-0">
          <Clock className="w-3 h-3 mr-1" /> Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 dark:border-emerald-900/20 flex-shrink-0">
        <CheckCircle className="w-3 h-3 mr-1" /> Active
      </span>
    );
  };

  const handleRevealWithReason = async (reason: string) => {
    if (!promptState) return;
    const { sessionId, sessionOrgId } = promptState;
    setPromptState(null);
    setRevealingId(sessionId);
    try {
      const plaintext = await sessionsApi.revealSecretViaSession(sessionOrgId, sessionId, reason);
      setRevealModal({ value: plaintext, sessionId });
      refetchIncoming();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to reveal secret. Please try again.';
      toast('error', msg);
    } finally {
      setRevealingId(null);
    }
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-1">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Delegated Sessions</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage time-bound access delegations.</p>
          </div>
          {canCreateSession && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
            >
              <Plus className="-ml-0.5 mr-1.5 h-3.5 w-3.5" />
              Create Session
            </button>
          )}
        </div>

        {/* Incoming Sessions */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Granted to Me (Incoming)</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingIncoming ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : !incomingSessions?.length ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
                You do not have any incoming delegated sessions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                    <tr>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resource</th>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Granted By</th>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status / Uses</th>
                      <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/50">
                    {paginatedIncoming?.map((session) => {
                      const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                      return (
                        <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {(session.scope as string) === 'INTEGRATION' ? (
                                `${(session as any).integrationProvider} Access`
                              ) : `${session.scope} Access`}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              {(session.scope as string) === 'INTEGRATION' ? (
                                (session as any).integrationProvider === 'GODADDY' ? `Domain: ${(session as any).integrationResourceExternalId}` : 
                                (session as any).integrationProvider === 'VERCEL' ? `Project: ${(session as any).integrationResourceExternalId}` : 
                                `Repository: ${(session as any).integrationResourceExternalId}`
                              ) : (session.resourceName || session.resourceId)}
                            </p>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {session.grantor?.fullName || session.grantor?.email || session.grantorId}
                            </p>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session.status, session.expiresAt)}
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-col font-medium">
                                <span>{formatExpiry(session.expiresAt)}</span>
                                {(session.scope as string) !== 'INTEGRATION' && (
                                  <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            {isActive && session.scope === 'SECRET' && (
                              <button
                                onClick={() => setPromptState({ sessionId: session.id, sessionOrgId: session.organizationId })}
                                disabled={revealingId === session.id}
                                aria-label="Reveal secret"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-md font-semibold text-[11px] transition-colors shadow-sm disabled:opacity-60"
                              >
                                {revealingId === session.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Eye className="w-3 h-3" />
                                }
                                Reveal
                              </button>
                            )}
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-[10px] uppercase tracking-wide transition-colors shadow-sm"
                                >
                                  Launch Session
                                </a>
                              ) : (
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  Managed by WITHUS
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
                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">
                      Page <span className="font-bold text-slate-700 dark:text-slate-200">{incPage}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{totalIncPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setIncPage(p => Math.max(1, p - 1))} disabled={incPage === 1} className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40">Prev</button>
                      <button onClick={() => setIncPage(p => Math.min(totalIncPages, p + 1))} disabled={incPage === totalIncPages} className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Outgoing Sessions */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Granted by Me (Outgoing)</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingOutgoing ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : !outgoingSessions?.length ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
                You have not created any delegated sessions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                    <tr>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grantee</th>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scope / Resource</th>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status / Uses</th>
                      <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/50">
                    {paginatedOutgoing?.map((session) => {
                      const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                      return (
                        <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {session.grantee?.fullName || session.grantee?.email || session.granteeId}
                            </p>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {(session.scope as string) === 'INTEGRATION' ? (
                                (session as any).integrationProvider === 'GODADDY' ? 'Browser Extension' : 
                                (session as any).integrationProvider === 'VERCEL' ? `Vercel · ${(session as any).integrationResourceExternalId}` :
                                `GitHub · ${(session as any).integrationResourceExternalId}`
                              ) : `${session.scope} · ${session.resourceName || session.resourceId}`}
                            </p>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session.status, session.expiresAt)}
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-col font-medium">
                                <span>{formatExpiry(session.expiresAt)}</span>
                                {(session.scope as string) !== 'INTEGRATION' && (
                                  <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap text-right">
                            {isActive && (
                              <button
                                onClick={() => setConfirmRevokeId(session.id)}
                                disabled={isRevoking}
                                aria-label="Revoke session"
                                className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors disabled:opacity-50 inline-flex"
                                title="Revoke Session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {totalOutPages > 1 && (
                  <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">
                      Page <span className="font-bold text-slate-700 dark:text-slate-200">{outPage}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{totalOutPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setOutPage(p => Math.max(1, p - 1))} disabled={outPage === 1} className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40">Prev</button>
                      <button onClick={() => setOutPage(p => Math.min(totalOutPages, p + 1))} disabled={outPage === totalOutPages} className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40">Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <CreateSessionModal
          orgId={orgId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        {/* Reveal Reason Prompt Modal */}
        <PromptModal
          isOpen={!!promptState}
          title="Reveal Secret"
          message="Provide a reason for this reveal. It will be recorded in the audit log."
          label="Reason"
          placeholder="e.g. Debugging production issue, deploying release…"
          confirmLabel="Reveal"
          required
          isPending={!!revealingId}
          onConfirm={handleRevealWithReason}
          onCancel={() => setPromptState(null)}
        />

        {/* Revoke Confirm Modal */}
        <ConfirmModal
          isOpen={!!confirmRevokeId}
          title="Revoke Session"
          message="Are you sure you want to revoke this session? The grantee will immediately lose access."
          confirmLabel="Revoke"
          danger
          isPending={isRevoking}
          onConfirm={handleRevokeConfirmed}
          onCancel={() => setConfirmRevokeId(null)}
        />

        {/* Reveal Value Modal */}
        {revealModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/80 dark:border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Secret Revealed</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Copy the value and close immediately.</p>
                </div>
              </div>
              <div className="bg-slate-950 dark:bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
                <p className="font-mono text-sm text-emerald-400 break-all select-all">{revealModal.value}</p>
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-4">
                ⚠️ This value is shown once. It will not be shown again without another reveal.
              </p>
              <button
                onClick={() => setRevealModal(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
