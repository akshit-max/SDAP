'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useCreateVault } from '../../hooks/useVaults';
import { useToast } from '../common/Toast';

interface CreateVaultModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateVaultModal({ orgId, isOpen, onClose }: CreateVaultModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { mutate, isPending } = useCreateVault(orgId);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast('success', `Vault "${name}" created successfully.`);
          setName('');
          setDescription('');
          onClose();
        },
        onError: (err) => {
          toast('error', err.message || 'Failed to create vault.');
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Vault">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Vault Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Production Credentials"
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-slate-100 dark:focus:ring-slate-100/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description <span className="text-slate-400">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What will this vault contain?"
            rows={3}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-slate-100 dark:focus:ring-slate-100/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isPending || !name.trim()}
            className="flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg transition-colors disabled:opacity-50">
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Create Vault
          </button>
        </div>
      </form>
    </Modal>
  );
}
