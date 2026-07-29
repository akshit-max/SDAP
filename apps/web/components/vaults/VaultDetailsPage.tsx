'use client';

import React from 'react';
import Link from 'next/link';
import { useVault } from '../../hooks/useVaults';
import { useSecrets } from '../../hooks/useSecrets';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { KeyRound, FileQuestion } from 'lucide-react';

const ORG_ID = 'org-1'; // Hardcoded for this UI foundation sprint

export function VaultDetailsPage({ vaultId }: { vaultId: string }) {
  const { data: vault, isLoading: vaultLoading, isError: vaultError, refetch: refetchVault } = useVault(ORG_ID, vaultId);
  const { data: secrets, isLoading: secretsLoading, isError: secretsError, refetch: refetchSecrets } = useSecrets(ORG_ID, vaultId);

  if (vaultLoading) {
    return <Loading message="Loading vault details..." />;
  }

  if (vaultError || !vault) {
    return (
      <ErrorState 
        title="Failed to load vault" 
        message="We encountered an error while communicating with the Vault service." 
        onRetry={() => refetchVault()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center text-sm text-blue-600 font-medium mb-2">
            <Link href="/vaults" className="hover:underline">Vaults</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">{vault.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <KeyRound className="w-6 h-6 mr-3 text-blue-600" />
            {vault.name}
          </h2>
          <p className="text-sm text-gray-500 mt-2">{vault.description || 'No description provided.'}</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors">
          Add Secret
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Secrets</h3>
        </div>
        
        <div className="p-6">
          {secretsLoading ? (
            <Loading message="Loading secrets..." />
          ) : secretsError ? (
            <ErrorState 
              message="Failed to load secrets for this vault." 
              onRetry={() => refetchSecrets()}
            />
          ) : !secrets || secrets.length === 0 ? (
            <EmptyState
              title="No Secrets Found"
              description="This vault doesn't contain any secrets yet."
              icon={<FileQuestion className="w-6 h-6 text-blue-500" />}
              actionLabel="Add Secret"
              onAction={() => console.log('Add secret modal placeholder')}
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {secrets.map((secret) => (
                <div key={secret.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{secret.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{secret.description || 'No description'}</p>
                  </div>
                  <Link 
                    href={`/vaults/${vaultId}/secrets/${secret.id}`}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
