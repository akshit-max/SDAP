'use client';

import React from 'react';
import { useMyRequests, usePendingApprovals, useResolveApproval } from '../../hooks/useApprovals';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { ApprovalRequestStatus } from '@repo/types';

const ORG_ID = 'org-1'; // Hardcoded for foundation sprint

export default function ApprovalsPage() {
  const { data: myRequests, isLoading: isLoadingRequests } = useMyRequests(ORG_ID);
  const { data: pendingApprovals, isLoading: isLoadingPending } = usePendingApprovals(ORG_ID);
  const { mutate: resolveApproval, isPending: isResolving } = useResolveApproval(ORG_ID);

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
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case ApprovalRequestStatus.APPROVED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
      case ApprovalRequestStatus.REJECTED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Workflows</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage access requests.</p>
        </div>

        {/* Pending Approvals (Admin view) */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Awaiting My Review</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            {isLoadingPending ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : pendingApprovals?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50">
                No requests currently require your approval.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {pendingApprovals?.map((request) => (
                  <li key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 truncate">
                          Type: {request.type.replace('_', ' ')}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Requester: <span className="font-medium text-gray-900">{request.requesterId}</span>
                        </p>
                        <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded max-w-lg overflow-auto">
                           <pre>{JSON.stringify(request.requestPayload, null, 2)}</pre>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                        
                        <div className="flex space-x-2 border-l border-gray-200 pl-4">
                          <button
                            onClick={() => handleResolve(request.id, ApprovalRequestStatus.APPROVED)}
                            disabled={isResolving}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <Check className="mr-1 h-4 w-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleResolve(request.id, ApprovalRequestStatus.REJECTED)}
                            disabled={isResolving}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <X className="mr-1 h-4 w-4" /> Reject
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
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Requests</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            {isLoadingRequests ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : myRequests?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50">
                You have not submitted any approval requests.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {myRequests?.map((request) => (
                  <li key={request.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.type.replace('_', ' ')}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 max-w-lg truncate">
                         Payload: {JSON.stringify(request.requestPayload)}
                      </p>
                      {request.reason && (
                        <p className="mt-1 text-sm text-red-600">
                          Reason: {request.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-6">
                       <span className="text-sm text-gray-500">
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
