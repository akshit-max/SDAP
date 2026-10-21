'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api/client';
import { ResetPasswordSchema } from '@repo/types';
import Link from 'next/link';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

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
      <div className="text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
          <AlertCircle className="w-7 h-7 text-rose-300" />
        </div>
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            Invalid reset link
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
            This password reset link is missing a verification token or has already been used.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
        >
          <span>Request new reset link</span>
          <ArrowRight className="w-4 h-4" />
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
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'This reset link is invalid or has expired.';
      setError(msg);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
          <CheckCircle2 className="w-7 h-7 text-emerald-300" />
        </div>
        <div>
          <h2 className="text-2xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            Password updated!
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
            Your password has been changed successfully. Redirecting you to sign in…
          </p>
        </div>
        <Link
          href="/login"
          className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
        >
          <span>Sign In Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Card Header with Logo */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <img
            src="/withus_white_full.png"
            alt="WithUs"
            className="h-7 sm:h-8 w-auto object-contain select-none"
          />
        </div>
        <h1 className="text-2xl sm:text-[26px] font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          Set new password
        </h1>
        <p className="text-xs sm:text-sm text-white/80 mt-1 font-normal">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="block text-[11px] font-bold uppercase tracking-wider text-white/90 mb-1.5">
            New password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              style={{ colorScheme: 'dark' }}
              className="w-full h-11 pl-10 pr-10 text-sm bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-white placeholder-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] [color-scheme:dark]"
              placeholder="Minimum 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="reset-confirm" className="block text-[11px] font-bold uppercase tracking-wider text-white/90 mb-1.5">
            Confirm new password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reset-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              style={{ colorScheme: 'dark' }}
              className="w-full h-11 pl-10 pr-10 text-sm bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-white placeholder-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] [color-scheme:dark]"
              placeholder="Repeat your password"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-500/15 border border-rose-400/30 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-200">{error}</p>
          </div>
        )}

        <button
          id="reset-submit"
          type="submit"
          disabled={status === 'loading'}
          className="w-full h-12 flex items-center justify-center gap-2 px-4 bg-white hover:bg-white/95 text-zinc-950 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.35)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Updating password…</span>
            </>
          ) : (
            <>
              <span>Set new password</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
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
        <div className="w-full max-w-[440px] rounded-[32px] p-8 sm:p-9 bg-white/[0.10] backdrop-blur-2xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] text-white">
          <Suspense fallback={<div className="text-white/70 text-sm text-center py-6">Loading verification…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
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
}
