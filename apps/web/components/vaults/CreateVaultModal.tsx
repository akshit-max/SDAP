'use client';

import React, { useState } from 'react';
import { Loader2, ArrowRight, SkipForward } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useCreateVault } from '../../hooks/useVaults';
import { useCreateSecret } from '../../hooks/useSecrets';
import { useToast } from '../common/Toast';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Key, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { billingApi, WITHUS_VAULT_PLATFORMS, PLATFORM_LABELS } from '../../lib/api/billing';

interface CreateVaultModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'details' | 'add-secret';
type SecretMode = 'credential' | 'raw';

export function CreateVaultModal({ orgId, isOpen, onClose }: CreateVaultModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ── Compliance / entitlement data ─────────────────────────────────────────
  // This query is already cached by ComplianceGate — zero extra network cost.
  const { data: compliance } = useQuery({
    queryKey: ['compliance', orgId],
    queryFn: () => billingApi.getComplianceStatus(orgId),
    enabled: !!orgId && isOpen,
    staleTime: 30_000,
  });

  const isFree = compliance?.plan === 'FREE';
  // FREE: only the 2 selected platforms are available.
  // PRO/BUSINESS: all 11 platforms are available (optional).
  const availablePlatforms: string[] = isFree
    ? (compliance?.selectedPlatforms ?? [])
    : [...WITHUS_VAULT_PLATFORMS];

  // ── Step tracker ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('details');
  const [newVaultId, setNewVaultId] = useState<string | null>(null);
  const [newVaultName, setNewVaultName] = useState('');

  // ── Step 1: Vault details ──────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [platformId, setPlatformId] = useState('');
  const { mutate: createVault, isPending: isCreatingVault } = useCreateVault(orgId);

  // ── Step 2: Add secret ────────────────────────────────────────────────────
  const [secretName, setSecretName] = useState('');
  const [secretDescription, setSecretDescription] = useState('');
  const [secretMode, setSecretMode] = useState<SecretMode>('credential');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rawPlaintext, setRawPlaintext] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const { mutate: createSecret, isPending: isCreatingSecret } = useCreateSecret(orgId, newVaultId ?? '');

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resetAll = () => {
    setStep('details');
    setNewVaultId(null);
    setNewVaultName('');
    setName('');
    setDescription('');
    setPlatformId('');
    setSecretName('');
    setSecretDescription('');
    setUsername('');
    setPassword('');
    setRawPlaintext('');
    setShowPassword(false);
    setShowRaw(false);
    setSecretMode('credential');
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // ── Step 1: Create vault ──────────────────────────────────────────────────
  const handleVaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // FREE orgs must pick a platform
    if (isFree && !platformId) {
      toast('error', 'Please select a platform for this vault.');
      return;
    }

    createVault(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        // Send platformId for FREE (required) and PRO/BUSINESS if chosen
        platformId: platformId || undefined,
      },
      {
        onSuccess: (vault) => {
          setNewVaultId(vault.id);
          setNewVaultName(vault.name);
          toast('success', `Vault "${vault.name}" created. Now add your first credential.`);
          setStep('add-secret');
        },
        onError: (err) => {
          toast('error', err.message || 'Failed to create vault.');
        },
      }
    );
  };

  // ── Step 2: Add secret ────────────────────────────────────────────────────
  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretName.trim() || !newVaultId) return;

    const plaintext =
      secretMode === 'credential'
        ? `${username.trim()}\n${password}`
        : rawPlaintext;

    if (!plaintext.trim()) return;

    createSecret(
      { name: secretName.trim(), plaintext, description: secretDescription.trim() || undefined },
      {
        onSuccess: () => {
          toast('success', `Secret "${secretName}" added.`);
          handleClose();
          router.push(`/vaults/${newVaultId}`);
        },
        onError: (err) => toast('error', err.message || 'Failed to add secret.'),
      }
    );
  };

  // ── Step 2: Skip — vault already exists, just navigate to it ─────────────
  const handleSkip = () => {
    const targetId = newVaultId;
    handleClose();
    if (targetId) router.push(`/vaults/${targetId}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const stepLabel = step === 'details' ? 'Step 1 of 2 — Vault Details' : `Step 2 of 2 — Add Credential to "${newVaultName}"`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Vault">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        <div className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold border ${step === 'details' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'border-emerald-500 bg-emerald-500 text-white'}`}>
          {step === 'add-secret' ? '✓' : '1'}
        </div>
        <div className={`h-px flex-1 ${step === 'add-secret' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold border ${step === 'add-secret' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' : 'border-slate-300 dark:border-slate-600 text-slate-400'}`}>
          2
        </div>
        <p className="text-[10px] text-premium-muted font-semibold ml-2">{stepLabel}</p>
      </div>

      {/* ── STEP 1: Vault Details ── */}
      {step === 'details' && (
        <form onSubmit={handleVaultSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Vault Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Production Credentials"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-slate-100 dark:focus:ring-slate-100/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
            />
          </div>

          {/* ── Platform picker ── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Platform {isFree ? <span className="text-red-500">*</span> : <span className="text-slate-400">(optional)</span>}
            </label>
            {isFree && availablePlatforms.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No platforms selected yet. Please complete platform selection first.
              </p>
            ) : (
              <select
                value={platformId}
                onChange={e => setPlatformId(e.target.value)}
                required={isFree}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
              >
                {!isFree && <option value="">— No platform (generic vault) —</option>}
                {isFree && <option value="">Select a platform...</option>}
                {availablePlatforms.map(pid => (
                  <option key={pid} value={pid}>
                    {PLATFORM_LABELS[pid as keyof typeof PLATFORM_LABELS] ?? pid}
                  </option>
                ))}
              </select>
            )}
            {isFree && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                FREE plan: vault must belong to one of your 2 selected platforms.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will this vault contain?"
              rows={3}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-slate-100 dark:focus:ring-slate-100/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={handleClose} disabled={isCreatingVault}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isCreatingVault || !name.trim() || (isFree && !platformId)}
              className="flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg transition-colors disabled:opacity-50">
              {isCreatingVault
                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Creating...</>
                : <>Create Vault <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></>
              }
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2: Add Secret ── */}
      {step === 'add-secret' && (
        <form onSubmit={handleSecretSubmit} className="space-y-4">
          {/* Mode toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <button type="button" onClick={() => setSecretMode('credential')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${secretMode === 'credential' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Key className="w-3.5 h-3.5" /> Login Credential
            </button>
            <button type="button" onClick={() => setSecretMode('raw')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-colors ${secretMode === 'raw' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <FileText className="w-3.5 h-3.5" /> Raw Secret
            </button>
          </div>

          {/* Credential name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Credential Name <span className="text-red-500">*</span>
            </label>
            <input type="text" required value={secretName}
              onChange={e => setSecretName(e.target.value)}
              placeholder={secretMode === 'credential' ? 'e.g. My Personal Account' : 'e.g. API_KEY'}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
            />
            {secretMode === 'credential' && (
              <p className="text-[10px] text-slate-500">Platform is identified by your selection above, not this name.</p>
            )}
          </div>

          {/* Credential fields */}
          {secretMode === 'credential' ? (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username <span className="text-red-500">*</span>
                </label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Enter password"
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
                <input type={showRaw ? 'text' : 'password'} required value={rawPlaintext}
                  onChange={e => setRawPlaintext(e.target.value)} placeholder="Enter raw secret value"
                  className="w-full pr-10 px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm font-mono"
                />
                <button type="button" onClick={() => setShowRaw(!showRaw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <input type="text" value={secretDescription}
              onChange={e => setSecretDescription(e.target.value)}
              placeholder="What is this secret used for?"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
            />
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500">Value is encrypted at rest using AES-256-GCM.</p>

          <div className="flex gap-2 justify-end pt-2">
            {/* Cancel — closes modal, vault already created/persisted */}
            <button type="button" onClick={handleClose} disabled={isCreatingSecret}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            {/* Skip — vault saved, navigate to it without adding a secret */}
            <button type="button" onClick={handleSkip} disabled={isCreatingSecret}
              className="flex items-center px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
              <SkipForward className="w-3.5 h-3.5 mr-1" />
              Skip
            </button>
            {/* Add Credential — submits the secret */}
            <button type="submit"
              disabled={isCreatingSecret || !secretName.trim() || (secretMode === 'credential' ? !password.trim() : !rawPlaintext.trim())}
              className="flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-colors disabled:opacity-50">
              {isCreatingSecret && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Add Credential
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

