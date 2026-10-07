'use client';

import React, { useState } from 'react';
import { apiClient } from '../../lib/api/client';
import { ForgotPasswordSchema } from '@repo/types';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

/**
 * Forgot Password Page
 *
 * Sends a password reset email. Always shows success to prevent
 * email enumeration — consistent with backend behavior.
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
    <div className="h-screen overflow-y-auto flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-dark.png" alt="WithUs Logo" className="h-20 w-auto object-contain" />
        </div>

        <div className="bg-slate-900/90 backdrop-blur border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h1 className="text-lg font-bold text-white">Check your email</h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                If <span className="text-slate-200 font-medium">{email}</span> is registered,
                you'll receive a reset link shortly. It expires in 15 minutes.
              </p>
              <p className="text-xs text-slate-500">
                Don't see it? Check your spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 mb-4 mx-auto">
                  <Mail className="w-5 h-5 text-slate-300" />
                </div>
                <h1 className="text-lg font-bold text-white text-center">Forgot password?</h1>
                <p className="text-sm text-slate-400 text-center mt-1">
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className="w-full px-3 py-2.5 text-sm bg-slate-800/60 border border-slate-700/60 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                    placeholder="you@company.com"
                  />
                  {error && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </p>
                  )}
                </div>

                <button
                  id="forgot-submit"
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === 'loading' ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
