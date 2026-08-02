'use client';

import React, { useState } from 'react';
import { useVaults, useDeleteVault } from '../../hooks/useVaults';
import { VaultList } from './VaultList';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { CreateVaultModal } from './CreateVaultModal';
import { Shield, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../common/Toast';

const PAGE_SIZE = 20;

export function VaultListPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useVaults(orgId, page, PAGE_SIZE);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const { mutate: deleteVault } = useDeleteVault(orgId);

  const vaults = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!organization) return <Loading message="Loading your workspace..." />;
  if (isLoading) return <Loading message="Loading your vaults..." />;
  if (isError) {
    return (
      <ErrorState
        title="Failed to load vaults"
        message="We encountered an error while communicating with the Vault service."
        onRetry={() => refetch()}
      />
    );
  }

  if (vaults.length === 0 && page === 1) {
    return (
      <>
        <div className="max-w-md mx-auto pt-10">
          <EmptyState
            title="No Vaults Found"
            description="Create your first secure vault to start storing encrypted secrets."
            icon={<Shield className="w-5 h-5 text-premium-muted" />}
            actionLabel="Create Vault"
            onAction={() => setIsCreateOpen(true)}
          />
        </div>
        <CreateVaultModal orgId={orgId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-premium">
          <div>
            <h2 className="text-lg font-bold text-premium-main tracking-tight">Secure Vaults</h2>
            <p className="text-xs text-premium-muted mt-0.5">
              {total} vault{total !== 1 ? 's' : ''} · Page {page} of {totalPages}
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="premium-button-primary"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create Vault
          </button>
        </div>

        <VaultList vaults={vaults} />

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-premium">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="premium-button-secondary"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </button>
            <span className="text-xs text-premium-muted font-semibold min-w-[50px] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="premium-button-secondary"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        )}
      </div>

      <CreateVaultModal orgId={orgId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
