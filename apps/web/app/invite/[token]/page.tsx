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
    <div className="max-w-md w-full premium-card p-10 text-center shadow-2xl">
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
          <div className="mx-auto w-12 h-12 mb-6">
            <img src="/logo.png" alt="WithUs Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-base font-bold text-premium-main mb-2">
            You've been invited to join {inviteDetails.organizationName}
          </h2>
          <p className="text-xs text-premium-muted font-semibold mb-8">
            Invited by <span className="font-bold text-premium-main">{inviteDetails.inviterName}</span>
          </p>

          <div className="space-y-6 text-left">
            {/* Option 1: Existing User */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">
                Already have an account?
              </label>
              <button 
                onClick={() => router.push(`/login?redirect=/invite/${token}`)}
                className="w-full premium-button-primary py-2.5 text-xs shadow-sm"
              >
                Sign In
              </button>
            </div>

            {/* Divider line */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-premium/50"></div>
              <span className="flex-shrink mx-4 text-[9px] font-bold text-premium-muted uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-premium/50"></div>
            </div>

            {/* Option 2: New User */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">
                First time joining WithUs?
              </label>
              <button 
                onClick={() => router.push(`/register?redirect=/invite/${token}`)}
                className="w-full premium-button-secondary py-2.5 text-xs border border-premium"
              >
                Create Account
              </button>
              <p className="text-[10px] text-premium-muted leading-relaxed font-semibold mt-1.5 text-center">
                Use your invited email <span className="text-premium-main font-bold font-mono">{inviteDetails.invitedEmail}</span> to register.
              </p>
            </div>
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
