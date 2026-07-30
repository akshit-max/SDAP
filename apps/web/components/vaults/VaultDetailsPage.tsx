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
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center text-xs text-slate-500 font-medium mb-1.5">
              <Link href="/vaults" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Vaults</Link>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-900 dark:text-slate-100 font-semibold">{vault.name}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <KeyRound className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
              {vault.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{vault.description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditVaultOpen(true)}
              className="flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg font-semibold text-xs transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </button>
            <button
              onClick={() => setIsDeleteVaultOpen(true)}
              className="flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg font-semibold text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </button>
            <button
              onClick={() => setIsCreateSecretOpen(true)}
              className="flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Secret
            </button>
          </div>
        </div>

        {/* Secrets List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Secrets</h3>
            <span className="text-[10px] text-slate-400 font-medium">{secrets?.length || 0} secret{(secrets?.length || 0) !== 1 ? 's' : ''}</span>
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
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {secrets.map((secret) => (
                  <div key={secret.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 px-3 -mx-3 rounded-lg transition-colors">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">{secret.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{secret.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vaults/${vaultId}/secrets/${secret.id}`}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-md transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setEditSecret(secret)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-md transition-colors"
                        title="Edit secret"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteSecretId(secret.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
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
