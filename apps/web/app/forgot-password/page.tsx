'use client';

import React, { useState } from 'react';
import { apiClient } from '../../lib/api/client';
import { ForgotPasswordSchema } from '@repo/types';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * Forgot Password Page
 *
 * Atmospheric Apple Frosted Glass design language with
 * high-contrast typography, zero-clipping scroll model,
 * and authentic WithUs stacked brand mark.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parse = ForgotPasswordSchema.safeParse({ email });
    if (!parse.success) {
      setError('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStatus('success');
    } catch {
      // Always show success — consistent with backend enumeration protection
      setStatus('success');
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden overflow-y-auto text-white font-geist antialiased selection:bg-white selection:text-zinc-950">
      {/* High-Resolution Clean Twilight Horizon Wallpaper */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-10"
        style={{ backgroundImage: "url('/bg-dunes.jpg')" }}
      />

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
          {status === 'success' ? (
            <div className="text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-2xl font-medium tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                  Check your email
                </h1>
                <p className="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
                  If <span className="text-white font-medium">{email}</span> is registered with us, you'll receive a password reset link shortly. It expires in 15 minutes.
                </p>
                <p className="text-[11px] text-white/60 mt-2">
                  Don't see it? Check your spam folder or try again.
                </p>
              </div>

              <Link
                href="/login"
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 rounded-2xl text-xs sm:text-sm font-medium shadow-[0_12px_28px_-6px_rgba(0,0,0,0.35)] transition-all active:scale-[0.99]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
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
                  Forgot password?
                </h1>
                <p className="text-xs sm:text-sm text-white/80 mt-1 font-normal">
                  Enter your email and we'll send a recovery link.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-[11px] font-bold uppercase tracking-wider text-white/90 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/60">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className="w-full h-11 pl-10 pr-4 text-sm bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-white placeholder-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                      placeholder="you@company.com"
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </p>
                  )}
                </div>

                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full h-12 flex items-center justify-center gap-2 px-4 bg-white hover:bg-white/95 text-zinc-950 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.35)] transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] mt-2"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Sending link…</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
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
          )}
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
