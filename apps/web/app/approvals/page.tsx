'use client';

import React, { useState } from 'react';
import { useMyRequests, usePendingApprovals, useResolveApproval } from '../../hooks/useApprovals';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PromptModal } from '../../components/common/PromptModal';
import { Check, X, Clock, CheckCircle, XCircle, Shield } from 'lucide-react';
import { ApprovalRequestStatus } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../../components/common/Toast';

export default function ApprovalsPage() {
  const { organization, user } = useAuth();
  const orgId = organization?.id || '';
  const { toast } = useToast();
  const { data: myRequests, isLoading: isLoadingRequests } = useMyRequests(orgId);
  const { data: pendingApprovals, isLoading: isLoadingPending } = usePendingApprovals(orgId);
  const pendingApprovalsToReview = pendingApprovals?.filter((r: any) => r.requesterId !== user?.id);
  const { mutate: resolveApproval, isPending: isResolving } = useResolveApproval(orgId);

  // State for the rejection reason prompt modal
  const [rejectState, setRejectState] = useState<string | null>(null); // holds approvalId when open

  const handleApprove = (approvalId: string) => {
    resolveApproval(
      { approvalId, data: { status: 'APPROVED' } },
      {
        onSuccess: () => toast('success', 'Access Granted. A delegated session has been created automatically.'),
        onError: (err: any) => toast('error', err.message || 'Failed to approve request.'),
      }
    );
  };

  const handleRejectWithReason = (reason: string) => {
    if (!rejectState) return;
    const id = rejectState;
    setRejectState(null);
    resolveApproval({ approvalId: id, data: { status: 'REJECTED', reason: reason || undefined } });
  };

  const handleResolve = (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    if (status === 'APPROVED') {
      handleApprove(approvalId);
    } else {
      setRejectState(approvalId);
    }
  };

  const getStatusBadge = (status: ApprovalRequestStatus) => {
    switch (status) {
      case ApprovalRequestStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250/20 dark:border-amber-900/30">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case ApprovalRequestStatus.APPROVED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250/20 dark:border-emerald-900/20">
            <CheckCircle className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case ApprovalRequestStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-250/20 dark:border-red-900/30">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Approval Workflows</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Review and manage access requests.</p>
        </div>

        {/* What are approvals — info banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-4 flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-0.5">About Approval Workflows</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              When a team member requests a <span className="font-semibold">Delegated Session</span>{' '}
              to access a vault or reveal secrets, it can be configured to require approval from an Owner or Admin.
              This ensures sensitive access is always authorized before it is granted.
            </p>
          </div>
        </div>

        {/* Pending Approvals (Admin view) */}
        {organization?.role !== 'MEMBER' && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Access Requests</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              {isLoadingPending ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
              ) : pendingApprovalsToReview?.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
                    <Check className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">All clear — nothing to review</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Approval requests appear here when a team member requests a{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Delegated Session</span>.
                    As an Owner or Admin you can approve or reject these requests.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {pendingApprovalsToReview?.map((request: any) => (
                    <li key={request.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Session Access Request
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Requested by{' '}
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {request.requester?.fullName || request.requester?.email || 'Unknown'}
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          {request.requestPayload?.scope && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Scope:</span>{' '}
                              {String(request.requestPayload.scope).replace('_', ' ')}
                            </span>
                          )}
                          {request.requestPayload?.expiresAt && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Expires:</span>{' '}
                              {new Date(request.requestPayload.expiresAt).toLocaleString()}
                            </span>
                          )}
                          {request.requestPayload?.maxReveals && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Max reveals:</span>{' '}
                              {request.requestPayload.maxReveals}
                            </span>
                          )}
                          {!request.requestPayload?.maxReveals && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-slate-700 dark:text-slate-300">Max reveals:</span> Unlimited
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        
                        <div className="flex space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                          <button
                            onClick={() => handleResolve(request.id, 'APPROVED')}
                            disabled={isResolving}
                            className="inline-flex items-center px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-md font-semibold text-[11px] transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleResolve(request.id, 'REJECTED')}
                            disabled={isResolving}
                            className="inline-flex items-center px-2.5 py-1 text-slate-700 dark:text-slate-350 bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-750 rounded-md font-semibold text-[11px] transition-colors shadow-sm disabled:opacity-50"
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        )}

        {/* My Requests (Member view) */}
        <section className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Requests</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingRequests ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : myRequests?.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No requests submitted yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  When you request a <span className="font-semibold text-slate-700 dark:text-slate-300">Delegated Session</span>{' '}
                  that requires approval, it will appear here so you can track its status.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {myRequests?.map((request) => (
                  <li key={request.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Session Access Request
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        {request.requestPayload?.scope && (
                          <span>Scope: {String(request.requestPayload.scope).replace('_', ' ')} &bull; </span>
                        )}
                        {request.requestPayload?.expiresAt && (
                          <span>Expires: {new Date(request.requestPayload.expiresAt).toLocaleString()}</span>
                        )}
                      </p>
                      {request.reason && (
                        <p className="mt-1 text-xs text-red-500 font-medium">
                          Reason: {request.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-6">
                       <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(request.createdAt).toLocaleDateString()}
                       </span>
                       {getStatusBadge(request.status)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>

      {/* Rejection Reason Prompt Modal */}
      <PromptModal
        isOpen={!!rejectState}
        title="Reject Request"
        message="Provide an optional reason for the rejection. The requester will be able to see this."
        label="Reason (optional)"
        placeholder="e.g. Access not justified for this resource…"
        confirmLabel="Reject"
        isPending={isResolving}
        onConfirm={handleRejectWithReason}
        onCancel={() => setRejectState(null)}
      />
    </>
  );
}
