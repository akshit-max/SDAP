'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useVault } from '../../../../../hooks/useVaults';
import { useSecret } from '../../../../../hooks/useSecrets';
import { useIncomingSessions } from '../../../../../hooks/useSessions';
import { DashboardShell } from '../../../../../components/layout/DashboardShell';
import { Loading } from '../../../../../components/common/Loading';
import { ErrorState } from '../../../../../components/common/ErrorState';
import { RevealFlow } from '../../../../../components/secrets/RevealFlow';
import { FileKey2, Clock, CheckCircle, Shield, Play } from 'lucide-react';
import { useAuth } from '../../../../../lib/auth/AuthContext';
import { hasPermission } from '../../../../../lib/auth/permissions';
import { formatDateTime } from '../../../../../lib/formatters';

export default function SecretDetailsPage({ params }: { params: Promise<{ id: string; secretId: string }> }) {
  const { id, secretId } = use(params);
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const { data: vault, isLoading: vaultLoading } = useVault(orgId, id);
  const { data: secret, isLoading: secretLoading, isError, refetch } = useSecret(orgId, id, secretId);
  
  const { data: incomingSessions = [] } = useIncomingSessions(orgId);
  // Only a session with permission='REVEAL' authorizes password reveal in the web portal.
  // An EXTENSION session (browser autofill only) must NOT unlock the Reveal UI.
  const activeSessionForSecret = incomingSessions.find(
    (s: any) => s.scope === 'SECRET'
      && s.resourceId === secretId
      && s.status === 'ACTIVE'
      && s.permission === 'REVEAL'   // ← explicit: EXTENSION sessions are excluded
  );

  // TODO(v1.1): Do not derive deliveryMethod from secret.type. The secret type and delivery method are different concepts.
  // The UI should read the actual session delivery method (or whatever source of truth the backend exposes) 
  // instead of inferring it. Replace this mapping with the backend deliveryMethod once exposed.
  const getDeliveryMethod = (type: string): 'REVEAL' | 'EXTENSION' | 'NATIVE' => {
    if (type === 'COOKIE' || type === 'OAUTH') return 'EXTENSION';
    if (type === 'API_KEY' || type === 'TOKEN') return 'NATIVE';
    return 'REVEAL';
  };

  const deliveryMethod = secret ? getDeliveryMethod(secret.type) : 'REVEAL';

  return (
    <DashboardShell>
      {(vaultLoading || secretLoading) ? (
        <Loading message="Loading secret details..." />
      ) : isError || !secret ? (
        <ErrorState 
          title="Failed to load secret" 
          message="We encountered an error while communicating with the Vault service." 
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
          {/* Header */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
              <Link href="/vaults" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Vaults</Link>
              <span>/</span>
              <Link href={`/vaults/${id}`} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{vault?.name || 'Vault'}</Link>
              <span>/</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{secret.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 flex items-center justify-center text-zinc-800 dark:text-zinc-200 shadow-sm">
                <FileKey2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {secret.name}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{secret.description || 'Protected credential secret.'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200/60 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.02] flex justify-between items-center">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Secret Specifications</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {secret.status}
              </span>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Format</h4>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1 font-mono">{secret.type}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Created</h4>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {formatDateTime(secret.createdAt)}
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status</h4>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1">{secret.status}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Last Modified</h4>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {formatDateTime(secret.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="border-t border-zinc-200/60 dark:border-white/10 pt-6">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">Payload & Reveal Control</h4>
                {/* Gate: show Reveal UI only if user has SECRET_REVEAL permission (OWNER/ADMIN)
                    OR has an active session with permission='REVEAL'.
                    An EXTENSION session does NOT satisfy the second condition. */}
                {!hasPermission(organization?.role, 'SECRET_REVEAL') && !activeSessionForSecret ? (
                  <div className="rounded-[22px] border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] p-8 text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed max-w-md mx-auto">
                      Direct reveal is restricted for your role. You can request temporary access through delegated sessions from a workspace administrator.
                    </p>
                    <Link 
                      href="/sessions" 
                      className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-all shadow-sm"
                    >
                      Request Delegated Access
                    </Link>
                  </div>
                ) : (
                  <>
                    {deliveryMethod === 'EXTENSION' && (
                      <div className="rounded-[22px] border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] p-8 flex flex-col items-center justify-center space-y-4 text-center">
                        <div>
                          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            This secret is delivered directly to your browser session via the WithUs Browser Extension.
                          </p>
                          {activeSessionForSecret && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold uppercase tracking-wider">
                              Session Active
                            </p>
                          )}
                        </div>
                        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm">
                          <Play className="w-3.5 h-3.5" />
                          Launch Session
                        </button>
                      </div>
                    )}
                    
                    {deliveryMethod === 'NATIVE' && (
                      <div className="rounded-[22px] border border-zinc-200/80 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center">
                        <Shield className="w-8 h-8 text-zinc-400 mb-2" />
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                          Managed Platform Injection
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                          This secret is automatically injected into connected workflows. Manual reveal is disabled for security.
                        </p>
                      </div>
                    )}

                    {deliveryMethod === 'REVEAL' && (
                      <div className="space-y-4">
                        <div className="rounded-[20px] border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/10 p-4 flex gap-3">
                          <span className="text-amber-500 font-bold">⚠</span>
                          <div>
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-0.5">Emergency Decryption Access</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
                              Revealing plaintext values will be permanently logged in the workspace audit trail. Only decrypt when automated browser fill cannot be used.
                            </p>
                          </div>
                        </div>
                        <RevealFlow orgId={orgId} vaultId={id} secretId={secretId} sessionId={activeSessionForSecret?.id} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
