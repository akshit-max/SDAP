'use client';

import React, { useState } from 'react';
import { useIncomingSessions, useOutgoingSessions, useRevokeSession } from '../../hooks/useSessions';
import { sessionsApi } from '../../lib/api/sessions';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { CreateSessionModal } from '../../components/sessions/CreateSessionModal';
import { Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SessionStatus } from '@repo/types';

const ORG_ID = 'org-1'; // Hardcoded for this UI foundation sprint

export default function SessionsPage() {
  const orgId = ORG_ID;

  const { data: incomingSessions, isLoading: isLoadingIncoming } = useIncomingSessions(orgId);
  const { data: outgoingSessions, isLoading: isLoadingOutgoing } = useOutgoingSessions(orgId);
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession(orgId);

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!orgId) return null;

  const getStatusBadge = (status: SessionStatus, expiresAt: string | Date) => {
    if (status === SessionStatus.REVOKED) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Revoked</span>;
    }
    
    if (status === SessionStatus.EXPIRED || new Date(expiresAt) <= new Date()) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" /> Expired</span>;
    }

    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>;
  };

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Delegated Sessions</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Create Session
          </button>
        </div>

        {/* Incoming Sessions */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Granted to Me (Incoming)</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            {isLoadingIncoming ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : incomingSessions?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50">
                You do not have any incoming delegated sessions.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {incomingSessions?.map((session) => (
                  <li key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {session.scope} Access
                        </p>
                        <p className="mt-1 flex items-center text-sm text-gray-500">
                          Resource ID: {session.resourceId}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500 flex flex-col items-end">
                          <p>Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                          <p>Uses: {session.revealCount} / {session.maxReveals || '∞'}</p>
                        </div>
                        {getStatusBadge(session.status, session.expiresAt)}
                        
                        {session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date() && session.scope === 'SECRET' && (
                          <button
                            onClick={() => {
                              const reason = window.prompt('Enter reason for revealing this secret:');
                              if (reason) {
                                sessionsApi.revealSecretViaSession(orgId, session.id, reason)
                                  .then((plaintext) => {
                                    window.prompt('Secret Value (Copy and close):', plaintext);
                                    // Normally we would have a better UI, but for Phase 5 scope, window.prompt handles the ephemeral requirement safely
                                  })
                                  .catch((err) => {
                                    alert(err.response?.data?.message || 'Failed to reveal secret');
                                  });
                              }
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Reveal Secret
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Outgoing Sessions */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Granted by Me (Outgoing)</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
            {isLoadingOutgoing ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : outgoingSessions?.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50">
                You have not created any delegated sessions.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {outgoingSessions?.map((session) => (
                  <li key={session.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Grantee: {session.granteeId}
                      </p>
                      <p className="mt-1 flex items-center text-sm text-gray-500">
                        {session.scope}: {session.resourceId}
                      </p>
                    </div>
                    <div className="flex items-center space-x-6">
                       <div className="text-sm text-gray-500 flex flex-col items-end">
                          <p>Expires: {new Date(session.expiresAt).toLocaleString()}</p>
                          <p>Uses: {session.revealCount} / {session.maxReveals || '∞'}</p>
                        </div>
                      {getStatusBadge(session.status, session.expiresAt)}
                      
                      {session.status === SessionStatus.ACTIVE && new Date(session.expiresAt) > new Date() && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to revoke this session?')) {
                              revokeSession(session.id);
                            }
                          }}
                          disabled={isRevoking}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Revoke Session"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <CreateSessionModal
          orgId={orgId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </DashboardShell>
  );
}
