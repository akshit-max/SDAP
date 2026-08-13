'use client';

import React, { useState } from 'react';
import { useIncomingSessions, useOutgoingSessions, useRevokeSession } from '../../hooks/useSessions';
import { usePresence } from '../../hooks/usePresence';
import { sessionsApi } from '../../lib/api/sessions';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { CreateSessionModal } from '../../components/sessions/CreateSessionModal';
import { RequestAccessModal } from '../../components/sessions/RequestAccessModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { PromptModal } from '../../components/common/PromptModal';
import { Plus, Trash2, Clock, CheckCircle, XCircle, Eye, Loader2, Radio } from 'lucide-react';
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

  const canGrantAccess = organization?.role === 'OWNER' || organization?.role === 'ADMIN';

  // Presence: poll every 30s, only for admins/owners
  const { presenceMap } = usePresence(orgId || null, canGrantAccess);

  const [isModalOpen, setIsModalOpen] = useState(false);
  // Pagination states
  const [incPage, setIncPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const paginatedIncoming = incomingSessions?.slice((incPage - 1) * ITEMS_PER_PAGE, incPage * ITEMS_PER_PAGE);
  const totalIncPages = incomingSessions ? Math.ceil(incomingSessions.length / ITEMS_PER_PAGE) : 0;

  const paginatedOutgoing = outgoingSessions?.slice((outPage - 1) * ITEMS_PER_PAGE, outPage * ITEMS_PER_PAGE);
  const totalOutPages = outgoingSessions ? Math.ceil(outgoingSessions.length / ITEMS_PER_PAGE) : 0;

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
        <div className="flex justify-between items-center pb-2 border-b border-premium">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-premium-main">Delegated Sessions</h1>
            <p className="text-xs text-premium-muted mt-0.5">Manage time-bound access delegations.</p>
          </div>
          {canCreateSession && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="premium-button-primary"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {canGrantAccess ? 'Create Delegated Session' : 'Request Temporary Access'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-8">
          {/* Incoming Sessions */}
          <section className="space-y-3">
            <div className="flex justify-between items-end">
              <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">My Access</h2>
            </div>
            <div className="premium-card overflow-hidden shadow-none">
              {isLoadingIncoming ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
              ) : !incomingSessions?.length ? (
                <div className="p-6 text-center text-xs font-semibold text-slate-550 dark:text-slate-400 bg-premium-surface">
                  No Active Sessions. Request temporary access from this page, or approve pending requests to create delegated sessions.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-premium">
                    <thead className="bg-slate-50/20 dark:bg-zinc-900/10">
                      <tr>
                        <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Resource</th>
                        <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Granted By</th>
                        <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Status / Uses</th>
                        <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-premium bg-premium-surface">
                      {paginatedIncoming?.map((session) => {
                        const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                        return (
                          <tr key={session.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors border-b border-premium/65 last:border-b-0">
                            <td className="px-5 py-3 whitespace-nowrap">
                              <p className="text-xs font-bold text-premium-main">
                                {(session.scope as string) === 'INTEGRATION' ? (
                                  `${(session as any).integrationProvider} Access`
                                ) : `${session.scope} Access`}
                              </p>
                              <p className="mt-0.5 text-[10px] text-premium-muted font-semibold truncate">
                                {(session.scope as string) === 'INTEGRATION' ? (
                                  (session as any).integrationProvider === 'GODADDY' ? `Domain: ${(session as any).integrationResourceExternalId}` : 
                                  (session as any).integrationProvider === 'VERCEL' ? `Project: ${(session as any).integrationResourceExternalId}` : 
                                  `Repository: ${(session as any).integrationResourceExternalId}`
                                ) : (session.resourceName || session.resourceId)}
                              </p>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <p className="text-[10px] text-premium-muted font-bold">
                                {session.grantor?.fullName || session.grantor?.email || session.grantorId}
                              </p>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(session.status, session.expiresAt)}
                                <div className="text-[10px] text-premium-muted flex flex-col font-bold">
                                  <span>{formatExpiry(session.expiresAt)}</span>
                                  {(session.scope as string) !== 'INTEGRATION' && (
                                    <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 whitespace-nowrap text-right">
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
                                    className="premium-button-primary py-1 px-2.5 text-[10px]"
                                  >
                                    Launch Session
                                  </a>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    Managed by WithUs
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
                    <div className="px-5 py-3 border-t border-premium flex items-center justify-between bg-premium-surface/50">
                      <p className="text-xs text-premium-muted font-bold">
                        Page <span className="text-premium-main">{incPage}</span> of <span className="text-premium-main">{totalIncPages}</span>
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setIncPage(p => Math.max(1, p - 1))} disabled={incPage === 1} className="premium-button-secondary py-1 px-2.5 text-[10px]">Prev</button>
                        <button onClick={() => setIncPage(p => Math.min(totalIncPages, p + 1))} disabled={incPage === totalIncPages} className="premium-button-secondary py-1 px-2.5 text-[10px]">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
  
          {canGrantAccess && (
            <section className="space-y-3">
              <div className="flex justify-between items-end">
                <h2 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">Access I've Granted</h2>
              </div>
            <div className="premium-card overflow-hidden shadow-none">
            {isLoadingOutgoing ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : !outgoingSessions?.length ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-550 dark:text-slate-400 bg-premium-surface">
                No Active Sessions. Request temporary access from this page, or approve pending requests to create delegated sessions.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-premium">
                  <thead className="bg-slate-50/20 dark:bg-zinc-900/10">
                    <tr>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Grantee</th>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Scope / Resource</th>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Presence</th>
                      <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Status / Uses</th>
                      <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-bold text-premium-muted uppercase tracking-wider border-b border-premium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-premium bg-premium-surface">
                    {paginatedOutgoing?.map((session) => {
                      const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                      return (
                        <tr key={session.id} className="hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors border-b border-premium/65 last:border-b-0">
                          <td className="px-5 py-3 whitespace-nowrap">
                            <p className="text-xs font-bold text-premium-main">
                              {session.grantee?.fullName || session.grantee?.email || session.granteeId}
                            </p>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <p className="text-[10px] text-premium-muted font-semibold">
                              {(session.scope as string) === 'INTEGRATION' ? (
                                (session as any).integrationProvider === 'GODADDY' ? 'Browser Extension' : 
                                (session as any).integrationProvider === 'VERCEL' ? `Vercel · ${(session as any).integrationResourceExternalId}` :
                                `GitHub · ${(session as any).integrationResourceExternalId}`
                              ) : `${session.scope} · ${session.resourceName || session.resourceId}`}
                            </p>
                          </td>
                          {/* ── Presence Badge ── */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            {(() => {
                              const presence = presenceMap.get(session.granteeId);
                              if (!presence) {
                                return (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40"
                                    title="No recent activity reported by the WithUs extension"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                                    Inactive
                                  </span>
                                );
                              }
                              if (presence.isActive) {
                                return (
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-900/30"
                                    title={`Extension last reported activity ${Math.round((Date.now() - new Date(presence.lastSeenAt).getTime()) / 1000)}s ago`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                                    Active · {presence.platform}
                                  </span>
                                );
                              }
                              return (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40"
                                  title={`Last seen on ${presence.platform} ${Math.round((Date.now() - new Date(presence.lastSeenAt).getTime()) / 60000)}m ago`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                                  Inactive
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(session.status, session.expiresAt)}
                              <div className="text-[10px] text-premium-muted flex flex-col font-bold">
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
                                className="p-1.5 text-premium-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 rounded-md transition-colors disabled:opacity-50 inline-flex"
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
                  <div className="px-5 py-3 border-t border-premium flex items-center justify-between bg-premium-surface/50">
                    <p className="text-xs text-premium-muted font-bold">
                      Page <span className="text-premium-main">{outPage}</span> of <span className="text-premium-main">{totalOutPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setOutPage(p => Math.max(1, p - 1))} disabled={outPage === 1} className="premium-button-secondary py-1 px-2.5 text-[10px]">Prev</button>
                      <button onClick={() => setOutPage(p => Math.min(totalOutPages, p + 1))} disabled={outPage === totalOutPages} className="premium-button-secondary py-1 px-2.5 text-[10px]">Next</button>
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
