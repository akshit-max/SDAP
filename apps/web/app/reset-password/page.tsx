'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api/client';
import { ResetPasswordSchema } from '@repo/types';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h1 className="text-lg font-bold text-white">Invalid reset link</h1>
        <p className="text-sm text-slate-400">This link is missing a token. Please request a new one.</p>
        <Link href="/forgot-password" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors underline">
          Request new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    const parse = ResetPasswordSchema.safeParse({ token, password });
    if (!parse.success) {
      setError(parse.error.errors[0]?.message ?? 'Invalid input.');
      return;
    }

    setStatus('loading');

    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'This reset link is invalid or has expired.';
      setError(msg);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
        <h1 className="text-lg font-bold text-white">Password updated!</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Your password has been changed. Redirecting you to sign in…
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors underline"
        >
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 mb-4 mx-auto">
          <Lock className="w-5 h-5 text-slate-300" />
        </div>
        <h1 className="text-lg font-bold text-white text-center">Set new password</h1>
        <p className="text-sm text-slate-400 text-center mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-3 py-2.5 pr-10 text-sm bg-slate-800/60 border border-slate-700/60 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(''); }}
            className="w-full px-3 py-2.5 text-sm bg-slate-800/60 border border-slate-700/60 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
            placeholder="Repeat your password"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-900/40 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button
          id="reset-submit"
          type="submit"
          disabled={status === 'loading'}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'loading' ? 'Updating…' : 'Set new password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="h-screen overflow-y-auto flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-dark.png" alt="WithUs Logo" className="h-20 w-auto object-contain" />
        </div>
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          <Suspense fallback={<div className="text-slate-400 text-sm text-center">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
