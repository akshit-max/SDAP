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

export default function SecretDetailsPage({ params }: { params: Promise<{ id: string; secretId: string }> }) {
  const { id, secretId } = use(params);
  const { organization } = useAuth();
  const orgId = organization?.id || '';
  const { data: vault, isLoading: vaultLoading } = useVault(orgId, id);
  const { data: secret, isLoading: secretLoading, isError, refetch } = useSecret(orgId, id, secretId);
  
  const { data: incomingSessions = [] } = useIncomingSessions(orgId);
  const activeSessionForSecret = incomingSessions.find(
    (s: any) => s.scope === 'SECRET' && s.resourceId === secretId && s.status === 'ACTIVE'
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
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="pb-2 border-b border-premium">
            <div className="flex items-center text-[10px] text-premium-muted font-bold uppercase tracking-wider mb-1.5">
              <Link href="/vaults" className="hover:text-premium-main transition-colors">Vaults</Link>
              <span className="mx-1.5 text-slate-350 dark:text-slate-700">/</span>
              <Link href={`/vaults/${id}`} className="hover:text-premium-main transition-colors">{vault?.name || 'Vault'}</Link>
              <span className="mx-1.5 text-slate-355 dark:text-slate-700">/</span>
              <span className="text-premium-main font-bold">{secret.name}</span>
            </div>
            <h2 className="text-lg font-bold text-premium-main tracking-tight flex items-center">
              <FileKey2 className="w-5 h-5 mr-2 text-premium-muted" />
              {secret.name}
            </h2>
            <p className="text-xs text-premium-muted mt-1">{secret.description || 'No description provided.'}</p>
          </div>

          <div className="premium-card overflow-hidden shadow-none">
            <div className="px-5 py-3 border-b border-premium bg-slate-50/20 dark:bg-zinc-900/10 flex justify-between items-center">
              <h3 className="text-xs font-bold text-premium-main uppercase tracking-wider">Secret Information</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                {secret.status}
              </span>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">Type</h4>
                  <p className="text-xs font-bold text-premium-main">{secret.type}</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">Created</h4>
                  <p className="text-xs font-bold text-premium-main flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-premium-muted" />
                    {new Date(secret.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">Status</h4>
                  <p className="text-xs font-bold text-premium-main">{secret.status}</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-premium-muted uppercase tracking-wider">Last Updated</h4>
                  <p className="text-xs font-bold text-premium-main flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-premium-muted" />
                    {new Date(secret.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-premium pt-5 mt-3">
                <h4 className="text-xs font-bold text-premium-main uppercase tracking-wider mb-3">Secret Value</h4>
                {organization?.role === 'MEMBER' && !activeSessionForSecret ? (
                  <div className="premium-card rounded-lg p-6 text-center">
                    <p className="text-xs font-semibold text-premium-muted mb-4">
                      You don't have permission to reveal this secret.
                      <br />
                      Request temporary access from an administrator.
                    </p>
                    <Link 
                      href="/sessions" 
                      className="premium-button-primary text-xs"
                    >
                      Request Access
                    </Link>
                  </div>
                ) : (
                  <>
                    {deliveryMethod === 'EXTENSION' && (
                      <div className="premium-card rounded-lg p-6 flex flex-col items-center justify-center space-y-4">
                        <div className="text-center">
                          <p className="text-xs font-semibold text-premium-muted">
                            This secret is securely delivered via the WithUs Browser Extension.
                          </p>
                          {activeSessionForSecret && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-bold uppercase tracking-wider">
                              Session Active
                            </p>
                          )}
                        </div>
                        <button className="premium-button-primary bg-emerald-650 hover:bg-emerald-700 text-white">
                          <Play className="w-4 h-4 mr-2" />
                          Launch Session
                        </button>
                      </div>
                    )}
                    
                    {deliveryMethod === 'NATIVE' && (
                      <div className="premium-card rounded-lg p-6 flex flex-col items-center justify-center text-center">
                        <Shield className="w-6 h-6 text-premium-muted mb-2" />
                        <p className="text-xs font-bold text-premium-main">
                          Managed by WithUs
                        </p>
                        <p className="text-[10px] text-premium-muted mt-1">
                          This secret is automatically injected into connected workflows. Reveal is disabled for security.
                        </p>
                      </div>
                    )}

                    {deliveryMethod === 'REVEAL' && (
                      <div className="space-y-4">
                        <div className="border border-amber-200/40 dark:border-amber-900/20 bg-amber-500/5 dark:bg-amber-950/10 rounded-lg p-4 flex gap-3">
                          <span className="text-amber-500 mt-0.5">⚠</span>
                          <div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-0.5">Emergency Reveal</p>
                            <p className="text-xs text-amber-700 dark:text-amber-350">
                              This action exposes the secret. Only use when automated access cannot be used.
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
