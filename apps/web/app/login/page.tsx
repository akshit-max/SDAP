'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Clock,
  FileText,
  ShieldCheck,
  ArrowRight,
  MonitorSmartphone
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';
import { WithUsStar } from '../../components/common/WithUsLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshContext } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
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
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden overflow-y-auto text-white font-sans antialiased selection:bg-white selection:text-zinc-950">
      {/* High-Resolution Clean Twilight Horizon Wallpaper */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-10"
        style={{ backgroundImage: "url('/bg-dunes.jpg')" }}
      />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex items-center justify-between relative z-20">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity group">
          <img
            src="/withus_white_full.png"
            alt="WithUs"
            className="h-8 sm:h-9 w-auto object-contain select-none group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Right Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/30 hover:border-white/70 hover:bg-white/10 text-white font-medium transition-all shadow-sm backdrop-blur-md"
          >
            <span>{redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Two-Sided Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Product Showcase */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-7 select-none max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
          {/* Badge: Thin line + uppercase tracking text */}
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="w-9 h-[1.5px] bg-white/60" />
            <span className="text-xs font-bold tracking-[0.22em] uppercase text-white/90">
              DELEGATED ACCESS PLATFORM
            </span>
          </div>

          {/* Main Headline with sky-300 highlight */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-white leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            Give access<br />
            without giving<br />
            away <span className="text-sky-300 drop-shadow-[0_0_24px_rgba(125,211,252,0.45)]">control.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-[17px] text-white/90 leading-relaxed font-normal max-w-lg mx-auto lg:mx-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
            Manage delegated access to GitHub, Vercel, Stripe, and government portals with scoped sessions, automatic OTP extraction, and zero raw credential exposure.
          </p>

          {/* 4 Feature Items Stacked Vertically with Subtitles */}
          <div className="space-y-4 pt-1 max-w-md mx-auto lg:mx-0 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-bold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Passwordless access</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">No shared credentials</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-bold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Scoped permissions</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Least privilege access</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-bold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Auto expiry sessions</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Time-bound access</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-bold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Immutable audit trails</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Complete session logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Frosted Glass Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-[430px] rounded-[32px] p-8 sm:p-9 bg-white/[0.10] backdrop-blur-2xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] text-white">
            {/* Card Header with Logo */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <img
                  src="/withus_white_full.png"
                  alt="WithUs"
                  className="h-7 sm:h-8 w-auto object-contain select-none"
                />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-normal">
                Sign in to your workspace
              </p>
            </div>

            {/* Invite Banner */}
            {redirectParam?.includes('/invite') && (
              <div className="mb-5 p-3.5 bg-white/15 border border-white/25 rounded-2xl text-center text-xs leading-relaxed">
                <p className="text-white font-semibold mb-0.5">Invited to join a workspace?</p>
                <p className="text-white/80 text-[11px]">
                  Sign in with your invited email, or{' '}
                  <Link href={`/register?redirect=${encodeURIComponent(redirectParam)}`} className="text-white font-bold underline underline-offset-2">
                    create an account
                  </Link>.
                </p>
              </div>
            )}

            {/* Displaced Banner */}
            {isDisplaced && (
              <div className="mb-5 p-3.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-xs leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <MonitorSmartphone className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-200">Active on another device</p>
                    <p className="text-amber-200/80 text-[11px]">
                      Your account was opened elsewhere. Sign in again to resume.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-4 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-xl text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full h-11 pl-10 pr-10 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-xl text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Keep me signed in & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/10 border-white/30 text-zinc-950 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-white/90 font-medium">Keep me signed in</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-white/90 hover:text-white transition-colors font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-white hover:bg-white/95 active:scale-[0.99] text-zinc-950 font-bold text-sm tracking-tight rounded-xl shadow-[0_4px_16px_rgba(255,255,255,0.15)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.25)] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              {/* Divider: OR CONTINUE WITH */}
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <span className="relative px-3 bg-transparent text-[10px] font-bold tracking-[0.15em] text-white/60 uppercase">
                  OR CONTINUE WITH
                </span>
              </div>

              {/* Social / SSO Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* Google */}
                <button
                  type="button"
                  className="h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 flex items-center justify-center transition-all shadow-sm"
                  title="Sign in with Google"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z" />
                  </svg>
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  className="h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 flex items-center justify-center transition-all shadow-sm"
                  title="Sign in with GitHub"
                >
                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </button>

                {/* Microsoft */}
                <button
                  type="button"
                  className="h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 flex items-center justify-center transition-all shadow-sm"
                  title="Sign in with Microsoft"
                >
                  <svg className="w-4 h-4" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Bottom Card Switcher */}
            <div className="text-center text-xs text-white/85 mt-6 pt-1 font-medium">
              Don't have an account?{' '}
              <Link
                href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
                className="text-white font-bold underline-offset-4 hover:underline transition-colors"
              >
                Create Workspace
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/75">
        <div>&copy; {new Date().getFullYear()} WithUs Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
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
