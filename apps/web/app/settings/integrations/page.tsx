'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../../components/layout/DashboardShell';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useHealthCheck,
} from '../../../hooks/useIntegrations';
import { useToast } from '../../../components/common/Toast';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { PromptModal } from '../../../components/common/PromptModal';
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
} from 'lucide-react';
import type { IntegrationProvider, IntegrationConnection } from '../../../lib/api/integrations';

// ─── Provider Metadata ────────────────────────────────────────────────────────

const PROVIDERS: {
  id: IntegrationProvider;
  name: string;
  description: string;
  docsUrl: string;
  patUrl: string;
  patHint: string;
  icon: React.ReactNode;
  capabilities: string[];
}[] = [
  {
    id: 'VERCEL',
    name: 'Vercel',
    description: 'Grant and revoke team membership on Vercel. Delegate deployment access securely.',
    docsUrl: 'https://vercel.com/docs/rest-api',
    patUrl: 'https://vercel.com/account/tokens',
    patHint: 'Create a token at vercel.com/account/tokens. Requires "Full Account" scope.',
    icon: <span className="text-lg font-bold">▲</span>,
    capabilities: ['List teams', 'Invite member', 'Remove member', 'Health check'],
  },
  {
    id: 'GITHUB',
    name: 'GitHub',
    description: 'Manage GitHub Organization membership. Grant collaborator access to repositories.',
    docsUrl: 'https://docs.github.com/en/rest',
    patUrl: 'https://github.com/settings/tokens',
    patHint: 'Create a PAT (classic) with: read:org, admin:org, repo. Or a Fine-grained token with org access.',
    icon: <Code2 className="w-5 h-5" />,
    capabilities: ['List organizations', 'Invite member', 'Remove member', 'Health check'],
  },
  {
    id: 'GODADDY',
    name: 'GoDaddy',
    description:
      'Validate GoDaddy API keys and list domains. Dashboard access requires the WITHUS Browser Extension.',
    docsUrl: 'https://developer.godaddy.com/doc',
    patUrl: 'https://developer.godaddy.com/keys',
    patHint:
      'Create an API key at developer.godaddy.com/keys. Format: "key:secret". Dashboard delegation requires the Browser Extension.',
    icon: <Globe className="w-5 h-5" />,
    capabilities: ['List domains', 'Validate API key', 'Health check', 'Browser Extension for dashboard'],
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
        <CheckCircle className="w-3 h-3" /> Connected
      </span>
    );
  if (status === 'ERROR')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200/50">
        <AlertCircle className="w-3 h-3" /> Error
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      <XCircle className="w-3 h-3" /> Not connected
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0">
            {provider.icon}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{provider.name}</p>
            <StatusBadge status={connection?.status || 'DISCONNECTED'} />
          </div>
        </div>
        <a
          href={provider.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Documentation"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
        {provider.description}
      </p>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1 mb-4">
        {provider.capabilities.map((cap) => (
          <span
            key={cap}
            className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full"
          >
            {cap}
          </span>
        ))}
      </div>

      {/* Last checked */}
      {connection?.lastCheckedAt && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-3">
          Last checked: {new Date(connection.lastCheckedAt).toLocaleString()}
        </p>
      )}

      {/* Error */}
      {connection?.lastError && (
        <p className="text-[10px] text-red-500 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 rounded-lg px-2 py-1">
          {connection.lastError}
        </p>
      )}

      {/* Actions */}
      {canManage && (
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          {isConnected ? (
            <>
              <button
                onClick={() => onHealthCheck(provider.id)}
                disabled={isCheckingHealth}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Test connection"
              >
                {isCheckingHealth ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Test
              </button>
              <button
                onClick={() => onDisconnect(provider.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              >
                <Link2Off className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => onConnect(provider.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors shadow-sm"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect
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
      message={provider.patHint}
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
  const { toast } = useToast();

  const currentMember = (organization as any)?.role;
  const canManage = currentMember === 'OWNER' || currentMember === 'ADMIN';

  const [connectingProvider, setConnectingProvider] = useState<typeof PROVIDERS[0] | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<IntegrationProvider | null>(null);

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

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Integrations</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Connect external platforms to delegate access securely through WITHUS.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-4 flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-0.5">
              Platform-Agnostic Integrations
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Connect your developer platforms and delegate access securely. WITHUS stores credentials
              encrypted and handles approval workflows — your team never shares passwords or tokens
              directly.
            </p>
          </div>
        </div>

        {/* Provider Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDERS.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 h-52 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDERS.map((provider) => {
              const connection = connections.find((c) => c.provider === provider.id);
              return (
                <IntegrationCard
                  key={provider.id}
                  provider={provider}
                  connection={connection}
                  onConnect={(id) => setConnectingProvider(PROVIDERS.find((p) => p.id === id) || null)}
                  onDisconnect={(id) => setDisconnectingProvider(id)}
                  onHealthCheck={handleHealthCheck}
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
