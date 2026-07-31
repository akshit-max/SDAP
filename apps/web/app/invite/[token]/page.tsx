'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAcceptInvite } from '../../../hooks/useOrganization';
import { useToast } from '../../../components/common/Toast';
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { AuthSession } from '../../../lib/auth/session';

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: acceptInvite, isPending, isSuccess, isError, error } = useAcceptInvite();

  const { token } = use(params);
  const isLoggedIn = !!AuthSession.getCurrentUser();

  useEffect(() => {
    if (!isLoggedIn) return;
    acceptInvite(token, {
      onSuccess: () => {
        toast('success', 'You have joined the organization!');
        setTimeout(() => router.push('/dashboard'), 1500);
      },
      onError: () => {},
    });
  }, [token, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white dark:text-slate-900" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">You're Invited!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">You need to log in or create an account to accept this invitation.</p>
          <div className="space-y-3">
            <button onClick={() => router.push(`/login?redirect=/invite/${token}`)}
              className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold text-sm transition-colors hover:bg-slate-800">
              Sign In
            </button>
            <button onClick={() => router.push(`/register?redirect=/invite/${token}`)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-sm transition-colors hover:bg-slate-50">
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
        {isPending && (
          <>
            <Loader2 className="w-10 h-10 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Accepting invitation...</p>
          </>
        )}
        {isSuccess && (
          <>
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Welcome to the team!</p>
            <p className="text-xs text-slate-500 mt-1">Redirecting to your dashboard...</p>
          </>
        )}
        {isError && (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Invitation Failed</p>
            <p className="text-xs text-slate-500 mt-1">{(error as Error)?.message || 'This invitation may have expired or already been used.'}</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
