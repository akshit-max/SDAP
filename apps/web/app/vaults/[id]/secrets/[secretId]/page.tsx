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
        <div className="space-y-5 max-w-4xl mx-auto">
          <div>
            <div className="flex items-center text-xs text-slate-500 font-medium mb-1.5">
              <Link href="/vaults" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Vaults</Link>
              <span className="mx-1.5 text-slate-300 dark:text-slate-750">/</span>
              <Link href={`/vaults/${id}`} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">{vault?.name || 'Vault'}</Link>
              <span className="mx-1.5 text-slate-300 dark:text-slate-750">/</span>
              <span className="text-slate-900 dark:text-slate-100 font-semibold">{secret.name}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <FileKey2 className="w-5 h-5 mr-2 text-slate-850 dark:text-slate-150" />
              {secret.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{secret.description || 'No description provided.'}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Secret Information</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-900/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                {secret.status}
              </span>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Type</h4>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{secret.type}</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Created</h4>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                    {new Date(secret.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</h4>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{secret.status}</p>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Last Updated</h4>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400 dark:text-slate-500" />
                    {new Date(secret.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">Secret Value</h4>
                {organization?.role === 'MEMBER' && !activeSessionForSecret ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700/50 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                      You don't have permission to reveal this secret.
                      <br />
                      Request temporary access from an administrator.
                    </p>
                    <Link 
                      href="/sessions" 
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      Request Access
                    </Link>
                  </div>
                ) : (
                  <>
                    {deliveryMethod === 'EXTENSION' && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center space-y-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            This secret is securely delivered via the WITHUS Browser Extension.
                          </p>
                          {activeSessionForSecret && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                              Session Active
                            </p>
                          )}
                        </div>
                        <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                          <Play className="w-4 h-4 mr-2" />
                          Launch Session
                        </button>
                      </div>
                    )}
                    
                    {deliveryMethod === 'NATIVE' && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center">
                        <Shield className="w-8 h-8 text-blue-500 mb-2" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Managed by WITHUS
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          This secret is automatically injected into connected workflows. Reveal is disabled for security.
                        </p>
                      </div>
                    )}

                    {deliveryMethod === 'REVEAL' && (
                      <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-lg p-4 flex gap-3">
                          <span className="text-amber-500 mt-0.5">⚠</span>
                          <div>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-0.5">Emergency Reveal</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
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
