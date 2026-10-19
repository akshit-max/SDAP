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
import { formatDate } from '../../../lib/formatters';

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
    <form onSubmit={handleSubmit} className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 p-6 mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">Create New API Key</p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. CI Pipeline, Vercel Deploy)"
          className="flex-1 min-w-48 text-xs px-4 py-2.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm"
          required
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold whitespace-nowrap">Expires</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="text-xs px-3 py-2 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-zinc-900 dark:text-white focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white dark:text-zinc-950 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-full transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 whitespace-nowrap"
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-zinc-100 dark:border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/[0.06] text-sky-500 flex items-center justify-center flex-shrink-0">
          <Key className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{apiKey.name}</p>
          <code className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{apiKey.keyPrefix}…</code>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 flex-wrap">
        {/* Last used */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {apiKey.lastUsedAt ? `Used ${formatDate(apiKey.lastUsedAt)}` : 'Never used'}
        </div>

        {/* Expiry */}
        {apiKey.expiresAt && (
          <span className={`text-[11px] font-semibold ${isExpired ? 'text-rose-500' : 'text-zinc-400'}`}>
            {isExpired ? 'Expired' : `Expires ${formatDate(apiKey.expiresAt)}`}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onRotate(apiKey.id, apiKey.name)}
            className="p-2 rounded-lg text-zinc-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-white/[0.06] transition-colors"
            title="Rotate key"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRevoke(apiKey.id, apiKey.name)}
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-white/[0.06] transition-colors"
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-zinc-200/80 dark:border-white/10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-[1.5px] bg-sky-500" />
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
              DEVELOPER SETTINGS
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">API Keys</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Issue keys for CI/CD pipelines and external integrations. Keys are stored as hashes — only the prefix is visible after creation.
          </p>
        </div>

        {/* One-time reveal banner */}
        {revealedKey && (
          <RevealedKeyBanner rawKey={revealedKey.rawKey} onDismiss={() => setRevealedKey(null)} />
        )}

        {/* Create form */}
        <CreateKeyForm onSubmit={(name, exp) => createKey({ name, expiresAt: exp })} isPending={isCreating} />

        {/* Keys list */}
        <div className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 px-6 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading…</div>
          ) : keys.length === 0 ? (
            <div className="py-12 text-center">
              <Key className="w-6 h-6 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-medium">No API keys yet. Create one above.</p>
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
