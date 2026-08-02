'use client';

import React, { useState } from 'react';
import { useCreateSession } from '../../hooks/useSessions';
import { useOrgMembers } from '../../hooks/useOrganization';
import { useVaults, useSecretsByVault } from '../../hooks/useVaults';
import { useIntegrations, useIntegrationResources } from '../../hooks/useIntegrations';
import { IntegrationProvider } from '../../lib/api/integrations';
import { SessionScope, SessionPermission } from '@repo/types';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { X, Lock, Users, Calendar, AlertCircle, Loader2, GitBranch, Key, ChevronDown, Triangle, Globe } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';

interface RequestAccessModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
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

// TODO(v1.1): Replace duplicated modal logic with a shared form component.
// RequestAccessModal -> SharedSessionForm <- GrantAccessModal
// This extraction should be done post-v1.0.1 release to minimize risk.
export function RequestAccessModal({
  orgId,
  isOpen,
  onClose,
}: RequestAccessModalProps) {
  const { user } = useAuth();
  const { mutate: createSession, isPending } = useCreateSession(orgId);
  const { toast } = useToast();

  const { data: members = [] } = useOrgMembers(orgId);
  const { data: vaultsData } = useVaults(orgId);
  const vaults = vaultsData?.items || [];

  const granteeId = user?.id || '';

  const [selectedAccessType, setSelectedAccessType] = useState<'GITHUB' | 'VERCEL' | 'GODADDY' | 'VAULT' | ''>('');
  
  // Derived state to keep logic intact
  const accessMode = selectedAccessType === 'VAULT' ? 'VAULT' : 'NATIVE';
  const selectedProvider = selectedAccessType === 'VAULT' ? '' : (selectedAccessType as IntegrationProvider | '');

  // Vault State
  const [selectedVaultId, setSelectedVaultId] = useState('');
  const [selectedSecretId, setSelectedSecretId] = useState('');
  
  // Integration State
  const [selectedIntegrationResource, setSelectedIntegrationResource] = useState('');

  const [expiresInHours, setExpiresInHours] = useState<number | ''>(1);
  const [maxReveals, setMaxReveals] = useState<number | ''>(20);

  const [integrationRole, setIntegrationRole] = useState<string>('DEVELOPER');

  // Fetch secrets whenever a vault is selected
  const { data: secrets = [], isLoading: isLoadingSecrets } = useSecretsByVault(
    orgId,
    selectedVaultId || null,
  );

  // Fetch Integrations
  const { data: connections = [] } = useIntegrations(orgId);
  const { data: providerResources = [], isLoading: isLoadingResources } = useIntegrationResources(orgId, selectedProvider || null);

  // Filter repositories if GitHub
  const repositories = providerResources.filter(r => r.type === 'REPOSITORY');

  const handleClose = () => {
    setSelectedAccessType('');
    setSelectedIntegrationResource('');
    setSelectedVaultId('');
    setSelectedSecretId('');
    setExpiresInHours(1);
    setMaxReveals(20);
    onClose();
  };

  const handleVaultChange = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setSelectedSecretId(''); // reset secret when vault changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!granteeId) { toast('error', 'User ID not found.'); return; }
    
    // Validate Grantee for Integrations
    const selectedMember = members.find(m => m.userId === granteeId);
    if (accessMode === 'NATIVE' && selectedProvider === 'GITHUB') {
      const githubUsername = (selectedMember?.user as any)?.providerProfiles?.githubUsername;
      if (!githubUsername) {
        toast('warning', 'This user has not configured their GitHub username in Settings. Cannot grant GitHub access.');
        return;
      }
    }

    if (accessMode === 'VAULT') {
      if (!selectedVaultId) { toast('warning', 'Please select a vault.'); return; }
      if (!selectedSecretId) { toast('warning', 'Please select a secret from the vault.'); return; }
    } else {
      if (!selectedProvider) { toast('warning', 'Please select an integration provider.'); return; }
      if (!selectedIntegrationResource) { toast('warning', 'Please select a resource.'); return; }
    }

    if (expiresInHours === '' || expiresInHours < 1) { toast('warning', 'Session must expire in at least 1 hour.'); return; }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + Number(expiresInHours));

    const payload: any = {
      granteeId,
      expiresAt,
      maxReveals: maxReveals === '' ? undefined : Number(maxReveals),
    };

    if (accessMode === 'VAULT') {
      payload.scope = SessionScope.SECRET;
      payload.resourceId = selectedSecretId;
      payload.permission = SessionPermission.REVEAL;
    } else {
      payload.scope = 'INTEGRATION'; // Bypass Vault Check
      payload.resourceId = selectedIntegrationResource; 
      payload.integrationProvider = selectedProvider;
      
      if (selectedProvider === 'GITHUB') payload.integrationResourceType = 'REPOSITORY';
      else if (selectedProvider === 'VERCEL') payload.integrationResourceType = 'TEAM';
      else if (selectedProvider === 'GODADDY') payload.integrationResourceType = 'ACCOUNT';
      
      payload.integrationResourceExternalId = selectedIntegrationResource;
      
      if (selectedProvider === 'VERCEL') payload.integrationRole = integrationRole;
    }

    createSession(
      payload,
      {
        onSuccess: (data: { status?: string }) => {
          if (data?.status === 'PENDING_APPROVAL') {
            toast('success', 'Request Submitted. Waiting for administrator approval.');
          } else {
            // Technically it might just create a session if they bypass approval, but UX should just be request
            toast('success', 'Access granted successfully.');
          }
          handleClose();
        },
        onError: (err: Error) => {
          toast('error', err.message || 'Failed to request access. Please try again.');
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Access">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Who is requesting (implicit) */}
        {/* Step 2: What do you want to access? */}
        <div>
          <label className={labelClass}>What do you want to access? <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            {connections.some(c => c.provider === 'GITHUB') && (
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${selectedAccessType === 'GITHUB' ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-slate-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}>
                <input type="radio" name="accessType" className="hidden" checked={selectedAccessType === 'GITHUB'} onChange={() => { setSelectedAccessType('GITHUB'); setSelectedIntegrationResource(''); }} />
                <GitBranch className={`w-4 h-4 ${selectedAccessType === 'GITHUB' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'GITHUB' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>GitHub Repository</span>
              </label>
            )}
            {connections.some(c => c.provider === 'VERCEL') && (
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${selectedAccessType === 'VERCEL' ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-slate-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}>
                <input type="radio" name="accessType" className="hidden" checked={selectedAccessType === 'VERCEL'} onChange={() => { setSelectedAccessType('VERCEL'); setSelectedIntegrationResource(''); }} />
                <Triangle className={`w-4 h-4 ${selectedAccessType === 'VERCEL' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'VERCEL' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>Vercel Project</span>
              </label>
            )}
            {connections.some(c => c.provider === 'GODADDY') && (
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${selectedAccessType === 'GODADDY' ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-slate-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'}`}>
                <input type="radio" name="accessType" className="hidden" checked={selectedAccessType === 'GODADDY'} onChange={() => { setSelectedAccessType('GODADDY'); setSelectedIntegrationResource(''); }} />
                <Globe className={`w-4 h-4 ${selectedAccessType === 'GODADDY' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'GODADDY' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>GoDaddy Account</span>
              </label>
            )}
            {/* Vault is always available */}
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAccessType === 'VAULT' ? 'bg-slate-900 border-slate-900 dark:bg-slate-100 dark:border-slate-100' : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'}`}>
                <input type="radio" name="accessType" className="hidden" value="VAULT" checked={selectedAccessType === 'VAULT'} onChange={() => setSelectedAccessType('VAULT')} />
                <Lock className={`w-4 h-4 ${selectedAccessType === 'VAULT' ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'VAULT' ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-300'}`}>
                  Vault Secret
                </span>
              </label>
          </div>
          
          {connections.length === 0 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg text-center">
              <p className="text-xs text-blue-800 dark:text-blue-300">No integrations connected.</p>
              <a href="/settings/integrations" className="text-[11px] text-blue-700 dark:text-blue-400 font-bold hover:underline mt-0.5 inline-block" onClick={handleClose}>
                Connect GitHub, Vercel, or GoDaddy to grant external access
              </a>
            </div>
          )}
        </div>

        {accessMode === 'NATIVE' && selectedProvider !== '' ? (
          <>
            
            {(selectedProvider === 'GITHUB' || selectedProvider === 'VERCEL' || selectedProvider === 'GODADDY') && (
              <div>
                <label className={labelClass}>
                  {selectedProvider === 'GITHUB' && 'Repository '}
                  {selectedProvider === 'VERCEL' && 'Team/Project '}
                  {selectedProvider === 'GODADDY' && 'Domain '}
                  <span className="text-red-500">*</span>
                </label>
                <SelectWrapper>
                  <select
                    className={selectClass}
                    value={selectedIntegrationResource}
                    onChange={(e) => setSelectedIntegrationResource(e.target.value)}
                    required
                    disabled={isLoadingResources}
                  >
                    <option value="">{isLoadingResources ? 'Loading resources...' : 'Select a resource…'}</option>
                    {providerResources.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </SelectWrapper>
              </div>
            )}

            {selectedProvider === 'VERCEL' && (
              <div>
                <label className={labelClass}>Role <span className="text-red-500">*</span></label>
                <SelectWrapper>
                  <select
                    className={selectClass}
                    value={integrationRole}
                    onChange={(e) => setIntegrationRole(e.target.value)}
                    required
                  >
                    <option value="VIEWER">Viewer (Read-only)</option>
                    <option value="DEVELOPER">Developer (Push/Deploy)</option>
                    <option value="PROJECT_DEVELOPER">Project Developer</option>
                  </select>
                </SelectWrapper>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className={labelClass}>Vault <span className="text-red-500">*</span></label>
              <SelectWrapper>
                <select
                  className={selectClass}
                  value={selectedVaultId}
                  onChange={(e) => handleVaultChange(e.target.value)}
                  required
                >
                  <option value="">Select a vault…</option>
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </SelectWrapper>
            </div>

            <div>
              <label className={labelClass}>Secret <span className="text-red-500">*</span></label>
              <SelectWrapper>
                <select
                  className={selectClass}
                  value={selectedSecretId}
                  onChange={(e) => setSelectedSecretId(e.target.value)}
                  required
                  disabled={!selectedVaultId || isLoadingSecrets}
                >
                  <option value="">
                    {!selectedVaultId ? 'Select a vault first…' : isLoadingSecrets ? 'Loading secrets…' : secrets.length === 0 ? 'No secrets in this vault' : 'Select a secret…'}
                  </option>
                  {secrets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.description ? ` — ${s.description}` : ''}
                    </option>
                  ))}
                </select>
              </SelectWrapper>
            </div>
          </>
        )}

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
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
}
