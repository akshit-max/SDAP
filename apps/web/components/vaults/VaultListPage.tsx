'use client';

import React, { useState } from 'react';
import { useVaults, useDeleteVault } from '../../hooks/useVaults';
import { VaultList } from './VaultList';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { CreateVaultModal } from './CreateVaultModal';
import { Shield, Plus, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../common/Toast';
import { hasPermission } from '../../lib/auth/permissions';

const PAGE_SIZE = 20;

export function VaultListPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const role = (organization as any)?.role as string | undefined;
  const canCreateVault = hasPermission(role, 'VAULT_CREATE');
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
          <div className="rounded-[28px] p-8 bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-zinc-200/80 dark:border-white/15 shadow-sm text-center">
            <EmptyState
              title="No Vaults Found"
              description="Create your first secure vault to start storing encrypted secrets with scoped delegated access."
              icon={<Shield className="w-6 h-6 text-sky-500" />}
              actionLabel={canCreateVault ? 'Create Vault' : undefined}
              onAction={canCreateVault ? () => setIsCreateOpen(true) : undefined}
            />
          </div>
        </div>
        {canCreateVault && (
          <CreateVaultModal orgId={orgId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <div className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider mb-0.5">
              CREDENTIAL STORAGE
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Secure Vaults
            </h2>
            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-normal">
              Store and manage credentials for workspace services and delegated team access.
            </p>
          </div>

          {canCreateVault && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium shadow-sm transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Vault</span>
            </button>
          )}
        </div>

        {/* Vault Grid */}
        <VaultList vaults={vaults} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/80 dark:border-white/10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.12] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold min-w-[60px] text-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.12] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {canCreateVault && (
        <CreateVaultModal orgId={orgId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
    </>
  );
}
