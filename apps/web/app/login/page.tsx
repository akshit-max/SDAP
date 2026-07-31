'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
        router.push('/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-10 pb-8 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto w-12 h-12 bg-slate-900 dark:bg-slate-100 rounded-xl flex items-center justify-center mb-5 shadow-md">
            <Shield className="w-6 h-6 text-white dark:text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">WITHUS Vault</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Sign in to your enterprise account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-slate-400 dark:focus:ring-slate-400/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 dark:focus:border-slate-400 dark:focus:ring-slate-400/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center text-sm text-slate-500 pt-1">
            Don't have an account?{' '}
            <Link href="/register" className="text-slate-900 dark:text-slate-100 font-semibold hover:underline">
              Create Workspace
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
