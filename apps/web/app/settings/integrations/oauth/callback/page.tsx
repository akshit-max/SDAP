'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOAuthCallback } from '../../../../../hooks/useIntegrations';
import { useToast } from '../../../../../components/common/Toast';
import { IntegrationProvider } from '../../../../../lib/api/integrations';
import { Loader2 } from 'lucide-react';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [error, setError] = useState<string | null>(null);
  
  const code = searchParams.get('code');
  const stateBase64 = searchParams.get('state');
  
  // We need the orgId to initialize the hook, but we only have it inside the state.
  // We can decode it from state if present.
  let decodedOrgId: string | null = null;
  let decodedProvider: IntegrationProvider | null = null;
  
  try {
    if (stateBase64) {
      const stateStr = atob(stateBase64);
      const stateObj = JSON.parse(stateStr);
      decodedOrgId = stateObj.orgId;
      decodedProvider = stateObj.provider as IntegrationProvider;
    }
  } catch (err) {
    console.error('Failed to parse OAuth state', err);
  }

  const { mutate: handleOAuthCallback } = useOAuthCallback(decodedOrgId);
  const callbackAttempted = useRef(false);

  useEffect(() => {
    if (callbackAttempted.current) return;

    if (!code) {
      setError('Missing authorization code.');
      return;
    }
    
    if (!decodedOrgId || !decodedProvider) {
      setError('Missing or invalid state parameter.');
      return;
    }

    callbackAttempted.current = true;
    
    handleOAuthCallback(
      { provider: decodedProvider, code },
      {
        onSuccess: (data) => {
          toast('success', `${decodedProvider} connected successfully as ${data.identity}`);
          router.push('/settings/integrations');
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || 'OAuth connection failed.';
          setError(msg);
          toast('error', msg);
        },
      }
    );
  }, [code, decodedOrgId, decodedProvider, handleOAuthCallback, router, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      {error ? (
        <>
          <div className="text-red-500 font-medium">{error}</div>
          <button
            onClick={() => router.push('/settings/integrations')}
            className="px-4 py-2 text-sm font-medium bg-premium text-premium-main rounded-md hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Return to Integrations
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-premium-muted" />
          <p className="text-premium-muted text-sm animate-pulse">
            Completing authentication...
          </p>
        </>
      )}
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-premium-muted" /></div>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
