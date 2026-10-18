'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, Mail, Lock, Eye, EyeOff, MonitorSmartphone } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';
import { WithUsLogo } from '../../components/common/WithUsLogo';

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
        // Super Admin → redirect to platform admin console
        // Normal users → respect redirect param or go to dashboard
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
    <div className="h-[100dvh] overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Brand Side (Left) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#09090b] text-white p-12 xl:p-16 flex-col justify-between relative overflow-hidden border-r border-white/10 select-none h-full">
        {/* Subtle background ambient radial glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center relative z-10">
          <img src="/logo-dark.png" alt="WithUs" className="h-10 w-auto object-contain" />
        </div>

        {/* Hero Text & Value Props */}
        <div className="relative z-10 max-w-md my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-semibold text-zinc-300 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Enterprise Credential Gateway
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Give access without giving away control.
          </h2>

          <p className="text-zinc-400 text-xs xl:text-sm leading-relaxed font-normal">
            Manage scoped, temporary delegated access to platforms, cloud repositories, and enterprise portals with automatic OTP relay and zero credential leakage.
          </p>

          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white flex-shrink-0">
                <Lock className="w-4 h-4 text-zinc-200" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Zero Credential Exposure</p>
                <p className="text-[11px] text-zinc-400">Credentials inject directly into authenticated browser enclaves.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white flex-shrink-0">
                <Shield className="w-4 h-4 text-zinc-200" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Time-Scoped Sessions</p>
                <p className="text-[11px] text-zinc-400">Automatic access expiry with full audit trail and live revocation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 flex items-center justify-between text-zinc-500 text-xs pt-4 border-t border-white/10">
          <span className="font-medium">WithUs Platform &bull; Security First</span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 256-bit AES Vault
          </span>
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="lg:col-span-7 flex flex-col justify-between h-full p-4 sm:p-8 relative overflow-y-auto">
        <div className="h-4 hidden lg:block"></div>

        <div className="flex-1 flex items-center justify-center py-6 w-full">
          <div className="max-w-[420px] w-full bg-white dark:bg-[#121214] border border-black/10 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-5">
                <WithUsLogo height="h-10" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1.5">
                Welcome back
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                Sign in to manage your team's delegated vaults
              </p>
            </div>

            {redirectParam?.includes('/invite') && (
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-black/10 dark:border-white/10 rounded-2xl text-center text-xs font-medium leading-relaxed">
                <p className="text-zinc-900 dark:text-zinc-100 font-bold mb-1">First time joining WithUs?</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  If you don't have an account, click{' '}
                  <Link href={`/register?redirect=${encodeURIComponent(redirectParam)}`} className="text-zinc-900 dark:text-white font-bold underline hover:opacity-80 transition-opacity">
                    Create Account
                  </Link>{' '}
                  using your invited email.
                </p>
                <p className="text-zinc-400 dark:text-zinc-500 text-[11px] mt-0.5">
                  Already have an account? Simply sign in below.
                </p>
              </div>
            )}

            {/* ── Session Displaced Banner ─────────────────────────────────── */}
            {isDisplaced && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center mt-0.5">
                    <MonitorSmartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-800 dark:text-amber-300 mb-0.5">New login detected</p>
                    <p className="text-amber-700 dark:text-amber-400/90 text-[11px]">
                      Your WITHUS account is now active on another device. Please sign in again to continue here.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f4f4f5] dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 focus:border-zinc-900 dark:focus:border-white transition-all"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#f4f4f5] dark:bg-[#18181b] border border-black/10 dark:border-white/10 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/20 focus:border-zinc-900 dark:focus:border-white transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs rounded-full shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-5 border-t border-black/10 dark:border-white/10 mt-5">
                Don't have an account?{' '}
                <Link href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'} className="text-zinc-900 dark:text-white font-semibold hover:underline transition-colors">
                  {redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 font-medium max-w-md mx-auto w-full pt-4 pb-2">
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1.5">
            <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors hover:underline">Privacy Policy</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors hover:underline">Terms & Conditions</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/security" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors hover:underline">Security & Data Protection</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/cookie-policy" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors hover:underline">Cookie Policy</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/refund-policy" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors hover:underline">Refund & Cancellation Policy</Link>
          </div>
        </div>
      </div>
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
