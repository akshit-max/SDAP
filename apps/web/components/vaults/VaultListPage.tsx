'use client';

import React, { useState } from 'react';
import { useVaults, useDeleteVault } from '../../hooks/useVaults';
import { VaultList } from './VaultList';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { CreateVaultModal } from './CreateVaultModal';
import { Shield, Plus } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../common/Toast';

export function VaultListPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const { data: vaults, isLoading, isError, refetch } = useVaults(orgId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const { mutate: deleteVault } = useDeleteVault(orgId);

  if (!organization) {
    return <Loading message="Loading your workspace..." />;
  }

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
      <>
        <EmptyState
          title="No Vaults Found"
          description="Create your first secure vault to start storing encrypted secrets."
          icon={<Shield className="w-6 h-6 text-slate-400" />}
          actionLabel="Create Vault"
          onAction={() => setIsCreateOpen(true)}
        />
        <CreateVaultModal orgId={orgId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Secure Vaults</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your encrypted containers and secrets.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Vault
          </button>
        </div>
        <VaultList vaults={vaults} />
      </div>

      <CreateVaultModal orgId={orgId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
