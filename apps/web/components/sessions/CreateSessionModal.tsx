'use client';

import React, { useState } from 'react';
import { useCreateSession } from '../../hooks/useSessions';
import { useOrgMembers } from '../../hooks/useOrganization';
import { useVaults, useSecretsByVault } from '../../hooks/useVaults';
import { useIntegrations, useIntegrationResources } from '../../hooks/useIntegrations';
import { useComplianceStatus } from '../../hooks/useBilling';
import { IntegrationProvider } from '../../lib/api/integrations';
import { SessionScope, SessionPermission } from '@repo/types';
import { Modal } from '../common/Modal';
import { CustomSelect } from '../common/Select';
import { useToast } from '../common/Toast';
import { ShieldCheck, Lock, Loader2, GitBranch, Triangle, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

/**
 * Generic map of secret-name keyword → available capabilities.
 * Keys are lowercase substrings of the vault/secret name.
 * Values are the human-readable capability labels and their API keys.
 * Add new platforms here; NO platform-specific conditionals elsewhere.
 */
const PLATFORM_CAPABILITY_MAP: Record<string, { key: string; label: string; description: string }[]> = {
  mca: [
    { key: 'mca.master_data', label: 'Master Data', description: 'Access MCA Master Data services' },
    { key: 'mca.llp_efiling', label: 'LLP e-Filing', description: 'File LLP forms and returns' },
    { key: 'mca.fo_services', label: 'FO Services', description: 'Access Front Office services' },
    { key: 'mca.dsc_services', label: 'DSC Services', description: 'Manage Digital Signature Certificates' },
    { key: 'mca.company_efiling', label: 'Company e-Filing', description: 'File company forms and returns' },
    { key: 'mca.complaints', label: 'Complaints', description: 'File and track complaints' },
    { key: 'mca.document_related_services', label: 'Document Related Services', description: 'Request certified copies and view public documents' },
    { key: 'mca.payment_services', label: 'Payment Services', description: 'Manage fees and payments' },
    { key: 'mca.id_databank', label: 'ID Databank', description: 'Access Independent Directors Databank' },
  ],
  github: [
    { key: 'github.repo_actions', label: 'Actions', description: 'Access GitHub Actions (CI/CD workflows)' },
    { key: 'github.repo_projects', label: 'Projects', description: 'Access GitHub Projects (project boards)' },
    { key: 'github.repo_security', label: 'Security & Quality', description: 'Access Security advisories, Dependabot, and code scanning' },
    { key: 'github.repo_wiki', label: 'Wiki', description: 'Access repository wiki documentation' },
    { key: 'github.repo_insights', label: 'Insights', description: 'Access repository traffic and contribution insights' },
    { key: 'github.repo_settings', label: 'Settings', description: 'Access repository settings (branches, webhooks, collaborators)' },
    { key: 'github.org_members', label: 'Organization Members', description: 'Manage organization members, teams, and access' },
    { key: 'github.org_projects', label: 'Organization Projects', description: 'Access organization-level project boards' },
  ],
  vercel: [
    { key: 'vercel.domains', label: 'Domains', description: 'Manage project domains and SSL' },
    { key: 'vercel.analytics', label: 'Analytics', description: 'View Web Analytics and Audience data' },
    { key: 'vercel.env', label: 'Environment Variables', description: 'Manage project environment variables' },
    { key: 'vercel.storage', label: 'Storage', description: 'Manage Edge Config, KV, and databases' },
    { key: 'vercel.integrations', label: 'Integrations', description: 'Manage marketplace integrations' },
    { key: 'vercel.settings', label: 'Settings', description: 'Access project and team settings' },
  ],
  stripe: [
    { key: 'stripe.payments', label: 'Payments', description: 'Manage payments and transactions' },
    { key: 'stripe.customers', label: 'Customers', description: 'Manage customer data' },
    { key: 'stripe.products', label: 'Products', description: 'Manage product catalog' },
    { key: 'stripe.billing', label: 'Billing', description: 'Manage billing, invoices, and subscriptions' },
    { key: 'stripe.balance', label: 'Balance', description: 'View balances and payouts' },
    { key: 'stripe.reports', label: 'Reports', description: 'View financial and analytics reports' },
    { key: 'stripe.developers', label: 'Developers', description: 'Access API keys and webhooks' },
  ],
  godaddy: [
    { key: 'godaddy.domain', label: 'Domain', description: 'Manage domains' },
    { key: 'godaddy.website', label: 'Website', description: 'Manage websites' },
    { key: 'godaddy.email', label: 'Email', description: 'Manage emails' },
    { key: 'godaddy.store', label: 'Store', description: 'Manage stores' },
    { key: 'godaddy.appointments', label: 'Appointments', description: 'Manage appointments' },
    { key: 'godaddy.marketing', label: 'Marketing', description: 'Access marketing tools' },
    { key: 'godaddy.conversations', label: 'Conversations', description: 'Manage conversations' },
    { key: 'godaddy.customers', label: 'Customers', description: 'Manage customers' },
    { key: 'godaddy.deals', label: 'Deals', description: 'View deals' },
    { key: 'godaddy.users', label: 'Users', description: 'Manage users' },
    { key: 'godaddy.app_switcher', label: 'App Switcher', description: 'Access app switcher' },
    { key: 'godaddy.my_products', label: 'My Products', description: 'Manage your products' },
    { key: 'godaddy.account_settings', label: 'Account Settings', description: 'Manage account settings' },
    { key: 'godaddy.billing', label: 'Renewals & Billing', description: 'Manage billing and renewals' },
    { key: 'godaddy.shop', label: 'Shop GoDaddy.com', description: 'Access GoDaddy shop' },
  ],
  linkedin: [
    { key: 'linkedin.my_network', label: 'My Network', description: 'Access connections and network' },
    { key: 'linkedin.jobs', label: 'Jobs', description: 'Access job postings and applications' },
    { key: 'linkedin.messaging', label: 'Messaging', description: 'Access direct messages' },
    { key: 'linkedin.notifications', label: 'Notifications', description: 'View notifications' },
    /*
    { key: 'linkedin.page_dashboard', label: 'Dashboard', description: 'Access Page Dashboard' },
    { key: 'linkedin.page_posts', label: 'Page Posts', description: 'Manage Page Posts' },
    { key: 'linkedin.page_analytics', label: 'Analytics', description: 'View Page Analytics' },
    { key: 'linkedin.page_feed', label: 'Feed', description: 'Access Page Feed' },
    { key: 'linkedin.page_activity', label: 'Activity', description: 'View Page Activity' },
    { key: 'linkedin.page_inbox', label: 'Inbox', description: 'Access Page Inbox' },
    { key: 'linkedin.page_services', label: 'Services', description: 'Manage Page Services' },
    { key: 'linkedin.page_posted_jobs', label: 'Posted Jobs', description: 'Manage Page Posted Jobs' },
    { key: 'linkedin.page_edit', label: 'Edit Page', description: 'Edit Page settings' },
    { key: 'linkedin.page_settings', label: 'Settings', description: 'Manage Page Settings' },
    { key: 'linkedin.page_advertise', label: 'Advertise Today', description: 'Access advertising options' },
    */
  ],
  shopify: [
    { key: 'shopify.orders', label: 'Orders', description: 'View and manage orders' },
    { key: 'shopify.products', label: 'Products', description: 'Manage products and inventory' },
    { key: 'shopify.customers', label: 'Customers', description: 'Manage customer data' },
    { key: 'shopify.growth', label: 'Growth', description: 'Access growth tools' },
    { key: 'shopify.discounts', label: 'Discounts', description: 'Manage discounts and promotions' },
    { key: 'shopify.content', label: 'Content', description: 'Manage store content and metaobjects' },
    { key: 'shopify.markets', label: 'Markets', description: 'Manage regional markets' },
    { key: 'shopify.analytics', label: 'Analytics', description: 'View store analytics and reports' },
    { key: 'shopify.sales_channels', label: 'Sales Channels', description: 'Manage Online Store and other channels' },
    { key: 'shopify.apps', label: 'Apps', description: 'Manage installed applications' },
    { key: 'shopify.settings', label: 'Settings', description: 'Manage store settings' },
  ],
  gst: [
    { key: 'gst.registration', label: 'Registration', description: 'Access GST Registration' },
    { key: 'gst.ledgers', label: 'Ledgers', description: 'Access GST Ledgers' },
    { key: 'gst.returns', label: 'Returns', description: 'Access GST Returns' },
    { key: 'gst.payments', label: 'Payments', description: 'Access GST Payments' },
    { key: 'gst.refunds', label: 'Refunds', description: 'Access GST Refunds' },
  ],
  razorpay: [
    { key: 'razorpay.transactions', label: 'Transactions', description: 'Access Transactions' },
    { key: 'razorpay.settlements', label: 'Settlements', description: 'Access Settlements' },
    { key: 'razorpay.reports', label: 'Reports', description: 'Access Reports' },
    { key: 'razorpay.payment_links', label: 'Payment Links', description: 'Access Payment Links' },
    { key: 'razorpay.payment_pages', label: 'Payment Pages', description: 'Access Payment Pages' },
    { key: 'razorpay.invoices', label: 'Invoices', description: 'Access Invoices' },
    { key: 'razorpay.payment_button', label: 'Payment Button', description: 'Access Payment Buttons' },
    { key: 'razorpay.subscriptions', label: 'Subscriptions', description: 'Access Subscriptions' },
    { key: 'razorpay.smart_collect', label: 'Smart Collect', description: 'Access Smart Collect' },
    { key: 'razorpay.optimizer', label: 'Optimizer', description: 'Access Optimizer' },
    { key: 'razorpay.account_settings', label: 'Account & Settings', description: 'Access Account & Settings' },
  ],
  udyam: [
    { key: 'udyam.cancellation', label: 'Cancellation', description: 'Access Cancellation' },
    { key: 'udyam.print_certificate', label: 'Print Certificate', description: 'Print Certificate' },
    { key: 'udyam.edit_details', label: 'Edit Details', description: 'Edit Details' },
  ],
  gmail: [
    { key: 'gmail.inbox', label: 'Inbox', description: 'Restrict access to the main Inbox' },
    { key: 'gmail.starred', label: 'Starred', description: 'Restrict access to Starred emails' },
    { key: 'gmail.snoozed', label: 'Snoozed', description: 'Restrict access to Snoozed emails' },
    { key: 'gmail.sent', label: 'Sent Mail', description: 'Restrict access to the Sent folder' },
    { key: 'gmail.drafts', label: 'Drafts', description: 'Restrict access to Drafts' },
    { key: 'gmail.purchases', label: 'Purchases', description: 'Restrict access to Purchases category' },
    { key: 'gmail.important', label: 'Important', description: 'Restrict access to Important emails' },
    { key: 'gmail.scheduled', label: 'Scheduled', description: 'Restrict access to Scheduled emails' },
    { key: 'gmail.all_mail', label: 'All Mail', description: 'Restrict access to All Mail' },
    { key: 'gmail.spam', label: 'Spam', description: 'Restrict access to Spam folder' },
    { key: 'gmail.trash', label: 'Trash / Bin', description: 'Restrict access to Trash and delete functions' },
    { key: 'gmail.labels', label: 'Labels & Subscriptions', description: 'Restrict label and subscription management' },
    { key: 'gmail.compose', label: 'Compose', description: 'Restrict ability to compose new emails' },
    { key: 'gmail.settings', label: 'Settings', description: 'Restrict access to Gmail settings' },
    { key: 'gmail.contacts', label: 'Contacts', description: 'Restrict access to Google Contacts' },
  ],
};

function getCapabilitiesForSecret(
  secretName: string,
  vaultName?: string,
): { key: string; label: string; description: string }[] {
  // Check secret name first, then fall back to vault name.
  // Users often name secrets like "my-git-r" rather than "github-token",
  // so the vault name is a more reliable platform identifier.
  const candidates = [secretName.toLowerCase(), (vaultName ?? '').toLowerCase()];
  for (const candidate of candidates) {
    for (const [keyword, caps] of Object.entries(PLATFORM_CAPABILITY_MAP)) {
      if (candidate.includes(keyword)) return caps;
    }
  }
  return [];
}

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

// TODO(v1.1): Replace duplicated modal logic with a shared form component.
// RequestAccessModal -> SharedSessionForm <- GrantAccessModal
// This extraction should be done post-v1.0.1 release to minimize risk.
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

  // Compliance status — used to lock non-entitled vault options for FREE orgs.
  // Does NOT change any entitlement logic; backend 403 remains the final guard.
  const { status: complianceStatus } = useComplianceStatus(orgId);

  const [granteeId, setGranteeId] = useState(preselectedGranteeId || '');
  const [selectedAccessType, setSelectedAccessType] = useState<'GITHUB' | 'VERCEL' | 'GODADDY' | 'VAULT' | ''>('');
  
  // Derived state to keep logic intact
  const accessMode = selectedAccessType === 'VAULT' ? 'VAULT' : 'NATIVE';
  const selectedProvider = selectedAccessType === 'VAULT' ? '' : (selectedAccessType as IntegrationProvider | '');

  // Vault State
  const [selectedVaultId, setSelectedVaultId] = useState('');
  const [selectedSecretId, setSelectedSecretId] = useState('');
  // Permission type for vault sessions: REVEAL = web portal password reveal, EXTENSION = browser autofill only
  const [vaultPermission, setVaultPermission] = useState<'REVEAL' | 'EXTENSION'>('EXTENSION');

  // Capability State (generic — driven by PLATFORM_CAPABILITY_MAP)
  const [accessRestriction, setAccessRestriction] = useState<'full' | 'restricted'>('full');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  
  // Integration State
  const [selectedIntegrationResource, setSelectedIntegrationResource] = useState('');

  const [expiresInHours, setExpiresInHours] = useState<number | ''>(1);
  const [maxReveals, setMaxReveals] = useState<number | ''>(20);
  const [justification, setJustification] = useState('');

  const [integrationRole, setIntegrationRole] = useState<string>('DEVELOPER');


  // Fetch secrets whenever a vault is selected
  const { data: secrets = [], isLoading: isLoadingSecrets } = useSecretsByVault(
    orgId,
    selectedVaultId || null,
  );

  // Resolve available capabilities: check secret name first, then vault name as fallback.
  // Users often name secrets like "my-git-r" — the vault name is the reliable platform identifier.
  const selectedSecretName = secrets.find(s => s.id === selectedSecretId)?.name ?? '';
  const selectedVaultName = vaults.find(v => v.id === selectedVaultId)?.name ?? '';
  const availableCapabilities = getCapabilitiesForSecret(selectedSecretName, selectedVaultName);

  // Fetch Integrations
  const { data: connections = [] } = useIntegrations(orgId);
  const { data: providerResources = [], isLoading: isLoadingResources } = useIntegrationResources(orgId, selectedProvider || null);

  // Filter repositories if GitHub
  const repositories = providerResources.filter(r => r.type === 'REPOSITORY');

  const handleClose = () => {
    setGranteeId(preselectedGranteeId || '');
    setSelectedAccessType('');
    setSelectedIntegrationResource('');
    setSelectedVaultId('');
    setSelectedSecretId('');
    setVaultPermission('EXTENSION');
    setAccessRestriction('full');
    setSelectedCapabilities([]);
    setExpiresInHours(1);
    setMaxReveals(20);
    setJustification('');
    onClose();
  };

  const toggleCapability = (key: string) => {
    setSelectedCapabilities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleVaultChange = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setSelectedSecretId(''); // reset secret when vault changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!granteeId) { toast('warning', 'Please select a team member to grant access to.'); return; }
    
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
      justification: justification.trim() || undefined,
      // Only include capabilities if restricted mode is selected and capabilities exist
      capabilities: (accessRestriction === 'restricted' && selectedCapabilities.length > 0)
        ? selectedCapabilities
        : null,
    };

    if (accessMode === 'VAULT') {
      payload.scope = SessionScope.SECRET;
      payload.resourceId = selectedSecretId;
      payload.permission = vaultPermission === 'REVEAL' ? SessionPermission.REVEAL : SessionPermission.EXTENSION;

      const lower = selectedSecretName.toLowerCase();
      const matchedKeyword = Object.keys(PLATFORM_CAPABILITY_MAP).find(k => lower.includes(k));
      if (matchedKeyword) {
        payload.integrationProvider = matchedKeyword.toUpperCase();
      } else {
        const vault = vaults.find(v => v.id === selectedVaultId);
        if (vault) {
          payload.integrationProvider = vault.name;
        }
      }
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
          <CustomSelect
            value={granteeId}
            onChange={setGranteeId}
            options={members.map((m) => ({
              value: m.userId,
              label: `${m.user?.fullName || m.user?.email || m.userId} — ${m.role}`,
            }))}
            placeholder="Select a team member…"
          />
          <p className={hintClass}>The member who will receive temporary access.</p>
        </div>

        {/* Step 2: What do you want to access? */}
        <div>
          <label className={labelClass}>What do you want to access? <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            {connections.some(c => c.provider === 'GITHUB') && (
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${selectedAccessType === 'GITHUB' ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-zinc-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-zinc-950'}`}>
                <input type="radio" name="accessType" className="hidden" checked={selectedAccessType === 'GITHUB'} onChange={() => { setSelectedAccessType('GITHUB'); setSelectedIntegrationResource(''); }} />
                <GitBranch className={`w-4 h-4 ${selectedAccessType === 'GITHUB' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'GITHUB' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>GitHub Repository</span>
              </label>
            )}
            {connections.some(c => c.provider === 'VERCEL') && (
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${selectedAccessType === 'VERCEL' ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-zinc-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-zinc-950'}`}>
                <input type="radio" name="accessType" className="hidden" checked={selectedAccessType === 'VERCEL'} onChange={() => { setSelectedAccessType('VERCEL'); setSelectedIntegrationResource(''); }} />
                <Triangle className={`w-4 h-4 ${selectedAccessType === 'VERCEL' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'VERCEL' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>Vercel Project</span>
              </label>
            )}
            {/* HIDDEN: GoDaddy is temporarily disabled per request */}
            {/* 
            {connections.some(c => c.provider === 'GODADDY') && (
              <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${selectedAccessType === 'GODADDY' ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-zinc-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-zinc-950'}`}>
                <input type="radio" name="accessType" className="hidden" checked={selectedAccessType === 'GODADDY'} onChange={() => { setSelectedAccessType('GODADDY'); setSelectedIntegrationResource(''); }} />
                <Globe className={`w-4 h-4 ${selectedAccessType === 'GODADDY' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'GODADDY' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>GoDaddy Account</span>
              </label>
            )}
            */}
            {/* Vault is always available */}
              <label className={`col-span-2 flex justify-center items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAccessType === 'VAULT' ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-zinc-900' : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-zinc-950'}`}>
                <input type="radio" name="accessType" className="hidden" value="VAULT" checked={selectedAccessType === 'VAULT'} onChange={() => setSelectedAccessType('VAULT')} />
                <Lock className={`w-4 h-4 ${selectedAccessType === 'VAULT' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${selectedAccessType === 'VAULT' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>
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
                <CustomSelect
                  value={selectedIntegrationResource}
                  onChange={setSelectedIntegrationResource}
                  options={providerResources.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                  disabled={isLoadingResources}
                  placeholder={isLoadingResources ? 'Loading resources...' : 'Select a resource…'}
                />
              </div>
            )}

            {selectedProvider === 'VERCEL' && (
              <div>
                <label className={labelClass}>Role <span className="text-red-500">*</span></label>
                <CustomSelect
                  value={integrationRole}
                  onChange={setIntegrationRole}
                  options={[
                    { value: 'VIEWER', label: 'Viewer (Read-only)' },
                    { value: 'DEVELOPER', label: 'Developer (Push/Deploy)' },
                    { value: 'PROJECT_DEVELOPER', label: 'Project Developer' },
                  ]}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label className={labelClass}>Vault <span className="text-red-500">*</span></label>
              <CustomSelect
                value={selectedVaultId}
                onChange={handleVaultChange}
                options={vaults.map((v) => {
                  // For FREE orgs, lock vaults whose platformId is not in the 2 selected platforms.
                  // PRO/BUSINESS: complianceStatus.plan !== 'FREE' → no locking.
                  const isFree = complianceStatus?.plan === 'FREE';
                  const selectedPlatforms = complianceStatus?.selectedPlatforms ?? [];
                  const isLocked =
                    isFree &&
                    !!v.platformId &&
                    !selectedPlatforms.includes(v.platformId);
                  return {
                    value: v.id,
                    label: v.name,
                    locked: isLocked,
                    lockedReason: isLocked ? 'PRO only' : undefined,
                  };
                })}
                placeholder="Select a vault…"
              />
            </div>

            <div>
              <label className={labelClass}>Secret <span className="text-red-500">*</span></label>
              <CustomSelect
                value={selectedSecretId}
                onChange={setSelectedSecretId}
                options={secrets.map((s) => ({
                  value: s.id,
                  label: `${s.name}${s.description ? ` — ${s.description}` : ''}`,
                }))}
                disabled={!selectedVaultId || isLoadingSecrets}
                placeholder={
                  !selectedVaultId
                    ? 'Select a vault first…'
                    : isLoadingSecrets
                      ? 'Loading secrets…'
                      : secrets.length === 0
                        ? 'No secrets in this vault'
                        : 'Select a secret…'
                }
              />
            </div>

            {/* Access Type: EXTENSION vs REVEAL — clearly differentiated for admin */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Access Type</span>
                <span className="ml-auto text-[10px] text-slate-400">Choose what this member can do with this credential</span>
              </div>
              <div className="p-3.5 grid grid-cols-2 gap-2">
                <label className={clsx(
                  'flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all',
                  vaultPermission === 'EXTENSION'
                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}>
                  <input type="radio" name="vaultPermission" className="hidden" checked={vaultPermission === 'EXTENSION'} onChange={() => setVaultPermission('EXTENSION')} />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="text-indigo-500">⬡</span> Browser Extension
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Allows autofill via the WITHUS browser extension. <strong>Password is never shown</strong> in the web portal.
                  </span>
                </label>
                <label className={clsx(
                  'flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-all',
                  vaultPermission === 'REVEAL'
                    ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                )}>
                  <input type="radio" name="vaultPermission" className="hidden" checked={vaultPermission === 'REVEAL'} onChange={() => setVaultPermission('REVEAL')} />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="text-amber-500">⚠</span> Password Reveal
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Allows the member to reveal the plaintext password in the WITHUS web portal. Use with caution.
                  </span>
                </label>
              </div>
            </div>

          {/* Capability restriction section — only shown when a secret with known capabilities is selected */}
          {accessMode === 'VAULT' && availableCapabilities.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Access Mode</span>
              </div>
              <div className="p-3.5 space-y-2.5">
                {/* Radio: Full Access */}
                <label className={clsx(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  accessRestriction === 'full'
                    ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}>
                  <input
                    type="radio"
                    name="accessRestriction"
                    className="mt-0.5 accent-slate-900 dark:accent-slate-100"
                    checked={accessRestriction === 'full'}
                    onChange={() => { setAccessRestriction('full'); setSelectedCapabilities([]); }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Full Access</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Delegate can use all modules on this platform.</p>
                  </div>
                </label>

                {/* Radio: Restricted Access */}
                <label className={clsx(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  accessRestriction === 'restricted'
                    ? 'border-slate-900 bg-slate-50 dark:border-slate-300 dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}>
                  <input
                    type="radio"
                    name="accessRestriction"
                    className="mt-0.5 accent-slate-900 dark:accent-slate-100"
                    checked={accessRestriction === 'restricted'}
                    onChange={() => setAccessRestriction('restricted')}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Restricted Access</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Limit delegate to specific modules only.</p>

                    {/* Capability checklist — only shown when restricted is selected */}
                    {accessRestriction === 'restricted' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Allowed Modules</p>
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                          {availableCapabilities.map(cap => (
                            <label
                              key={cap.key}
                              className={clsx(
                                'flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer transition-all',
                                selectedCapabilities.includes(cap.key)
                                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/20'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-300'
                              )}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 accent-emerald-600"
                                checked={selectedCapabilities.includes(cap.key)}
                                onChange={() => toggleCapability(cap.key)}
                              />
                              <div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{cap.label}</p>
                                <p className="text-[10px] text-slate-400">{cap.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        {selectedCapabilities.length === 0 && (
                          <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-1">⚠ Select at least one module to allow.</p>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}
        </>
        )}

        {/* Step 4: Reason / Justification */}
        <div>
          <label className={labelClass}>
            Reason / Justification <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Need access for deployment..."
            className={selectClass}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
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
