'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthSession } from '../../../../lib/auth/session';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { useToast } from '../../../../components/common/Toast';
import { Loader2 } from 'lucide-react';
import { apiClient } from '../../../../lib/api/client';

/** Same-origin relative paths only; mirrors AuthService.sanitizeRedirect on the API. */
function safeRedirect(redirect: string | null): string {
  if (
    !redirect ||
    !redirect.startsWith('/') ||
    redirect.startsWith('//') ||
    /[\\\s]/.test(redirect)
  ) {
    return '/dashboard';
  }
  return redirect;
}

/**
 * Landing page after the API's Google callback. The API has already set the
 * httpOnly session cookies; this page loads { user, organization } from
 * /auth/session (same shape as /auth/login) and hydrates the client session.
 */
function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshContext } = useAuth();
  const { toast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const redirect = safeRedirect(searchParams.get('redirect'));
    const isNewUser = searchParams.get('new') === '1';

    apiClient
      .get('/auth/session')
      .then(({ data }) => {
        if (!data?.user) throw new Error('Missing session');
        AuthSession.setSession(
          { ...data.user, isSuperAdmin: data.user.isSuperAdmin ?? false },
          data.organization || null
        );
        refreshContext();
        const firstName = data.user.fullName?.split(' ')[0] || 'there';
        toast('success', isNewUser ? `Welcome to WithUs, ${firstName}!` : `Welcome back, ${firstName}!`);
        router.replace(redirect);
      })
      .catch(() => {
        toast('error', 'Google sign-in could not be completed. Please try again.');
        router.replace('/login');
      });
  }, [searchParams, router, refreshContext, toast]);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full relative flex flex-col items-center justify-center overflow-hidden text-white font-geist antialiased bg-gradient-to-b from-[#2b416c] to-[#5879b0]">
      {/* WithUs Hero Rainbow Blue Atmosphere */}
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

      <div className="relative z-10 p-8 sm:p-10 rounded-[28px] bg-white/[0.12] backdrop-blur-2xl border border-white/25 shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.15] border border-white/20 flex items-center justify-center shadow-inner">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Authenticating with Google</h3>
          <p className="text-xs text-white/80 mt-1">Securing your session and redirecting...</p>
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
