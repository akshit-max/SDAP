'use client';

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAcceptInvite, useInvitationDetails } from '../../../hooks/useOrganization';
import { useToast } from '../../../components/common/Toast';
import {
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarX,
  ArrowRight,
  Building2,
  Mail,
  UserCheck
} from 'lucide-react';
import { AuthSession } from '../../../lib/auth/session';
import { apiClient } from '../../../lib/api/client';
import Link from 'next/link';

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

  // Unified Apple Frosted Glass Wrapper
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden overflow-y-auto text-white font-geist antialiased selection:bg-white selection:text-zinc-950">
      {/* WithUs Hero Rainbow Blue Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#2b416c] to-[#5879b0]">
        <img
          src="/shadow-bg.png"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover mix-blend-color-burn opacity-70"
        />
        <img
          src="/sun-halo.png"
          alt=""
          className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover object-center opacity-90 mix-blend-screen"
        />
        <div
          className="pointer-events-none absolute h-screen w-[16rem] rounded-full right-[24rem] top-0 rotate-45 opacity-40"
          style={{
            background: '#ffffff',
            boxShadow: '0 6.719px 50.393px 0 #ffffff inset',
            filter: 'blur(200px)',
          }}
        />
      </div>

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex items-center justify-between relative z-20">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity group">
          <img
            src="/withus_white_full.png"
            alt="WithUs"
            className="h-8 sm:h-9 w-auto object-contain select-none group-hover:scale-105 transition-transform"
          />
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/30 hover:border-white/70 hover:bg-white/10 text-white font-medium transition-all shadow-sm backdrop-blur-md"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-white/70 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20">
        <p className="select-none font-medium text-[11px] sm:text-xs">
          &copy; {new Date().getFullYear()} WithUs Inc. All rights reserved.
        </p>
        <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs font-medium">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
        </div>
      </footer>
    </div>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full max-w-[450px] rounded-[32px] p-8 sm:p-9 bg-white/[0.10] backdrop-blur-2xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] text-white text-center">
      {children}
    </div>
  );

  // Loading state
  if (isDetailsLoading) {
    return (
      <Wrapper>
        <Card>
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-white mx-auto animate-spin" />
            <p className="text-base font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              Loading invitation details…
            </p>
            <p className="text-xs text-white/70">
              Verifying your security credentials
            </p>
          </div>
        </Card>
      </Wrapper>
    );
  }

  // Graceful Error Screens based on invite status
  if (!inviteDetails || inviteDetails.status === 'INVALID') {
    return (
      <Wrapper>
        <Card>
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <AlertCircle className="w-7 h-7 text-rose-300" />
            </div>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Invalid Invitation
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
                This invitation link does not exist, has expired, or is malformed.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
            >
              <span>Return to Homepage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </Wrapper>
    );
  }

  if (inviteDetails.status === 'EXPIRED') {
    return (
      <Wrapper>
        <Card>
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <CalendarX className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Invitation Expired
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
                This invitation has expired for security reasons. Please ask your workspace administrator to issue a fresh invite.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
            >
              <span>Return to Homepage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </Wrapper>
    );
  }

  if (inviteDetails.status === 'ACCEPTED') {
    return (
      <Wrapper>
        <Card>
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <CheckCircle2 className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Already Accepted
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
                This invitation has already been accepted. You can sign in directly to access your workspace.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
            >
              <span>Sign In to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </Wrapper>
    );
  }

  if (inviteDetails.status === 'REVOKED') {
    return (
      <Wrapper>
        <Card>
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <XCircle className="w-7 h-7 text-rose-300" />
            </div>
            <div>
              <h2 className="text-2xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Invitation Revoked
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
                This invitation was revoked by your organization administrator.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
            >
              <span>Return to Homepage</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      </Wrapper>
    );
  }

  // Not logged in -> Show rich invite UI
  if (!isLoggedIn) {
    return (
      <Wrapper>
        <Card>
          {/* Card Header with Logo */}
          <div className="flex justify-center mb-3">
            <img
              src="/withus_white_full.png"
              alt="WithUs"
              className="h-7 sm:h-8 w-auto object-contain select-none"
            />
          </div>

          <div className="my-4 p-4 rounded-2xl bg-white/[0.08] border border-white/20 text-left space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-sky-300 font-semibold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>Workspace Invitation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
              Join {inviteDetails.organizationName}
            </h2>
            <p className="text-xs text-white/80">
              Invited by <span className="text-white font-medium">{inviteDetails.inviterName}</span>
            </p>
          </div>

          <div className="space-y-4 text-left mt-5">
            {/* Option 1: Existing User */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-white/90 uppercase tracking-wider">
                Already have an account?
              </label>
              <button 
                onClick={() => router.push(`/login?redirect=/invite/${token}`)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
              >
                <span>Sign In to Accept</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Divider line */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-white/60 uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            {/* Option 2: New User */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-white/90 uppercase tracking-wider">
                First time joining WithUs?
              </label>
              <button 
                onClick={() => router.push(`/register?redirect=/invite/${token}`)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/[0.12] hover:bg-white/[0.20] border border-white/30 text-white rounded-2xl text-xs sm:text-sm font-medium transition-all backdrop-blur-md active:scale-[0.99]"
              >
                <span>Create Workspace Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-white/70 leading-relaxed font-normal mt-1.5 text-center">
                Use your invited address <span className="text-white font-medium underline underline-offset-2">{inviteDetails.invitedEmail}</span> to claim your access.
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
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-white mx-auto animate-spin" />
            <h2 className="text-xl font-medium text-white">
              Joining {inviteDetails.organizationName}…
            </h2>
            <p className="text-xs text-white/70">
              Provisioning your delegated access permissions
            </p>
          </div>
        )}

        {isSuccess && (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <CheckCircle2 className="w-7 h-7 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-medium text-white">Welcome to the team!</h2>
            <p className="text-xs sm:text-sm text-white/80">
              Redirecting you to the dashboard…
            </p>
          </div>
        )}

        {isError && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
              <XCircle className="w-7 h-7 text-rose-300" />
            </div>
            <h2 className="text-2xl font-medium text-white">Invitation Failed</h2>
            <p className="text-xs sm:text-sm text-rose-200">
              {(error as Error)?.message || 'There was a problem joining the organization.'}
            </p>
            <button 
              onClick={async () => {
                try {
                  await apiClient.post('/auth/logout', {});
                } catch (e) {
                  // ignore
                }
                AuthSession.clear();
                router.push('/login');
              }} 
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
            >
              <span>Sign Out & Try Again</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Card>
    </Wrapper>
  );
}
