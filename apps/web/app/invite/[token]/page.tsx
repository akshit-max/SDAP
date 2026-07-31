'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAcceptInvite, useInvitationDetails } from '../../../hooks/useOrganization';
import { useToast } from '../../../components/common/Toast';
import { Shield, Loader2, CheckCircle, XCircle, AlertCircle, CalendarX } from 'lucide-react';
import { AuthSession } from '../../../lib/auth/session';

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: acceptInvite, isPending: isAccepting, isSuccess, isError, error } = useAcceptInvite();

  const { token } = use(params);
  const isLoggedIn = !!AuthSession.getCurrentUser();

  const { data: inviteDetails, isLoading: isDetailsLoading } = useInvitationDetails(token);

  useEffect(() => {
    // Only attempt to accept if logged in AND the invite is valid (PENDING)
    if (isLoggedIn && inviteDetails?.status === 'PENDING') {
      acceptInvite(token, {
        onSuccess: () => {
          toast('success', `You have joined ${inviteDetails.organizationName}!`);
          setTimeout(() => router.push('/dashboard'), 1500);
        },
        onError: () => {},
      });
    }
  }, [token, isLoggedIn, inviteDetails, acceptInvite, toast, router]);

  // Loading state for fetching invite details
  if (isDetailsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
          <Loader2 className="w-10 h-10 text-slate-400 mx-auto mb-4 animate-spin" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Graceful Error Screens based on invite status
  if (!inviteDetails || inviteDetails.status === 'INVALID') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Invalid Invitation</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This invitation link does not exist or is malformed.</p>
          <button onClick={() => router.push('/')} className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold text-sm">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (inviteDetails.status === 'EXPIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
          <CalendarX className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Invitation Expired</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This invitation has expired. Please ask the administrator to send a new one.</p>
          <button onClick={() => router.push('/')} className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold text-sm">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (inviteDetails.status === 'ACCEPTED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Already Accepted</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This invitation has already been accepted.</p>
          <button onClick={() => router.push('/login')} className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold text-sm">
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (inviteDetails.status === 'REVOKED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Invitation Revoked</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This invitation was revoked by the administrator.</p>
          <button onClick={() => router.push('/')} className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-semibold text-sm">
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Not logged in -> Show rich invite UI
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white dark:text-slate-900" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
            You've been invited to join {inviteDetails.organizationName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Invited by <span className="font-semibold text-slate-700 dark:text-slate-300">{inviteDetails.inviterName}</span>
          </p>
          <div className="bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800 py-2 px-3 mb-6 inline-block">
            <p className="text-xs text-slate-500 dark:text-slate-400">Invited email: <span className="font-mono text-slate-800 dark:text-slate-200">{inviteDetails.invitedEmail}</span></p>
          </div>
          
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

  // Logged in & PENDING -> Show accepting state
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-800 p-8 text-center">
        {isAccepting && (
          <>
            <Loader2 className="w-10 h-10 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Joining {inviteDetails.organizationName}...</p>
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
            <p className="text-xs text-slate-500 mt-1">{(error as Error)?.message || 'There was a problem joining the organization.'}</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
