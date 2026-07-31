'use client';

import React, { useState } from 'react';
import { useCreateSession } from '../../hooks/useSessions';
import { useOrgMembers } from '../../hooks/useOrganization';
import { useVaults, useSecretsByVault } from '../../hooks/useVaults';
import { SessionScope, SessionPermission } from '@repo/types';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { Loader2, ChevronDown } from 'lucide-react';

interface CreateSessionModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Pre-select a grantee member ID (from Team page "Grant Access" shortcut) */
  preselectedGranteeId?: string;
}

const selectClass =
  'w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:ring-slate-100/10 dark:focus:border-slate-100 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm appearance-none cursor-pointer';
const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';
const hintClass = 'text-[10px] text-slate-400 mt-1';

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    </div>
  );
}

export function CreateSessionModal({
  orgId,
  isOpen,
  onClose,
  preselectedGranteeId,
}: CreateSessionModalProps) {
  const { mutate: createSession, isPending } = useCreateSession(orgId);
  const { toast } = useToast();

  const { data: members = [] } = useOrgMembers(orgId);
  const { data: vaultsData } = useVaults(orgId);
  const vaults = vaultsData?.items || [];

  const [granteeId, setGranteeId] = useState(preselectedGranteeId || '');
  const [selectedVaultId, setSelectedVaultId] = useState('');
  const [selectedSecretId, setSelectedSecretId] = useState('');
  const [expiresInHours, setExpiresInHours] = useState<number | ''>(1);
  const [maxReveals, setMaxReveals] = useState<number | ''>(10);

  // Fetch secrets whenever a vault is selected
  const { data: secrets = [], isLoading: isLoadingSecrets } = useSecretsByVault(
    orgId,
    selectedVaultId || null,
  );

  const handleClose = () => {
    setGranteeId(preselectedGranteeId || '');
    setSelectedVaultId('');
    setSelectedSecretId('');
    setExpiresInHours(1);
    setMaxReveals(10);
    onClose();
  };

  const handleVaultChange = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setSelectedSecretId(''); // reset secret when vault changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!granteeId) { toast('warning', 'Please select a team member to grant access to.'); return; }
    if (!selectedVaultId) { toast('warning', 'Please select a vault.'); return; }
    if (!selectedSecretId) { toast('warning', 'Please select a secret from the vault.'); return; }
    if (expiresInHours === '' || expiresInHours < 1) { toast('warning', 'Session must expire in at least 1 hour.'); return; }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + Number(expiresInHours));

    createSession(
      {
        granteeId,
        scope: SessionScope.SECRET,
        resourceId: selectedSecretId,
        permission: SessionPermission.REVEAL,
        expiresAt,
        maxReveals: maxReveals === '' ? undefined : Number(maxReveals),
      },
      {
        onSuccess: (data: { status?: string }) => {
          if (data?.status === 'PENDING_APPROVAL') {
            toast('info', 'Session requires approval. Request submitted to admins.');
          } else {
            toast('success', 'Access granted successfully.');
          }
          handleClose();
        },
        onError: (err: Error) => {
          toast('error', err.message || 'Failed to grant access. Please try again.');
        },
      },
    );
  };

  // Filter out the current user from grantee options — you can't grant access to yourself
  const granteeOptions = members.filter((m) => m.role !== 'OWNER' || members.length > 1);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Grant Access">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Who */}
        <div>
          <label className={labelClass}>
            Team Member <span className="text-red-500">*</span>
          </label>
          <SelectWrapper>
            <select
              className={selectClass}
              value={granteeId}
              onChange={(e) => setGranteeId(e.target.value)}
              required
            >
              <option value="">Select a team member…</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.fullName || m.user?.email || m.userId} — {m.role}
                </option>
              ))}
            </select>
          </SelectWrapper>
          <p className={hintClass}>The member who will receive temporary access.</p>
        </div>

        {/* Step 3: Which vault */}
        <div>
          <label className={labelClass}>
            Vault <span className="text-red-500">*</span>
          </label>
          <SelectWrapper>
            <select
              className={selectClass}
              value={selectedVaultId}
              onChange={(e) => handleVaultChange(e.target.value)}
              required
            >
              <option value="">Select a vault…</option>
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {/* Step 4: Which secret */}
        <div>
          <label className={labelClass}>
            Secret <span className="text-red-500">*</span>
          </label>
          <SelectWrapper>
            <select
              className={selectClass}
              value={selectedSecretId}
              onChange={(e) => setSelectedSecretId(e.target.value)}
              required
              disabled={!selectedVaultId || isLoadingSecrets}
            >
              <option value="">
                {!selectedVaultId
                  ? 'Select a vault first…'
                  : isLoadingSecrets
                  ? 'Loading secrets…'
                  : secrets.length === 0
                  ? 'No secrets in this vault'
                  : 'Select a secret…'}
              </option>
              {secrets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.description ? ` — ${s.description}` : ''}
                </option>
              ))}
            </select>
          </SelectWrapper>
        </div>

        {/* Step 5: Expiry + limits */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Expires In (Hours)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              className={selectClass}
              value={expiresInHours}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setExpiresInHours(val === '' ? '' : Number(val));
              }}
            />
          </div>
          <div>
            <label className={labelClass}>
              Max Reveals{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={selectClass}
              placeholder="Unlimited"
              value={maxReveals}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setMaxReveals(val === '' ? '' : Number(val));
              }}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Grant Access
          </button>
        </div>
      </form>
    </Modal>
  );
}
