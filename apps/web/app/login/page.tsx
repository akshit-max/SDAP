'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Clock,
  FileText,
  ShieldCheck,
  ArrowRight,
  MonitorSmartphone
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';
import { WithUsStar } from '../../components/common/WithUsLogo';

const GOOGLE_FALLBACK_ERROR = 'Google sign-in could not be completed. Please try again.';

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: 'Google sign-in was cancelled.',
  google_failed: GOOGLE_FALLBACK_ERROR,
  google_state_mismatch: 'Your sign-in session expired. Please try again.',
  google_email_unverified: 'Your Google account email is not verified.',
  google_not_configured: 'Google sign-in is not available right now.',
  account_disabled: 'This account has been deactivated. Contact your administrator.',
  invite_invalid: 'This invitation is invalid or has expired. Ask your admin to resend it.',
  invite_email_mismatch:
    'This invitation was sent to a different email. Sign in with the invited Google account.',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectParam = searchParams.get('redirect') || '';
  const isDisplaced = searchParams.get('reason') === 'displaced';

  // Google OAuth failures arrive as fixed codes; only mapped copy is ever shown.
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (!errorParam) return;
    toast('error', GOOGLE_ERROR_MESSAGES[errorParam] ?? GOOGLE_FALLBACK_ERROR);

    // Drop the code from the URL so a refresh doesn't re-show the toast.
    const params = new URLSearchParams(searchParams.toString());
    params.delete('error');
    const query = params.toString();
    router.replace(query ? `/login?${query}` : '/login');
  }, [searchParams, toast, router]);

  const handleGoogleLogin = () => {
    const target = redirectParam
      ? `/api/v1/auth/google?redirect=${encodeURIComponent(redirectParam)}`
      : '/api/v1/auth/google';
    window.location.href = target;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast('warning', 'Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      toast('warning', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data?.user) {
        AuthSession.setSession(
          {
            ...response.data.user,
            isSuperAdmin: response.data.user.isSuperAdmin ?? false,
          },
          response.data.organization
        );
        refreshContext();
        toast('success', `Welcome back, ${response.data.user?.fullName?.split(' ')[0] || 'there'}!`);
        if (response.data.user.isSuperAdmin) {
          router.push('/superadmin');
        } else {
          router.push(redirectParam || '/dashboard');
        }
      } else {
        toast('error', 'Invalid response from server. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full relative flex flex-col overflow-x-hidden text-white font-geist antialiased selection:bg-white selection:text-zinc-950">
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
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between relative z-20 shrink-0">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity group">
          <img
            src="/withus_white_full.png"
            alt="WithUs"
            className="h-8 sm:h-9 w-auto object-contain select-none group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Right Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/30 hover:border-white/70 hover:bg-white/10 text-white font-medium transition-all shadow-sm backdrop-blur-md"
          >
            <span>{redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Two-Sided Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-5 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Product Showcase */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-7 select-none max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
          {/* Badge: Thin line + uppercase tracking text */}
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="w-9 h-[1.5px] bg-white/60" />
            <span className="text-xs font-bold tracking-[0.22em] uppercase text-white/90">
              DELEGATED ACCESS PLATFORM
            </span>
          </div>

          {/* Main Headline with font-geist */}
          <h1 className="font-geist text-4xl sm:text-5xl lg:text-[56px] font-medium tracking-tight text-white leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            Give access<br />
            without giving<br />
            away <span className="text-sky-300 drop-shadow-[0_0_24px_rgba(125,211,252,0.45)]">control.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-[17px] text-white/90 leading-relaxed font-normal max-w-lg mx-auto lg:mx-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
            Manage delegated access to GitHub, Vercel, Stripe, and government portals with scoped sessions, automatic OTP extraction, and zero raw credential exposure.
          </p>

          {/* 4 Feature Items Stacked Vertically with Subtitles */}
          <div className="space-y-4 pt-1 max-w-md mx-auto lg:mx-0 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Passwordless access</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">No shared credentials</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Scoped permissions</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Least privilege access</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Auto expiry sessions</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Time-bound access</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Immutable audit trails</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Complete session logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Frosted Glass Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-[430px] rounded-[32px] p-6 sm:p-9 bg-white/[0.10] backdrop-blur-2xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] text-white">
            {/* Card Header with Logo */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <img
                  src="/withus_white_full.png"
                  alt="WithUs"
                  className="h-7 sm:h-8 w-auto object-contain select-none"
                />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-medium tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-normal">
                Sign in to your workspace
              </p>
            </div>

            {/* Invite Banner */}
            {redirectParam?.includes('/invite') && (
              <div className="mb-5 p-3.5 bg-white/15 border border-white/25 rounded-2xl text-center text-xs leading-relaxed">
                <p className="text-white font-medium mb-0.5">Invited to join a workspace?</p>
                <p className="text-white/80 text-[11px]">
                  Sign in with your invited email, or{' '}
                  <Link href={`/register?redirect=${encodeURIComponent(redirectParam)}`} className="text-white font-medium underline underline-offset-2">
                    create an account
                  </Link>.
                </p>
              </div>
            )}

            {/* Displaced Banner */}
            {isDisplaced && (
              <div className="mb-5 p-3.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-xs leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <MonitorSmartphone className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-200">Active on another device</p>
                    <p className="text-amber-200/80 text-[11px]">
                      Your account was opened elsewhere. Sign in again to resume.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    style={{ colorScheme: 'dark' }}
                    className="w-full h-11 pl-10 pr-4 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] [color-scheme:dark]"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    style={{ colorScheme: 'dark' }}
                    className="w-full h-11 pl-10 pr-10 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] [color-scheme:dark]"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep me signed in & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/10 border-white/30 text-zinc-950 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-white/90 font-medium">Keep me signed in</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-white/90 hover:text-white transition-colors font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-white hover:bg-white/95 active:scale-[0.99] text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Divider: OR CONTINUE WITH */}
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-white/20" />
                <span className="px-3 text-[10px] font-bold tracking-[0.15em] text-white/60 uppercase shrink-0 select-none">
                  OR CONTINUE WITH
                </span>
                <div className="flex-1 border-t border-white/20" />
              </div>

              {/* Single Google SSO Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.98] text-xs font-semibold text-white tracking-wide cursor-pointer"
                title="Continue with Google"
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span>Continue with Google</span>
              </button>
            </form>

            {/* Bottom Card Switcher */}
            <div className="text-center text-xs text-white/85 mt-6 pt-1 font-medium">
              Don't have an account?{' '}
              <Link
                href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
                className="text-white font-medium underline-offset-4 hover:underline transition-colors"
              >
                Create Workspace
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 relative z-20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/75 shrink-0">
        <div>&copy; {new Date().getFullYear()} WithUs Inc. All rights reserved.</div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
