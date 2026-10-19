'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVault, useDeleteVault } from '../../hooks/useVaults';
import { useSecrets, useDeleteSecret } from '../../hooks/useSecrets';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CreateSecretModal } from '../secrets/CreateSecretModal';
import { EditVaultModal } from './EditVaultModal';
import { KeyRound, FileQuestion, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';
import { useToast } from '../common/Toast';
import { hasPermission } from '../../lib/auth/permissions';
import { EditSecretModal } from '../secrets/EditSecretModal';
import { SecretResponse } from '@repo/types';

export function VaultDetailsPage({ vaultId }: { vaultId: string }) {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const role = (organization as any)?.role as string | undefined;

  // Granular permission gates — mirrors backend PermissionEvaluator exactly
  const canUpdateVault  = hasPermission(role, 'VAULT_UPDATE');
  const canDeleteVault  = hasPermission(role, 'VAULT_DELETE');  // OWNER only
  const canCreateSecret = hasPermission(role, 'SECRET_CREATE');
  const canUpdateSecret = hasPermission(role, 'SECRET_UPDATE');
  const canDeleteSecret = hasPermission(role, 'SECRET_DELETE');

  const router = useRouter();
  const { toast } = useToast();

  const { data: vault, isLoading: vaultLoading, isError: vaultError, refetch: refetchVault } = useVault(orgId, vaultId);
  const { data: secrets, isLoading: secretsLoading, isError: secretsError, refetch: refetchSecrets } = useSecrets(orgId, vaultId);

  const [isCreateSecretOpen, setIsCreateSecretOpen] = useState(false);
  const [isEditVaultOpen, setIsEditVaultOpen] = useState(false);
  const [isDeleteVaultOpen, setIsDeleteVaultOpen] = useState(false);
  const [deleteSecretId, setDeleteSecretId] = useState<string | null>(null);
  const [editSecret, setEditSecret] = useState<SecretResponse | null>(null);

  const { mutate: deleteVault, isPending: isDeletingVault } = useDeleteVault(orgId);
  const { mutate: deleteSecret, isPending: isDeletingSecret } = useDeleteSecret(orgId, vaultId);

  if (!organization) {
    return <Loading message="Loading your workspace..." />;
  }

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

  const handleDeleteVault = () => {
    deleteVault(vaultId, {
      onSuccess: () => {
        toast('success', `Vault "${vault.name}" deleted.`);
        router.push('/vaults');
      },
      onError: (err) => toast('error', err.message || 'Failed to delete vault.'),
    });
  };

  const handleDeleteSecret = () => {
    if (!deleteSecretId) return;
    deleteSecret(deleteSecretId, {
      onSuccess: () => {
        toast('success', 'Secret deleted successfully.');
        setDeleteSecretId(null);
      },
      onError: (err) => toast('error', err.message || 'Failed to delete secret.'),
    });
  };

  return (
    <>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#86868B] dark:text-[#8E8E93] mb-1.5">
              <Link href="/vaults" className="hover:text-[#0071E3] transition-colors">Vaults</Link>
              <span>/</span>
              <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{vault.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center flex-shrink-0 shadow-sm">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {vault.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] mt-0.5">{vault.description || 'Secure credential storage vault.'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canUpdateVault && (
              <button
                onClick={() => setIsEditVaultOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A]/80 transition-colors shadow-sm"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Vault
              </button>
            )}
            {canDeleteVault && (
              <button
                onClick={() => setIsDeleteVaultOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            {canCreateSecret && (
              <button
                onClick={() => setIsCreateSecretOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Secret
              </button>
            )}
          </div>
        </div>

        {/* Secrets List Container */}
        <div className="rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] uppercase tracking-wider">Stored Secrets</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#8E8E93]">
              {secrets?.length || 0} secret{(secrets?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>

          <div>
            {secretsLoading ? (
              <div className="p-8"><Loading message="Loading secrets..." /></div>
            ) : secretsError ? (
              <div className="p-8"><ErrorState message="Failed to load secrets for this vault." onRetry={() => refetchSecrets()} /></div>
            ) : !secrets || secrets.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  title="No Secrets Stored"
                  description="This vault doesn't contain any secrets yet. Add credentials to protect and delegate access."
                  icon={<FileQuestion className="w-5 h-5 text-zinc-400" />}
                  actionLabel={canCreateSecret ? 'Add First Secret' : undefined}
                  onAction={canCreateSecret ? () => setIsCreateSecretOpen(true) : undefined}
                />
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5EA]/60 dark:divide-[#2C2C2E]/60">
                {secrets.map((secret) => (
                  <div key={secret.id} className="py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F5F5F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono">{secret.name}</h4>
                        {secret.type && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider border border-[#E5E5EA] dark:border-[#38383A]">
                            {secret.type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-1">{secret.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vaults/${vaultId}/secrets/${secret.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#E5E5EA] dark:hover:bg-[#38383A] transition-colors"
                      >
                        View Details
                      </Link>
                      {canUpdateSecret && (
                        <button
                          onClick={() => setEditSecret(secret)}
                          className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/5 rounded-lg transition-colors"
                          title="Edit secret"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteSecret && (
                        <button
                          onClick={() => setDeleteSecretId(secret.id)}
                          className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-lg transition-colors"
                          title="Delete secret"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {vault && (
        <EditVaultModal
          orgId={orgId}
          vault={vault}
          isOpen={isEditVaultOpen}
          onClose={() => setIsEditVaultOpen(false)}
        />
      )}
      <CreateSecretModal
        orgId={orgId}
        vaultId={vaultId}
        isOpen={isCreateSecretOpen}
        onClose={() => setIsCreateSecretOpen(false)}
      />
      {editSecret && (
        <EditSecretModal
          orgId={orgId}
          vaultId={vaultId}
          secret={editSecret}
          isOpen={!!editSecret}
          onClose={() => setEditSecret(null)}
        />
      )}
      <ConfirmDialog
        isOpen={isDeleteVaultOpen}
        onClose={() => setIsDeleteVaultOpen(false)}
        onConfirm={handleDeleteVault}
        title="Delete Vault"
        message={`Are you sure you want to permanently delete the vault "${vault.name}" and all its secrets? This action cannot be undone.`}
        confirmLabel="Delete Vault"
        danger
        isPending={isDeletingVault}
      />
      <ConfirmDialog
        isOpen={!!deleteSecretId}
        onClose={() => setDeleteSecretId(null)}
        onConfirm={handleDeleteSecret}
        title="Delete Secret"
        message="Are you sure you want to permanently delete this secret? This action cannot be undone."
        confirmLabel="Delete Secret"
        danger
        isPending={isDeletingSecret}
      />
    </>
  );
}
