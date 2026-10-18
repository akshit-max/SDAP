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
    <div className="min-h-screen w-full bg-[#fafafa] dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 font-sans flex flex-col justify-between selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <WithUsLogo height="h-8" />
        </Link>
        <Link
          href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
        >
          {redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}
        </Link>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* Card */}
          <div className="bg-white dark:bg-[#0f0f11] border border-black/10 dark:border-white/10 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Sign in to WithUs
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-normal">
                Access your secure vaults and delegated sessions
              </p>
            </div>

            {/* Invite Banner */}
            {redirectParam?.includes('/invite') && (
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-black/10 dark:border-white/10 rounded-2xl text-center text-xs leading-relaxed">
                <p className="text-zinc-900 dark:text-white font-semibold mb-1">Invited to join a workspace?</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  Sign in with your invited email, or{' '}
                  <Link href={`/register?redirect=${encodeURIComponent(redirectParam)}`} className="text-zinc-900 dark:text-white font-semibold underline">
                    create an account
                  </Link>.
                </p>
              </div>
            )}

            {/* Displaced Banner */}
            {isDisplaced && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center mt-0.5">
                    <MonitorSmartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-300 mb-0.5">Active on another device</p>
                    <p className="text-amber-700 dark:text-amber-400/90 text-[11px]">
                      Your account was opened elsewhere. Please sign in again to resume this session.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white/40 focus:bg-white dark:focus:bg-white/[0.07] transition-all"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full h-11 pl-3.5 pr-10 bg-zinc-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white/40 focus:bg-white dark:focus:bg-white/[0.07] transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm rounded-full shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </div>

          {/* Bottom Switcher */}
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
            Don't have an account?{' '}
            <Link
              href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
              className="text-zinc-900 dark:text-white font-semibold hover:underline"
            >
              {redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 sm:py-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
          <span>&copy; {new Date().getFullYear()} WithUs Inc.</span>
          <Link href="/privacy" className="hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors">Security</Link>
          <Link href="/cookie-policy" className="hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors">Cookies</Link>
          <Link href="/refund-policy" className="hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors">Refund Policy</Link>
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
