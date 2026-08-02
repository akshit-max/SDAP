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
}[] = [
  {
    id: 'VERCEL',
    name: 'Vercel',
    description: 'Native Vercel Integration. Requires Vercel Pro Team. Hobby plans do not support team invitations.',
    docsUrl: 'https://vercel.com/docs/rest-api',
    patUrl: 'https://vercel.com/account/tokens',
    patHint: 'Create a token at vercel.com/account/tokens. Requires "Full Account" scope.',
    icon: <span className="text-lg font-bold">▲</span>,
  },
  {
    id: 'GITHUB',
    name: 'GitHub',
    description: 'Native GitHub Integration. Manage repository access automatically.',
    docsUrl: 'https://docs.github.com/en/rest',
    patUrl: 'https://github.com/settings/tokens',
    patHint: 'Create a PAT (classic) with: read:org, admin:org, repo. Or a Fine-grained token with org access.',
    icon: <Code2 className="w-5 h-5" />,
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle className="w-3 h-3" /> Connected
      </span>
    );
  if (status === 'ERROR')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20">
        <AlertCircle className="w-3 h-3" /> Error
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-premium-muted border border-premium">
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
    <div className="premium-card p-5 shadow-none transition-all duration-150">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-premium-main flex-shrink-0">
            {provider.icon}
          </div>
          <p className="text-sm font-bold text-premium-main truncate">{provider.name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={connection?.status || 'DISCONNECTED'} />
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
            title="Documentation"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-premium-muted mb-3 leading-relaxed">
        {provider.description}
      </p>

      {/* Last checked */}
      {connection?.lastCheckedAt && (
        <p className="text-[10px] text-premium-muted mb-3 font-semibold">
          Last checked: {new Date(connection.lastCheckedAt).toLocaleString()}
          {(connection.providerMeta as any)?.identity && ` · ${(connection.providerMeta as any).identity}`}
        </p>
      )}

      {/* Error */}
      {connection?.lastError && (
        <p className="text-[10px] text-red-500 dark:text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 font-semibold">
          {connection.lastError}
        </p>
      )}

      {/* Actions */}
      {canManage && (
        <div className="flex items-center gap-2 border-t border-premium pt-3">
          {isConnected ? (
            <>
              <button
                onClick={() => onDisconnect(provider.id)}
                className="py-1 px-2.5 text-[10px] font-semibold rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 transition-all duration-150 inline-flex items-center justify-center"
              >
                <Link2Off className="w-3 h-3 mr-1" />
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => onConnect(provider.id)}
              className="premium-button-primary"
            >
              <Link2 className="w-3.5 h-3.5 mr-1" />
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
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-premium">
          <h1 className="text-lg font-bold tracking-tight text-premium-main">Integrations</h1>
          <p className="text-xs text-premium-muted mt-0.5">
            Connect external platforms to delegate access securely through WithUs.
          </p>
        </div>

        {/* Info Banner */}
        <div className="border border-premium bg-slate-50/20 dark:bg-zinc-900/10 rounded-lg p-4 flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
            <Zap className="w-4 h-4 text-premium-muted" />
          </div>
          <div>
            <p className="text-xs font-bold text-premium-main mb-0.5">
              Platform-Agnostic Integrations
            </p>
            <p className="text-xs text-premium-muted leading-relaxed">
              Connect your developer platforms and delegate access securely. WithUs stores credentials
              encrypted and handles approval workflows — your team never shares passwords or tokens
              directly.
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
                  onConnect={(id) => setConnectingProvider(PROVIDERS.find((p) => p.id === id) || null)}
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
