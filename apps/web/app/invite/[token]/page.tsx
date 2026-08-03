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
  // Reusable wrappers for consistency
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center bg-premium-background p-4">
      {children}
    </div>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="max-w-sm w-full premium-card p-8 text-center shadow-2xl">
      {children}
    </div>
  );

  // Loading state for fetching invite details
  if (isDetailsLoading) {
    return (
      <Wrapper>
        <Card>
          <Loader2 className="w-10 h-10 text-premium-muted mx-auto mb-4 animate-spin" />
          <p className="text-sm font-bold text-premium-main">Loading invitation...</p>
        </Card>
      </Wrapper>
    );
  }

  // Graceful Error Screens based on invite status
  if (!inviteDetails || inviteDetails.status === 'INVALID') {
    return (
      <Wrapper>
        <Card>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-premium-main mb-2">Invalid Invitation</h2>
          <p className="text-sm text-premium-muted mb-6 font-semibold">This invitation link does not exist or is malformed.</p>
          <button onClick={() => router.push('/')} className="w-full premium-button-primary">
            Go to Homepage
          </button>
        </Card>
      </Wrapper>
    );
  }

  if (inviteDetails.status === 'EXPIRED') {
    return (
      <Wrapper>
        <Card>
          <CalendarX className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-premium-main mb-2">Invitation Expired</h2>
          <p className="text-sm text-premium-muted mb-6 font-semibold">This invitation has expired. Please ask the administrator to send a new one.</p>
          <button onClick={() => router.push('/')} className="w-full premium-button-primary">
            Go to Homepage
          </button>
        </Card>
      </Wrapper>
    );
  }

  if (inviteDetails.status === 'ACCEPTED') {
    return (
      <Wrapper>
        <Card>
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-premium-main mb-2">Already Accepted</h2>
          <p className="text-sm text-premium-muted mb-6 font-semibold">This invitation has already been accepted.</p>
          <button onClick={() => router.push('/login')} className="w-full premium-button-primary">
            Log In
          </button>
        </Card>
      </Wrapper>
    );
  }

  if (inviteDetails.status === 'REVOKED') {
    return (
      <Wrapper>
        <Card>
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-premium-main mb-2">Invitation Revoked</h2>
          <p className="text-sm text-premium-muted mb-6 font-semibold">This invitation was revoked by the administrator.</p>
          <button onClick={() => router.push('/')} className="w-full premium-button-primary">
            Go to Homepage
          </button>
        </Card>
      </Wrapper>
    );
  }

  // Not logged in -> Show rich invite UI
  if (!isLoggedIn) {
    return (
      <Wrapper>
        <Card>
          <div className="mx-auto w-12 h-12 bg-premium-main rounded-xl flex items-center justify-center mb-5">
            <Shield className="w-6 h-6 text-premium-surface" />
          </div>
          <h2 className="text-base font-bold text-premium-main mb-2">
            You've been invited to join {inviteDetails.organizationName}
          </h2>
          <p className="text-xs text-premium-muted font-semibold mb-6">
            Invited by <span className="font-bold text-premium-main">{inviteDetails.inviterName}</span>
          </p>
          <div className="bg-slate-50/50 dark:bg-zinc-900/50 rounded-lg border border-premium py-2 px-3 mb-4 inline-block">
            <p className="text-[10px] font-bold uppercase tracking-wider text-premium-muted">Invited Email: <span className="font-mono text-premium-main lowercase">{inviteDetails.invitedEmail}</span></p>
          </div>

          <div className="mb-6 p-4 bg-slate-50/50 dark:bg-zinc-900/30 border border-premium/50 rounded-lg text-center text-xs font-semibold leading-relaxed">
            <p className="text-premium-main font-bold mb-1">First time joining WithUs?</p>
            <p className="text-premium-muted text-[11px]">
              Click <span className="text-premium-main font-bold">Create Account</span> using your invited email address.
            </p>
            <p className="text-premium-muted text-[11px] mt-0.5">
              Already have an account? Simply <span className="text-premium-main font-bold">Sign In</span>.
            </p>
          </div>
          
          <div className="space-y-3">
            <button onClick={() => router.push(`/login?redirect=/invite/${token}`)}
              className="w-full premium-button-primary">
              Sign In
            </button>
            <button onClick={() => router.push(`/register?redirect=/invite/${token}`)}
              className="w-full premium-button-secondary">
              Create Account
            </button>
          </div>
        </Card>
      </Wrapper>
    );
  }

  // Logged in & PENDING -> Show accepting state
  return (
    <Wrapper>
      <Card>
        {isAccepting && (
          <>
            <Loader2 className="w-10 h-10 text-premium-muted mx-auto mb-4 animate-spin" />
            <p className="text-sm font-bold text-premium-main">Joining {inviteDetails.organizationName}...</p>
          </>
        )}
        {isSuccess && (
          <>
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <p className="text-base font-bold text-premium-main">Welcome to the team!</p>
            <p className="text-xs text-premium-muted font-semibold mt-1">Redirecting to your dashboard...</p>
          </>
        )}
        {isError && (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-base font-bold text-premium-main">Invitation Failed</p>
            <p className="text-xs text-premium-muted font-semibold mt-1">{(error as Error)?.message || 'There was a problem joining the organization.'}</p>
            <button onClick={() => router.push('/dashboard')} className="mt-6 text-xs font-bold text-premium-main hover:underline">
              Go to Dashboard
            </button>
          </>
        )}
      </Card>
    </Wrapper>
  );
}
