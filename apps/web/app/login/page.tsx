'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectParam = searchParams.get('redirect') || '';

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
          response.data.user,
          response.data.organization
        );
        refreshContext();
        toast('success', `Welcome back, ${response.data.user?.fullName?.split(' ')[0] || 'there'}!`);
        // Honour the redirect param (e.g. /invite/abc123) or fall back to dashboard
        router.push(redirectParam || '/dashboard');
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
    <div className="theme-light min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-premium-bg">
      {/* Brand Side (Left) */}
      <div className="hidden lg:flex lg:col-span-5 bg-zinc-950 text-white p-16 flex-col justify-between relative overflow-hidden border-r border-zinc-900 select-none">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 p-1.5">
            <img src="/logo.png" alt="WithUs" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm text-zinc-200">WithUs</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-sm my-auto space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Security first.<br />
            Credentials simplified.
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed font-medium">
            Manage delegated access to GitHub, Vercel, Stripe, and government portals with scoped sessions, automatic OTP extraction, and zero raw credential exposure.
          </p>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 flex items-center gap-2 text-zinc-500 text-[10px] font-bold tracking-wider uppercase">
          <svg className="w-4 h-4 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Enterprise Grade Protection
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="lg:col-span-7 flex items-center justify-center p-8 relative">
        <div className="max-w-md w-full premium-card p-10 bg-premium-surface">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 mb-4">
            <img src="/logo.png" alt="WithUs Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-premium-main">WithUs</h1>
          <p className="text-[10px] text-premium-muted font-bold tracking-wider uppercase mt-1.5">Delegated Credential Access</p>
        </div>

        {redirectParam?.includes('/invite') && (
          <div className="mb-6 p-4 bg-zinc-100/50 dark:bg-zinc-900/40 border border-premium rounded-xl text-center text-xs font-semibold leading-relaxed">
            <p className="text-premium-main font-bold mb-1">First time joining WithUs?</p>
            <p className="text-premium-muted text-[11px]">
              If you don't have an account, click{' '}
              <Link href={`/register?redirect=${encodeURIComponent(redirectParam)}`} className="text-premium-main font-bold underline hover:text-lime-500 transition-colors">
                Create Account
              </Link>{' '}
              using your invited email.
            </p>
            <p className="text-premium-muted text-[11px] mt-0.5">
              Already have an account? Simply sign in below.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted transition-colors" />
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 premium-input text-xs font-medium focus:ring-1 focus:ring-lime-400"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-premium-muted hover:text-premium-main transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted transition-colors" />
              <input
                type="password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 premium-input text-xs font-medium focus:ring-1 focus:ring-lime-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full premium-button-primary py-2.5 text-xs shadow-md font-bold mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Authenticating...</>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center text-xs text-premium-muted pt-4 border-t border-premium mt-4">
            Don't have an account?{' '}
            <Link href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'} className="text-premium-main font-bold hover:underline hover:text-lime-500 transition-colors">
              {redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}
            </Link>
          </div>
        </form>
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
