'use client';

import React from 'react';
import { useVaults } from '../../hooks/useVaults';
import { VaultList } from './VaultList';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { Shield } from 'lucide-react';

const ORG_ID = 'org-1'; // Hardcoded for this UI foundation sprint

export function VaultListPage() {
  const { data: vaults, isLoading, isError, refetch } = useVaults(ORG_ID);

  if (isLoading) {
    return <Loading message="Loading your vaults..." />;
  }

  if (isError) {
    return (
      <ErrorState 
        title="Failed to load vaults" 
        message="We encountered an error while communicating with the Vault service." 
        onRetry={() => refetch()}
      />
    );
  }

  if (!vaults || vaults.length === 0) {
    return (
      <EmptyState
        title="No Vaults Found"
        description="You don't have any secure vaults in this organization yet."
        icon={<Shield className="w-6 h-6 text-blue-500" />}
        actionLabel="Create Vault"
        onAction={() => console.log('Create vault modal placeholder')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Secure Vaults</h2>
          <p className="text-sm text-gray-500">Manage your encrypted containers and secrets.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors">
          Create Vault
        </button>
      </div>

      <VaultList vaults={vaults} />
    </div>
  );
}
