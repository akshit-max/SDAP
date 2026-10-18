'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, Sparkles, Clock, Lock, ShieldCheck, MonitorSmartphone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';
import { WithUsStar } from '../../components/common/WithUsLogo';

function PlatformIconsBar() {
  return (
    <div className="flex flex-col items-center gap-3 select-none mb-6">
      {/* App Icons container with red badge pills */}
      <div className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-[#1b2232]/80 backdrop-blur-md border border-white/15 shadow-xl">
        {/* Gmail */}
        <div className="relative w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22 6.5l-10 7L2 6.5V19c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V6.5z" />
            <path fill="#EA4335" d="M22 5c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v1.5l10 7 10-7V5z" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#ea4335] text-white text-[10px] font-bold rounded-full border border-[#1b2232]">
            32
          </span>
        </div>

        {/* LinkedIn */}
        <div className="relative w-11 h-11 rounded-xl bg-[#0a66c2] flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.65 1.65 0 1 0 0 3.3 1.65 1.65 0 0 0 0-3.3Z" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#ea4335] text-white text-[10px] font-bold rounded-full border border-[#1b2232]">
            4
          </span>
        </div>

        {/* GoDaddy */}
        <div className="relative w-11 h-11 rounded-xl bg-[#00a699] flex items-center justify-center shadow-sm">
          <span className="text-white font-extrabold text-sm tracking-tighter">GD</span>
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#ea4335] text-white text-[10px] font-bold rounded-full border border-[#1b2232]">
            53
          </span>
        </div>

        {/* Vercel */}
        <div className="relative w-11 h-11 rounded-xl bg-black flex items-center justify-center shadow-sm border border-white/20">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2L2 19.7778H22L12 2Z" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#ea4335] text-white text-[10px] font-bold rounded-full border border-[#1b2232]">
            12
          </span>
        </div>

        {/* GitHub */}
        <div className="relative w-11 h-11 rounded-xl bg-[#24292f] flex items-center justify-center shadow-sm border border-white/10">
          <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
            <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-[#ea4335] text-white text-[10px] font-bold rounded-full border border-[#1b2232]">
            3
          </span>
        </div>
      </div>

      {/* Pill sub-bar: [* WITHUS] [🔒 Securing access...] */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b2232]/80 backdrop-blur-md border border-white/15 text-xs text-white/90 shadow-md">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-white">
          <WithUsStar className="w-3.5 h-3.5 text-white" />
          WITHUS
        </span>
        <span className="text-white/40">&bull;</span>
        <span className="flex items-center gap-1 text-[11px] text-white/80">
          <Lock className="w-3 h-3 text-white/70" />
          Securing access...
        </span>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectParam = searchParams.get('redirect') || '';
  const isDisplaced = searchParams.get('reason') === 'displaced';

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
    <div
      className="min-h-screen w-full text-white font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-white selection:text-zinc-950"
      style={{
        background: `
          radial-gradient(circle at 10% 90%, rgba(230, 140, 105, 0.45) 0%, transparent 45%),
          radial-gradient(circle at 90% 90%, rgba(220, 130, 95, 0.4) 0%, transparent 45%),
          radial-gradient(circle at 50% 10%, rgba(100, 140, 220, 0.35) 0%, transparent 55%),
          linear-gradient(180deg, #2e4a80 0%, #3e5e9e 35%, #5673ab 68%, #788ba5 100%)
        `,
      }}
    >
      {/* Top Floating Announcement Pill */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-6 sm:pt-8 flex items-center justify-between relative z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/15 text-xs text-white/90 hover:bg-black/45 transition-colors"
        >
          <span className="font-semibold text-white">Product of makewithus®</span>
          <span className="text-white/40">&mdash;</span>
          <span className="hidden sm:inline text-white/80">Give access without giving away control.</span>
          <ArrowRight className="w-3.5 h-3.5 text-white/70" />
        </Link>

        <Link
          href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
          className="text-xs font-semibold text-white hover:text-white/90 transition-all px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20"
        >
          {redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}
        </Link>
      </header>

      {/* Main Two-Sided Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: Exact Marketing Page Layout */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between space-y-8 select-none">
          {/* Logo & Product of makewithus */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-wider text-white">WITH US</span>
              <WithUsStar className="w-5 h-5 text-white" />
            </div>
            <p className="text-[12px] text-white/75 font-medium tracking-wide mt-1">
              Product of makewithus®
            </p>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12]">
              Give access <br />
              without giving <br />
              away control.
            </h1>

            {/* Feature Bullets matching marketing page */}
            <div className="space-y-2.5 pt-2 text-xs sm:text-[13px] text-white/90 font-normal">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span>Eliminate password & OTP sharing for external collaborators</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span>12 live business platforms supported &mdash; GitHub to GST Portal</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span>Scoped parameters, bounded time limits, and automatic expiry</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-white/80 flex-shrink-0" />
                <span>Session-level immutable audit trail across every portal</span>
              </div>
            </div>

            {/* Action pill */}
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 font-semibold px-5 py-2.5 text-xs shadow-md hover:bg-white/90 transition-all"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* The Delegated Access Lifecycle List (from Screenshot 1) */}
          <div className="pt-4 border-t border-white/15 max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mb-2">
              The Delegated Access Lifecycle
            </p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/15 text-white font-semibold backdrop-blur-sm">
                <span>Password Sharing</span>
                <span className="text-white/80 text-[11px]">01</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1 text-white/60 hover:text-white transition-colors">
                <span>Cost of Sharing</span>
                <span className="text-white/40 text-[11px]">02</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1 text-white/60 hover:text-white transition-colors">
                <span>01 Request</span>
                <span className="text-white/40 text-[11px]">03</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1 text-white/60 hover:text-white transition-colors">
                <span>02 Approve</span>
                <span className="text-white/40 text-[11px]">04</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1 text-white/60 hover:text-white transition-colors">
                <span>03 Work</span>
                <span className="text-white/40 text-[11px]">05</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1 text-white/60 hover:text-white transition-colors">
                <span>04 Audit</span>
                <span className="text-white/40 text-[11px]">06</span>
              </div>
              <div className="flex items-center justify-between px-3 py-1 text-white/60 hover:text-white transition-colors">
                <span>05 Expire & Revoke</span>
                <span className="text-white/40 text-[11px]">07</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Card with Platform Bar */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center justify-center">
          {/* App Icons Container from Marketing Hero */}
          <PlatformIconsBar />

          {/* Form Card */}
          <div className="w-full max-w-[420px] bg-black/40 backdrop-blur-2xl border border-white/20 rounded-[28px] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Sign in to WithUs
              </h2>
              <p className="text-xs text-white/70 mt-1.5 font-normal">
                Access your secure vaults and delegated sessions
              </p>
            </div>

            {/* Invite Banner */}
            {redirectParam?.includes('/invite') && (
              <div className="mb-6 p-4 bg-white/10 border border-white/20 rounded-2xl text-center text-xs leading-relaxed">
                <p className="text-white font-semibold mb-1">Invited to join a workspace?</p>
                <p className="text-white/80 text-[11px]">
                  Sign in with your invited email, or{' '}
                  <Link href={`/register?redirect=${encodeURIComponent(redirectParam)}`} className="text-white font-semibold underline underline-offset-2">
                    create an account
                  </Link>.
                </p>
              </div>
            )}

            {/* Displaced Banner */}
            {isDisplaced && (
              <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-xs leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500/30 rounded-xl flex items-center justify-center mt-0.5">
                    <MonitorSmartphone className="w-4 h-4 text-amber-200" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-100 mb-0.5">Active on another device</p>
                    <p className="text-amber-200/90 text-[11px]">
                      Your account was opened elsewhere. Please sign in again to resume this session.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/90">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full h-11 px-3.5 bg-white/[0.08] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.14] transition-all"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white/90">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full h-11 pl-3.5 pr-10 bg-white/[0.08] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.14] transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-3 bg-white hover:bg-white/95 text-zinc-950 font-semibold text-sm rounded-full shadow-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Signing in...</>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </div>

          {/* Bottom Switcher */}
          <div className="text-center text-xs text-white/80 mt-6">
            Don't have an account?{' '}
            <Link
              href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
              className="text-white font-bold underline underline-offset-4 hover:opacity-85 transition-opacity"
            >
              {redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}
            </Link>
          </div>
        </div>
      </main>

      {/* Floating Bottom Nav matching Marketing Site */}
      <footer className="w-full max-w-7xl mx-auto px-6 pb-6 pt-4 relative z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Floating Navbar Pill */}
        <div className="mx-auto sm:mx-0 flex items-center gap-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs text-white/90">
          <span className="flex items-center gap-1.5 font-bold tracking-wider text-[11px] text-white">
            <WithUsStar className="w-3.5 h-3.5 text-white" />
            WithUs
          </span>
          <span className="text-white/30 hidden sm:inline">&bull;</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/cookie-policy" className="hover:text-white transition-colors hidden sm:inline">Cookies</Link>
        </div>

        <div className="text-[11px] text-white/60">
          &copy; {new Date().getFullYear()} makewithus&reg;. All rights reserved.
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
