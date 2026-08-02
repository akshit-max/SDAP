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
import { EditSecretModal } from '../secrets/EditSecretModal';
import { SecretResponse } from '@repo/types';

export function VaultDetailsPage({ vaultId }: { vaultId: string }) {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-start pb-2 border-b border-premium">
          <div>
            <div className="flex items-center text-[10px] text-premium-muted font-bold uppercase tracking-wider mb-1.5">
              <Link href="/vaults" className="hover:text-premium-main transition-colors">Vaults</Link>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">/</span>
              <span className="text-premium-main font-bold">{vault.name}</span>
            </div>
            <h2 className="text-lg font-bold text-premium-main tracking-tight flex items-center">
              <KeyRound className="w-5 h-5 mr-2 text-premium-muted" />
              {vault.name}
            </h2>
            <p className="text-xs text-premium-muted mt-1">{vault.description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsEditVaultOpen(true)}
              className="premium-button-secondary"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => setIsDeleteVaultOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 transition-all duration-150 inline-flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </button>
            <button
              onClick={() => setIsCreateSecretOpen(true)}
              className="premium-button-primary"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Secret
            </button>
          </div>
        </div>

        {/* Secrets List */}
        <div className="premium-card overflow-hidden shadow-none">
          <div className="px-5 py-3 border-b border-premium bg-slate-50/20 dark:bg-zinc-900/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-premium-main uppercase tracking-wider">Secrets</h3>
            <span className="text-[10px] text-premium-muted font-semibold uppercase tracking-wider">{secrets?.length || 0} secret{(secrets?.length || 0) !== 1 ? 's' : ''}</span>
          </div>

          <div className="p-5">
            {secretsLoading ? (
              <Loading message="Loading secrets..." />
            ) : secretsError ? (
              <ErrorState message="Failed to load secrets for this vault." onRetry={() => refetchSecrets()} />
            ) : !secrets || secrets.length === 0 ? (
              <EmptyState
                title="No Secrets Found"
                description="This vault doesn't contain any secrets yet."
                icon={<FileQuestion className="w-5 h-5 text-slate-400" />}
                actionLabel="Add Secret"
                onAction={() => setIsCreateSecretOpen(true)}
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {secrets.map((secret) => (
                  <div key={secret.id} className="py-3 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 px-3 -mx-3 rounded-lg transition-colors">
                    <div>
                      <h4 className="text-xs font-bold text-premium-main font-mono">{secret.name}</h4>
                      <p className="text-[10px] text-premium-muted mt-0.5">{secret.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vaults/${vaultId}/secrets/${secret.id}`}
                        className="premium-button-secondary px-2.5 py-1 text-[10px]"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setEditSecret(secret)}
                        className="p-1.5 text-premium-muted hover:text-premium-main hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title="Edit secret"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteSecretId(secret.id)}
                        className="p-1.5 text-premium-muted hover:text-red-500 hover:bg-red-500/10 rounded-md border border-transparent hover:border-red-500/20 transition-all"
                        title="Delete secret"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
