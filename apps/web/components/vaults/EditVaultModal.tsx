'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vaultsApi } from '../../lib/api/vaults';
import { vaultKeys } from '../../hooks/useVaults';
import { VaultResponse } from '@repo/types';

interface EditVaultModalProps {
  orgId: string;
  vault: VaultResponse;
  isOpen: boolean;
  onClose: () => void;
}

export function EditVaultModal({ orgId, vault, isOpen, onClose }: EditVaultModalProps) {
  const [name, setName] = useState(vault.name);
  const [description, setDescription] = useState(vault.description || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setName(vault.name);
      setDescription(vault.description || '');
    }
  }, [isOpen, vault]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      vaultsApi.updateVault(orgId, vault.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.all(orgId) });
      queryClient.invalidateQueries({ queryKey: vaultKeys.detail(orgId, vault.id) });
      toast('success', 'Vault updated successfully.');
      onClose();
    },
    onError: (err: Error) => toast('error', err.message || 'Failed to update vault.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Vault">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Vault Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isPending || !name.trim()}
            className="flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-colors disabled:opacity-50">
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
