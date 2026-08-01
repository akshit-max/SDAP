'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../../components/layout/DashboardShell';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi, type ApiKey, type CreatedApiKey } from '../../../lib/api/api-keys';
import { useToast } from '../../../components/common/Toast';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import {
  Plus, Key, Trash2, RefreshCw, Copy, Check, Clock, AlertCircle, Eye, EyeOff, Terminal, Code2, PlayCircle
} from 'lucide-react';

// ─── One-time Key Display ─────────────────────────────────────────────────────

function RevealedKeyBanner({ rawKey, onDismiss }: { rawKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-amber-300/60 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">
            Copy this key now — it will never be shown again.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 text-xs font-mono bg-white/70 dark:bg-black/30 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg border border-amber-200/60 dark:border-amber-800/40 truncate">
              {visible ? rawKey : '•'.repeat(Math.min(rawKey.length, 48))}
            </code>
            <button
              onClick={() => setVisible((v) => !v)}
              className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 hover:bg-white dark:hover:bg-black/40 transition-colors"
              title={visible ? 'Hide key' : 'Show key'}
            >
              {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={copy}
              className="p-2 rounded-lg bg-white/70 dark:bg-black/20 border border-amber-200/60 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 hover:bg-white dark:hover:bg-black/40 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 font-medium"
        >
          I've saved it
        </button>
      </div>
      <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-800/30">
        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-3">
          Usage Examples
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* cURL */}
          <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200/40 dark:border-amber-800/20">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
              <Terminal className="w-3 h-3" /> cURL
            </div>
            <code className="block text-[10px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
              curl -H "Authorization: Bearer {visible ? rawKey : 'YOUR_API_KEY'}" \<br />
              &nbsp;&nbsp;https://api.withus.com/v1/sessions
            </code>
          </div>

          {/* GitHub Actions */}
          <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200/40 dark:border-amber-800/20">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
              <Code2 className="w-3 h-3" /> GitHub Actions
            </div>
            <code className="block text-[10px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              env:<br />
              &nbsp;&nbsp;WITHUS_API_KEY: ${'{'} secrets.WITHUS_API_KEY {'}'}
            </code>
          </div>

          {/* GitLab CI */}
          <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200/40 dark:border-amber-800/20">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
              <PlayCircle className="w-3 h-3" /> GitLab CI
            </div>
            <code className="block text-[10px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              variables:<br />
              &nbsp;&nbsp;WITHUS_API_KEY: $WITHUS_API_KEY
            </code>
          </div>

          {/* Vercel */}
          <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-amber-200/40 dark:border-amber-800/20">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
              <span className="text-[10px]">▲</span> Vercel Deploy
            </div>
            <code className="block text-[10px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              # Add to Environment Variables<br />
              Key: WITHUS_API_KEY<br />
              Value: {visible ? rawKey : 'YOUR_API_KEY'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateKeyForm({ onSubmit, isPending }: { onSubmit: (name: string, expiresAt?: string) => void; isPending: boolean }) {
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), expiresAt || undefined);
    setName('');
    setExpiresAt('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 mb-6">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Create New API Key</p>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. CI Pipeline, Vercel Deploy)"
          className="flex-1 min-w-48 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          required
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Expires</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="text-xs px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          {isPending ? 'Creating…' : 'Create Key'}
        </button>
      </div>
    </form>
  );
}

// ─── Key Row ──────────────────────────────────────────────────────────────────

function KeyRow({
  apiKey,
  onRevoke,
  onRotate,
}: {
  apiKey: ApiKey;
  onRevoke: (id: string, name: string) => void;
  onRotate: (id: string, name: string) => void;
}) {
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Key className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{apiKey.name}</p>
          <code className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{apiKey.keyPrefix}…</code>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
        {/* Last used */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
          <Clock className="w-3 h-3" />
          {apiKey.lastUsedAt ? `Used ${new Date(apiKey.lastUsedAt).toLocaleDateString()}` : 'Never used'}
        </div>

        {/* Expiry */}
        {apiKey.expiresAt && (
          <span className={`text-[10px] font-medium ${isExpired ? 'text-red-500' : 'text-slate-400'}`}>
            {isExpired ? 'Expired' : `Expires ${new Date(apiKey.expiresAt).toLocaleDateString()}`}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRotate(apiKey.id, apiKey.name)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            title="Rotate key"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRevoke(apiKey.id, apiKey.name)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="Revoke key"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys', orgId],
    queryFn: () => (orgId ? apiKeysApi.list(orgId) : Promise.resolve([])),
    enabled: !!orgId,
  });

  const [revealedKey, setRevealedKey] = useState<CreatedApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);
  const [rotateTarget, setRotateTarget] = useState<{ id: string; name: string } | null>(null);

  const { mutate: createKey, isPending: isCreating } = useMutation({
    mutationFn: (data: { name: string; expiresAt?: string }) => apiKeysApi.create(orgId, data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['api-keys', orgId] });
      setRevealedKey(created);
    },
    onError: (err: any) => toast('error', err?.response?.data?.message || 'Failed to create key'),
  });

  const { mutate: revokeKey, isPending: isRevoking } = useMutation({
    mutationFn: (keyId: string) => apiKeysApi.revoke(orgId, keyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys', orgId] });
      toast('success', 'API key revoked.');
      setRevokeTarget(null);
    },
    onError: (err: any) => toast('error', err?.response?.data?.message || 'Failed to revoke key'),
  });

  const { mutate: rotateKey, isPending: isRotating } = useMutation({
    mutationFn: (keyId: string) => apiKeysApi.rotate(orgId, keyId),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['api-keys', orgId] });
      setRevealedKey(created);
      setRotateTarget(null);
      toast('success', 'Key rotated — save the new key now.');
    },
    onError: (err: any) => toast('error', err?.response?.data?.message || 'Failed to rotate key'),
  });

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">API Keys</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Issue keys for CI/CD pipelines and integrations. Keys are stored as hashes — only the prefix is shown after creation.
          </p>
        </div>

        {/* One-time reveal banner */}
        {revealedKey && (
          <RevealedKeyBanner rawKey={revealedKey.rawKey} onDismiss={() => setRevealedKey(null)} />
        )}

        {/* Create form */}
        <CreateKeyForm onSubmit={(name, exp) => createKey({ name, expiresAt: exp })} isPending={isCreating} />

        {/* Keys list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 px-4">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading…</div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center">
              <Key className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No API keys yet. Create one above.</p>
            </div>
          ) : (
            keys.map((k) => (
              <KeyRow
                key={k.id}
                apiKey={k}
                onRevoke={(id, name) => setRevokeTarget({ id, name })}
                onRotate={(id, name) => setRotateTarget({ id, name })}
              />
            ))
          )}
        </div>
      </div>

      {/* Revoke confirm */}
      <ConfirmModal
        isOpen={!!revokeTarget}
        title="Revoke API Key"
        message={`Revoke "${revokeTarget?.name}"? Any integrations using this key will immediately stop working.`}
        confirmLabel="Revoke"
        danger
        isPending={isRevoking}
        onConfirm={() => revokeTarget && revokeKey(revokeTarget.id)}
        onCancel={() => setRevokeTarget(null)}
      />

      {/* Rotate confirm */}
      <ConfirmModal
        isOpen={!!rotateTarget}
        title="Rotate API Key"
        message={`Rotate "${rotateTarget?.name}"? The current key will be revoked and a new one generated. Update your integrations immediately.`}
        confirmLabel="Rotate"
        danger={false}
        isPending={isRotating}
        onConfirm={() => rotateTarget && rotateKey(rotateTarget.id)}
        onCancel={() => setRotateTarget(null)}
      />
    </DashboardShell>
  );
}
