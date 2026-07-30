'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { useUpdateSecret } from '../../hooks/useSecrets';
import { SecretResponse } from '@repo/types';

interface EditSecretModalProps {
  orgId: string;
  vaultId: string;
  secret: SecretResponse;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSecretModal({ orgId, vaultId, secret, isOpen, onClose }: EditSecretModalProps) {
  const [name, setName] = useState(secret.name);
  const [description, setDescription] = useState(secret.description || '');
  const { toast } = useToast();
  const { mutate, isPending } = useUpdateSecret(orgId, vaultId, secret.id);

  useEffect(() => {
    if (isOpen) {
      setName(secret.name);
      setDescription(secret.description || '');
    }
  }, [isOpen, secret]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('warning', 'Secret key name cannot be empty.'); return; }

    mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast('success', 'Secret updated successfully.');
          onClose();
        },
        onError: (err: Error) => toast('error', err.message || 'Failed to update secret.'),
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Secret">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Secret Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
          />
          <p className="text-[10px] text-slate-400">Note: Changing the key name does not change the encrypted value.</p>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this secret used for?"
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
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
