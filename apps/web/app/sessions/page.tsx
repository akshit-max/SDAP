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

  // Called after the user submits the PromptModal with a reason
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

  // Called after the user confirms revocation
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
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {incomingSessions.map((session) => {
                  const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                  return (
                    <li key={session.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left: scope + resource */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {session.scope} Access
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                            {session.resourceName || session.resourceId}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            Granted By: {session.grantor?.fullName || session.grantor?.email || session.grantorId}
                          </p>
                        </div>

                        {/* Right: meta + actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col items-end gap-0.5 font-medium whitespace-nowrap">
                            <span>{formatExpiry(session.expiresAt)}</span>
                            <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                          </div>
                          {getStatusBadge(session.status, session.expiresAt)}
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
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
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
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {outgoingSessions.map((session) => {
                  const isActive = session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date();
                  return (
                    <li key={session.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {/* Left: grantee + scope */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {session.grantee?.fullName || session.grantee?.email || session.granteeId}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {session.scope} · {session.resourceName || session.resourceId}
                          </p>
                        </div>

                        {/* Right: meta + revoke */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-col items-end gap-0.5 font-medium whitespace-nowrap">
                            <span>{formatExpiry(session.expiresAt)}</span>
                            <span>Uses: {session.revealCount} / {session.maxReveals ?? '∞'}</span>
                          </div>
                          {getStatusBadge(session.status, session.expiresAt)}
                          {isActive && (
                            <button
                              onClick={() => setConfirmRevokeId(session.id)}
                              disabled={isRevoking}
                              aria-label="Revoke session"
                              className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors disabled:opacity-50"
                              title="Revoke Session"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
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
