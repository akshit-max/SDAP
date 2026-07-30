'use client';

import React from 'react';
import { useMyRequests, usePendingApprovals, useResolveApproval } from '../../hooks/useApprovals';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ApprovalRequestStatus } from '@repo/types';
import { useAuth } from '../../lib/auth/AuthContext';

export default function ApprovalsPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const { data: myRequests, isLoading: isLoadingRequests } = useMyRequests(orgId);
  const { data: pendingApprovals, isLoading: isLoadingPending } = usePendingApprovals(orgId);
  const { mutate: resolveApproval, isPending: isResolving } = useResolveApproval(orgId);

  const handleResolve = (approvalId: string, status: ApprovalRequestStatus.APPROVED | ApprovalRequestStatus.REJECTED) => {
    let reason = undefined;
    if (status === ApprovalRequestStatus.REJECTED) {
      const promptReason = window.prompt('Reason for rejection:');
      if (promptReason === null) return; // Cancelled
      reason = promptReason;
    }

    resolveApproval({ approvalId, data: { status, reason } });
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
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Approval Workflows</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Review and manage access requests.</p>
        </div>

        {/* Pending Approvals (Admin view) */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Awaiting My Review</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingPending ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : pendingApprovals?.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
                No requests currently require your approval.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {pendingApprovals?.map((request) => (
                  <li key={request.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Type: {request.type.replace('_', ' ')}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Requester: <span className="font-semibold text-slate-900 dark:text-slate-100">{request.requesterId}</span>
                        </p>
                        <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 border border-slate-150/40 dark:border-slate-850 p-2 rounded-lg max-w-lg overflow-auto font-mono">
                           <pre>{JSON.stringify(request.requestPayload, null, 2)}</pre>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        
                        <div className="flex space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4">
                          <button
                            onClick={() => handleResolve(request.id, ApprovalRequestStatus.APPROVED)}
                            disabled={isResolving}
                            className="inline-flex items-center px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-md font-semibold text-[11px] transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleResolve(request.id, ApprovalRequestStatus.REJECTED)}
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

        {/* My Requests */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">My Requests</h2>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            {isLoadingRequests ? (
              <div className="p-4 text-center text-xs text-slate-500">Loading...</div>
            ) : myRequests?.length === 0 ? (
              <div className="p-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900">
                You have not submitted any approval requests.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {myRequests?.map((request) => (
                  <li key={request.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {request.type.replace('_', ' ')}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 max-w-lg truncate font-mono">
                         Payload: {JSON.stringify(request.requestPayload)}
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
  );
}
