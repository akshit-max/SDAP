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
    <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg p-6">
      <div className="max-w-md w-full premium-card p-8 shadow-sm bg-premium-surface">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 mb-3 flex items-center justify-center rounded-xl bg-zinc-950 dark:bg-zinc-900 border border-premium shadow-md">
            <svg className="w-6 h-6 text-lime-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.3 4.8 5.1-1.6-1.6 5.1 4.8 2.3-4.8 2.3 1.6 5.1-5.1-1.6-2.3 4.8-2.3-4.8-5.1 1.6 1.6-5.1-4.8-2.3 4.8-2.3-1.6-5.1 5.1 1.6L12 2z"/>
            </svg>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-premium-main">WithUs</h1>
          <p className="text-[11px] text-premium-muted font-medium mt-1">Delegated Credential Access</p>
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
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
