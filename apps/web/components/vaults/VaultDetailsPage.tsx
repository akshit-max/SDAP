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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
              <Link href="/vaults" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Vaults</Link>
              <span>/</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{vault.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-sm">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {vault.name}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{vault.description || 'Secure credential storage vault.'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {canUpdateVault && (
              <button
                onClick={() => setIsEditVaultOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Vault
              </button>
            )}
            {canDeleteVault && (
              <button
                onClick={() => setIsDeleteVaultOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            {canCreateSecret && (
              <button
                onClick={() => setIsCreateSecretOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Secret
              </button>
            )}
          </div>
        </div>

        {/* Secrets List Container */}
        <div className="rounded-[28px] border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200/60 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Stored Secrets</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 text-zinc-600 dark:text-zinc-400">
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
              <div className="divide-y divide-zinc-200/60 dark:divide-white/10">
                {secrets.map((secret) => (
                  <div key={secret.id} className="py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-white font-mono">{secret.name}</h4>
                        {secret.type && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                            {secret.type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{secret.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vaults/${vaultId}/secrets/${secret.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-all"
                      >
                        View Details
                      </Link>
                      {canUpdateSecret && (
                        <button
                          onClick={() => setEditSecret(secret)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors"
                          title="Edit secret"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteSecret && (
                        <button
                          onClick={() => setDeleteSecretId(secret.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
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
