'use client';

import React, { useState } from 'react';
import { Loader2, Eye, EyeOff, Key, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useCreateSecret } from '../../hooks/useSecrets';
import { useToast } from '../common/Toast';

interface CreateSecretModalProps {
  orgId: string;
  vaultId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSecretModal({ orgId, vaultId, isOpen, onClose }: CreateSecretModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'credential' | 'raw'>('credential');
  
  // Credential state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Raw state
  const [rawPlaintext, setRawPlaintext] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const { mutate, isPending } = useCreateSecret(orgId, vaultId);
  const { toast } = useToast();

  const handleClose = () => {
    setName(''); setUsername(''); setPassword(''); setRawPlaintext(''); setDescription(''); setShowPassword(false); setShowRaw(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const plaintext = mode === 'credential' 
      ? `${username.trim()}\n${password}`
      : rawPlaintext;

    if (!plaintext.trim()) return;

    mutate(
      { name: name.trim(), plaintext, description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast('success', `Secret "${name}" added successfully.`);
          handleClose();
        },
        onError: (err) => toast('error', err.message || 'Failed to create secret.'),
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Secret">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('credential')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'credential' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Key className="w-3.5 h-3.5" /> Login Credential
          </button>
          <button
            type="button"
            onClick={() => setMode('raw')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${mode === 'raw' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <FileText className="w-3.5 h-3.5" /> Raw Secret
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Secret Key / Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={mode === 'credential' ? "e.g. GoDaddy or GitHub" : "e.g. API_KEY"}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
          />
          {mode === 'credential' && (
            <p className="text-[10px] text-slate-500">Tip: Include the website name in the title so the browser extension can auto-detect it.</p>
          )}
        </div>

        {mode === 'credential' ? (
          <>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pr-10 px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Raw Value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showRaw ? 'text' : 'password'}
                required
                value={rawPlaintext}
                onChange={e => setRawPlaintext(e.target.value)}
                placeholder="Enter raw secret value"
                className="w-full pr-10 px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
              />
              <button type="button" onClick={() => setShowRaw(!showRaw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description <span className="text-slate-400">(optional)</span></label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this secret used for?"
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
          />
        </div>
        
        <p className="text-[10px] text-slate-400 dark:text-slate-500">Value is encrypted at rest using AES-256-GCM.</p>
        
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={handleClose} disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isPending || !name.trim() || (mode === 'credential' ? !password.trim() : !rawPlaintext.trim())}
            className="flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-colors disabled:opacity-50">
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Add Secret
          </button>
        </div>
      </form>
    </Modal>
  );
}
