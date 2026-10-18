'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../../components/layout/DashboardShell';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useHealthCheck,
  useOAuthUrl,
  useAnalyzePortal,
} from '../../../hooks/useIntegrations';
import { useToast } from '../../../components/common/Toast';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { formatDateTime } from '../../../lib/formatters';
import { PromptModal } from '../../../components/common/PromptModal';
import { hasPermission } from '../../../lib/auth/permissions';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Link2,
  Link2Off,
  ExternalLink,
  Loader2,
  Globe,
  Code2,
  Zap,
  Mail,
} from 'lucide-react';
import type { IntegrationProvider, IntegrationConnection } from '../../../lib/api/integrations';

// ─── Provider Metadata ────────────────────────────────────────────────────────

const PROVIDERS: {
  id: IntegrationProvider;
  name: string;
  description: string;
  docsUrl: string;
  authenticationType: 'PAT' | 'OAUTH';
  // Required only if authenticationType === 'PAT'
  patUrl?: string;
  patHint?: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'GMAIL',
    name: 'Gmail',
    description: 'Connect your Gmail account to allow WITHUS to extract OTPs sent to your organization inbox automatically.',
    docsUrl: 'https://developers.google.com/gmail/api',
    authenticationType: 'OAUTH',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: 'VERCEL',
    name: 'Vercel',
    description: 'Native Vercel Integration. Requires Vercel Pro Team. Hobby plans do not support team invitations.',
    docsUrl: 'https://vercel.com/docs/rest-api',
    patUrl: 'https://vercel.com/account/tokens',
    patHint: 'Create a token at vercel.com/account/tokens. Requires "Full Account" scope.',
    authenticationType: 'PAT',
    icon: <span className="text-lg font-bold">▲</span>,
  },
  {
    id: 'GITHUB',
    name: 'GitHub',
    description: 'Native GitHub Integration. Manage repository access automatically.',
    docsUrl: 'https://docs.github.com/en/rest',
    patUrl: 'https://github.com/settings/tokens',
    patHint: 'Create a PAT (classic) with: read:org, admin:org, repo. Or a Fine-grained token with org access.',
    authenticationType: 'PAT',
    icon: <Code2 className="w-5 h-5" />,
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Connected
      </span>
    );
  if (status === 'ERROR')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Error
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
      Not Connected
    </span>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  provider,
  connection,
  onConnect,
  onDisconnect,
  onHealthCheck,
  isCheckingHealth,
  canManage,
}: {
  provider: typeof PROVIDERS[0];
  connection?: IntegrationConnection;
  onConnect: (provider: IntegrationProvider) => void;
  onDisconnect: (provider: IntegrationProvider) => void;
  onHealthCheck: (provider: IntegrationProvider) => void;
  isCheckingHealth: boolean;
  canManage: boolean;
}) {
  const isConnected = connection?.status === 'ACTIVE' || connection?.status === 'ERROR';

  return (
    <div className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/20 transition-all">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center text-zinc-900 dark:text-white flex-shrink-0 shadow-sm">
              {provider.icon}
            </div>
            <div>
              <p className="text-sm font-extrabold text-zinc-900 dark:text-white truncate tracking-tight">{provider.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {provider.authenticationType === 'OAUTH' ? 'OAuth 2.0' : 'Personal Token'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={connection?.status || 'DISCONNECTED'} />
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              title="Documentation"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed font-normal">
          {provider.description}
        </p>

        {/* Last checked */}
        {connection?.lastCheckedAt && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3 font-medium">
            Last checked: {formatDateTime(connection.lastCheckedAt)}
            {(connection.providerMeta as any)?.identity && ` · ${(connection.providerMeta as any).identity}`}
          </p>
        )}

        {/* Error */}
        {connection?.lastError && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mb-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-1.5 font-medium">
            {connection.lastError}
          </p>
        )}
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-white/10 pt-4 mt-2">
          {isConnected ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                onClick={() => onHealthCheck(provider.id)}
                disabled={isCheckingHealth}
                className="px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.08] transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                Check Health
              </button>
              <button
                onClick={() => onDisconnect(provider.id)}
                className="px-3.5 py-1.5 text-[11px] font-bold rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all inline-flex items-center gap-1.5"
              >
                <Link2Off className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => onConnect(provider.id)}
              className="w-full px-4 py-2.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect {provider.name}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Connect Modal ────────────────────────────────────────────────────────────

function ConnectModal({
  provider,
  onClose,
  onConfirm,
  isPending,
}: {
  provider: typeof PROVIDERS[0] | null;
  onClose: () => void;
  onConfirm: (token: string) => void;
  isPending: boolean;
}) {
  if (!provider) return null;
  return (
    <PromptModal
      isOpen={!!provider}
      title={`Connect ${provider.name}`}
      message={provider.patHint || ''}
      label="Personal Access Token"
      placeholder="Paste your PAT here…"
      confirmLabel="Connect"
      required
      isPending={isPending}
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { organization, user } = useAuth();
  const orgId = organization?.id || '';
  const { data: connections = [], isLoading } = useIntegrations(orgId);
  const { mutate: connectIntegration, isPending: isConnecting } = useConnectIntegration(orgId);
  const { mutate: disconnectIntegration, isPending: isDisconnecting } = useDisconnectIntegration(orgId);
  const { mutate: runHealthCheck, isPending: isCheckingHealth } = useHealthCheck(orgId);
  const { mutate: getOAuthUrl } = useOAuthUrl(orgId);
  const { toast } = useToast();

  const canManage = hasPermission((organization as any)?.role, 'INTEGRATION_CONNECT');

  const [connectingProvider, setConnectingProvider] = useState<typeof PROVIDERS[0] | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<IntegrationProvider | null>(null);

  // Custom Portal Analysis State
  const [portalUrl, setPortalUrl] = useState('');
  const [portalResult, setPortalResult] = useState<{ compatible: boolean; platform: string | null; reason?: string } | null>(null);
  const { mutate: analyzePortal, isPending: isAnalyzing } = useAnalyzePortal(orgId);

  const handleInitiateConnect = (provider: typeof PROVIDERS[0]) => {
    if (provider.authenticationType === 'PAT') {
      setConnectingProvider(provider);
    } else if (provider.authenticationType === 'OAUTH') {
      getOAuthUrl(provider.id, {
        onSuccess: (data) => {
          if (data.url) window.location.href = data.url;
        },
        onError: (err: any) => {
          toast('error', err?.response?.data?.message || `Failed to initiate OAuth for ${provider.name}`);
        }
      });
    }
  };

  const handleConnect = (token: string) => {
    if (!connectingProvider) return;
    connectIntegration(
      { provider: connectingProvider.id, token },
      {
        onSuccess: (data) => {
          toast('success', `${connectingProvider.name} connected as ${data.identity}`);
          setConnectingProvider(null);
        },
        onError: (err: any) => {
          toast('error', err?.response?.data?.message || `Failed to connect ${connectingProvider.name}`);
        },
      },
    );
  };

  const handleDisconnect = () => {
    if (!disconnectingProvider) return;
    const name = PROVIDERS.find((p) => p.id === disconnectingProvider)?.name || disconnectingProvider;
    disconnectIntegration(disconnectingProvider, {
      onSuccess: () => {
        toast('success', `${name} disconnected.`);
        setDisconnectingProvider(null);
      },
      onError: (err: any) => {
        toast('error', err?.response?.data?.message || `Failed to disconnect ${name}`);
      },
    });
  };

  const handleHealthCheck = (provider: IntegrationProvider) => {
    const name = PROVIDERS.find((p) => p.id === provider)?.name || provider;
    runHealthCheck(provider, {
      onSuccess: (result) => {
        if (result.healthy) {
          toast('success', `${name} connection is healthy. ${result.identity ? `(${result.identity})` : ''}`);
        } else {
          toast('error', `${name} connection failed: ${result.error}`);
        }
      },
      onError: () => toast('error', `Health check for ${name} failed.`),
    });
  };

  const handleAnalyzePortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUrl.trim()) return;
    analyzePortal(portalUrl, {
      onSuccess: (data: any) => {
        setPortalResult(data);
      },
      onError: () => {
        setPortalResult({ compatible: false, platform: null, reason: 'error' });
      },
    });
  };

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-[1.5px] bg-sky-500" />
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              PLATFORM & SECURITY
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Connected Integrations
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Connect external developer platforms and OAuth providers to delegate access securely with zero raw credential exposure.
          </p>
        </div>

        {/* Level 1 Custom Portal Analyzer */}
        <div className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-2.5 mb-2">
            <Globe className="w-4 h-4 text-sky-500" />
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Add Custom Portal</h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 max-w-3xl leading-relaxed">
            Paste a portal login URL to check if WITHUS supports delegated access for it. WITHUS matches submitted URLs against verified platforms in our integration registry.
          </p>
          <form onSubmit={handleAnalyzePortal} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="url"
              className="flex-1 px-4 py-2.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
              placeholder="https://github.com/login"
              value={portalUrl}
              onChange={(e) => {
                setPortalUrl(e.target.value);
                setPortalResult(null);
              }}
              required
            />
            <button
              type="submit"
              disabled={isAnalyzing || !portalUrl}
              className="px-6 py-2.5 rounded-full bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Check URL'}
            </button>
          </form>

          {portalResult && (
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/10">
              {portalResult.compatible ? (
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider">Compatible Platform Detected</div>
                    <div className="text-xs opacity-90 mt-0.5">{portalResult.platform} detected. Verified WITHUS login automation engine ready.</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider">Custom Portal Notice</div>
                    <div className="text-xs opacity-90 mt-0.5">
                      {portalResult.reason === 'not_https'
                        ? 'Custom portals must use HTTPS for secure connection.'
                        : portalResult.reason === 'invalid_url'
                        ? 'Invalid URL format.'
                        : 'Not currently in the WITHUS verified registry. You can still store credentials securely in your vaults.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-md p-4 flex gap-3.5 items-center">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">
              Platform-Agnostic Access Delegation
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
              Connect external services to delegate authenticated sessions. Credentials stay end-to-end encrypted in the vault and your team members never see raw tokens or passwords.
            </p>
          </div>
        </div>

        {/* Provider Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {PROVIDERS.map((p) => (
              <div
                key={p.id}
                className="premium-card p-5 h-52 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {PROVIDERS.map((provider) => {
              const connection = connections.find((c) => c.provider === provider.id);
              return (
                <IntegrationCard
                  key={provider.id}
                  provider={provider}
                  connection={connection}
                  onConnect={(id) => handleInitiateConnect(PROVIDERS.find((p) => p.id === id)!)}
                  onDisconnect={(id) => setDisconnectingProvider(id)}
                  onHealthCheck={(id) => runHealthCheck(id)}
                  isCheckingHealth={isCheckingHealth}
                  canManage={canManage}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      <ConnectModal
        provider={connectingProvider}
        onClose={() => setConnectingProvider(null)}
        onConfirm={handleConnect}
        isPending={isConnecting}
      />

      {/* Disconnect Confirm */}
      <ConfirmModal
        isOpen={!!disconnectingProvider}
        title="Disconnect Integration"
        message={`Disconnect ${
          PROVIDERS.find((p) => p.id === disconnectingProvider)?.name || disconnectingProvider
        }? The stored credentials will be deleted. Existing sessions are not affected.`}
        confirmLabel="Disconnect"
        danger
        isPending={isDisconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectingProvider(null)}
      />
    </DashboardShell>
  );
}
