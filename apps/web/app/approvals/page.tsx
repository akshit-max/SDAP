'use client';

import React, { useState } from 'react';
import { useMyRequests, usePendingApprovals, useResolveApproval } from '../../hooks/useApprovals';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { PromptModal } from '../../components/common/PromptModal';
import { Check, X, Clock, CheckCircle, XCircle, Shield } from 'lucide-react';
import { ApprovalRequestStatus } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../../components/common/Toast';
import { formatDate, formatDateTime } from '../../lib/formatters';

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case ApprovalRequestStatus.APPROVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Approved
          </span>
        );
      case ApprovalRequestStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Pagination state
  const [reviewPage, setReviewPage] = useState(1);
  const [myReqPage, setMyReqPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const paginatedReview = pendingApprovalsToReview?.slice((reviewPage - 1) * ITEMS_PER_PAGE, reviewPage * ITEMS_PER_PAGE);
  const totalReviewPages = pendingApprovalsToReview ? Math.ceil(pendingApprovalsToReview.length / ITEMS_PER_PAGE) : 0;

  const paginatedMyRequests = myRequests?.slice((myReqPage - 1) * ITEMS_PER_PAGE, myReqPage * ITEMS_PER_PAGE);
  const totalMyReqPages = myRequests ? Math.ceil(myRequests.length / ITEMS_PER_PAGE) : 0;

  return (
    <>
    <DashboardShell>
      <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <div className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider mb-0.5">
              ACCESS GOVERNANCE
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Approval Workflows
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-normal">
              Review and manage privileged access authorization requests.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex gap-3.5 items-start">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-0.5">
              Privileged Delegated Access Control
            </h3>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed max-w-3xl">
              When a team member requests a <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Delegated Session</span> to access a vault or fill portal credentials, organization policies can require sign-off from an Owner or Admin. Approved sessions are scoped strictly to requested timeframes.
            </p>
          </div>
        </div>

        {/* Pending Approvals (Admin view) */}
        {organization?.role !== 'MEMBER' && (
          <section className="space-y-2.5">
            <div className="flex justify-between items-center px-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Access Requests To Review
                </h2>
                {pendingApprovalsToReview && pendingApprovalsToReview.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">
                    {pendingApprovalsToReview.length} pending
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
              {isLoadingPending ? (
                <div className="p-8 text-center text-xs text-zinc-500">Loading pending requests...</div>
              ) : pendingApprovalsToReview?.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 rounded-2xl flex items-center justify-center mb-3 text-zinc-400 dark:text-zinc-500">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                    All clear — nothing to review
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Pending requests will appear here when team members request access to protected vaults or platforms.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200/60 dark:divide-white/10">
                    <thead className="bg-zinc-50/60 dark:bg-white/[0.02]">
                      <tr>
                        <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Requester & Scope
                        </th>
                        <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Request Details
                        </th>
                        <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Requested On
                        </th>
                        <th scope="col" className="px-6 py-3.5 text-right text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Decision
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
                      {paginatedReview?.map((request: any) => (
                        <tr key={request.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                              {request.requester?.fullName || request.requester?.email || 'Unknown User'}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Scope: <span className="font-medium text-zinc-800 dark:text-zinc-200">{String(request.requestPayload?.scope || 'SECRET').replace('_', ' ')}</span>
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                              {request.requestPayload?.expiresAt && (
                                <div>
                                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Expires:</span>{' '}
                                  {formatDateTime(request.requestPayload.expiresAt)}
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">Max reveals:</span>{' '}
                                {request.requestPayload?.maxReveals ? request.requestPayload.maxReveals : 'Unlimited'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                            {formatDate(request.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => handleResolve(request.id, 'APPROVED')}
                                disabled={isResolving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => handleResolve(request.id, 'REJECTED')}
                                disabled={isResolving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalReviewPages > 1 && (
                    <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-between bg-zinc-50/40 dark:bg-white/[0.01]">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Page <span className="font-semibold text-zinc-900 dark:text-white">{reviewPage}</span> of <span className="font-semibold text-zinc-900 dark:text-white">{totalReviewPages}</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                          disabled={reviewPage === 1}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                          disabled={reviewPage === totalReviewPages}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* My Requests (Member view) */}
        <section className="space-y-2.5">
          <div className="flex justify-between items-center px-0.5">
            <h2 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              My Request History
            </h2>
          </div>
          <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
            {isLoadingRequests ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading your requests...</div>
            ) : myRequests?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 rounded-2xl flex items-center justify-center mb-3 text-zinc-400 dark:text-zinc-500">
                  <Clock className="w-5 h-5 text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                  No access requests submitted yet
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  When you request a <span className="font-medium text-zinc-900 dark:text-white">Delegated Session</span> that requires approval, the real-time status will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200/60 dark:divide-white/10">
                  <thead className="bg-zinc-50/60 dark:bg-white/[0.02]">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Request Type
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Scope & Expiry
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Requested On
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-right text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10">
                    {paginatedMyRequests?.map((request) => (
                      <tr key={request.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            Session Access Request
                          </p>
                          {request.reason && (
                            <p className="mt-1 text-xs text-red-500 font-medium">
                              Note: {request.reason}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                          {request.requestPayload?.scope && (
                            <div>Scope: <span className="font-medium text-zinc-800 dark:text-zinc-200">{String(request.requestPayload.scope).replace('_', ' ')}</span></div>
                          )}
                          {request.requestPayload?.expiresAt && (
                            <div className="mt-0.5">Expires: <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatDateTime(request.requestPayload.expiresAt)}</span></div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {getStatusBadge(request.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalMyReqPages > 1 && (
                  <div className="px-6 py-4 border-t border-zinc-200/60 dark:border-white/10 flex items-center justify-between bg-zinc-50/40 dark:bg-white/[0.01]">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Page <span className="font-semibold text-zinc-900 dark:text-white">{myReqPage}</span> of <span className="font-semibold text-zinc-900 dark:text-white">{totalMyReqPages}</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMyReqPage(p => Math.max(1, p - 1))}
                        disabled={myReqPage === 1}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setMyReqPage(p => Math.min(totalMyReqPages, p + 1))}
                        disabled={myReqPage === totalMyReqPages}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200/70 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
