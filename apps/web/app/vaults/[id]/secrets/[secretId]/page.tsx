'use client';

import React from 'react';
import Link from 'next/link';
import { useVault } from '../../../../../hooks/useVaults';
import { useSecret } from '../../../../../hooks/useSecrets';
import { DashboardShell } from '../../../../../components/layout/DashboardShell';
import { Loading } from '../../../../../components/common/Loading';
import { ErrorState } from '../../../../../components/common/ErrorState';
import { RevealFlow } from '../../../../../components/secrets/RevealFlow';
import { FileKey2, Clock, CheckCircle } from 'lucide-react';

const ORG_ID = 'org-1'; // Hardcoded for this UI foundation sprint

export default function SecretDetailsPage({ params }: { params: { id: string; secretId: string } }) {
  const { data: vault, isLoading: vaultLoading } = useVault(ORG_ID, params.id);
  const { data: secret, isLoading: secretLoading, isError, refetch } = useSecret(ORG_ID, params.id, params.secretId);

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
          <div>
            <div className="flex items-center text-sm text-blue-600 font-medium mb-2">
              <Link href="/vaults" className="hover:underline">Vaults</Link>
              <span className="mx-2 text-gray-400">/</span>
              <Link href={`/vaults/${params.id}`} className="hover:underline">{vault?.name || 'Vault'}</Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">{secret.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileKey2 className="w-6 h-6 mr-3 text-blue-600" />
              {secret.name}
            </h2>
            <p className="text-sm text-gray-500 mt-2">{secret.description || 'No description provided.'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Secret Information</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {secret.status}
              </span>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</h4>
                  <p className="text-sm font-medium text-gray-900">{secret.type}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created</h4>
                  <p className="text-sm font-medium text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                    {new Date(secret.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</h4>
                  <p className="text-sm font-medium text-gray-900">{secret.status}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Updated</h4>
                  <p className="text-sm font-medium text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                    {new Date(secret.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Secret Value</h4>
                <RevealFlow orgId={ORG_ID} vaultId={params.id} secretId={params.secretId} />
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
