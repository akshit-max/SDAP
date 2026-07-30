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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {total} vault{total !== 1 ? 's' : ''} · Page {page} of {totalPages}
            </p>
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

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[60px] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <CreateVaultModal orgId={orgId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
