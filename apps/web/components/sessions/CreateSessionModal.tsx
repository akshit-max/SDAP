'use client';

import React, { useState } from 'react';
import { useCreateSession } from '../../hooks/useSessions';
import { SessionScope, SessionPermission } from '@repo/types';

interface CreateSessionModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSessionModal({ orgId, isOpen, onClose }: CreateSessionModalProps) {
  const { mutate: createSession, isPending } = useCreateSession(orgId);

  const [granteeId, setGranteeId] = useState('');
  const [scope, setScope] = useState<SessionScope>(SessionScope.SECRET);
  const [resourceId, setResourceId] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(1);
  const [maxReveals, setMaxReveals] = useState<number | ''>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    createSession(
      {
        granteeId,
        scope,
        resourceId,
        permission: SessionPermission.REVEAL,
        expiresAt,
        maxReveals: maxReveals === '' ? undefined : Number(maxReveals),
      },
      {
        onSuccess: (data: { status?: string }) => {
          if (data?.status === 'PENDING_APPROVAL') {
            alert('Your request requires approval. It has been submitted to the organization admins.');
          } else {
            alert('Session created successfully.');
          }
          onClose();
          setGranteeId('');
          setResourceId('');
          setExpiresInHours(1);
          setMaxReveals('');
        },
        onError: (err: unknown) => {
          const apiError = err as { response?: { data?: { message?: string } } };
          setError(apiError.response?.data?.message || 'Failed to create session');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Create Delegated Session</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grantee User ID</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="UUID of the user"
              value={granteeId}
              onChange={(e) => setGranteeId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={scope}
              onChange={(e) => setScope(e.target.value as SessionScope)}
            >
              <option value={SessionScope.SECRET}>Specific Secret</option>
              <option value={SessionScope.VAULT}>Entire Vault</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder={`UUID of the ${scope.toLowerCase()}`}
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (Hours)</label>
            <input
              type="number"
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Reveals (Optional)</label>
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Unlimited"
              value={maxReveals}
              onChange={(e) => setMaxReveals(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Grant Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
