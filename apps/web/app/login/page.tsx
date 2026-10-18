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
  MonitorSmartphone,
  Check
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
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden text-white font-sans selection:bg-white selection:text-zinc-950">
      {/* Background Wallpaper matching user reference image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-10"
        style={{ backgroundImage: "url('/bg-dunes.jpg')" }}
      >
        {/* Soft atmospheric gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b162c]/65 via-[#132442]/35 to-[#161d2e]/70 backdrop-blur-[2px]" />
      </div>

      {/* Top Navbar matching Image 1 & 2 */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between relative z-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <span className="text-2xl font-black tracking-wider text-white">WITH US</span>
          <WithUsStar className="w-5 h-5 text-white" />
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80">
          <Link href="/product" className="hover:text-white transition-colors">Product</Link>
          <Link href="/use-cases" className="hover:text-white transition-colors">Use Cases</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
        </nav>

        {/* Right Switcher / CTA Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="hidden sm:inline text-white/70">New here?</span>
          <Link
            href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold transition-all shadow-sm"
          >
            <span>{redirectParam?.includes('/invite') ? 'Create Account' : 'Create Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Grid: Left Value Narrative + Right Frosted Glass Card */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Brand & Product Showcase (Exact match to reference image) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between space-y-7 select-none">
          {/* Badge Pill */}
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-[11px] font-semibold text-white/90 tracking-widest uppercase shadow-sm">
              DELEGATED ACCESS PLATFORM
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
            Give access <br />
            without giving <br />
            away control.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-md">
            Manage delegated access to GitHub, Vercel, Stripe, and government portals with scoped sessions, automatic OTP extraction, and zero raw credential exposure.
          </p>

          {/* 4 Feature Items with Outline Icons */}
          <div className="space-y-3.5 pt-1 text-sm font-medium text-white/90">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <span>Passwordless access</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>Scoped permissions</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span>Auto expiry sessions</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span>Immutable audit trails</span>
            </div>
          </div>

          {/* Enterprise Protection Bottom Badge */}
          <div className="pt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ENTERPRISE GRADE PROTECTION</span>
          </div>
        </div>

        {/* Right Column: Floating Frosted Glass Card (Exact match to reference image) */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
          <div className="w-full max-w-[440px] rounded-[32px] p-8 sm:p-10 bg-white/[0.12] backdrop-blur-2xl border border-white/25 shadow-[0_30px_70px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.25)] text-white">
            {/* Card Header with Logo */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-xl font-black tracking-wider text-white">WITH US</span>
                <WithUsStar className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-xs text-white/75 mt-1 font-normal">
                Sign in to your workspace
              </p>
            </div>

            {/* Invite Banner */}
            {redirectParam?.includes('/invite') && (
              <div className="mb-5 p-3.5 bg-white/15 border border-white/20 rounded-2xl text-center text-xs leading-relaxed">
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-4 bg-white/[0.10] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.16] transition-all"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className="w-full h-11 pl-10 pr-10 bg-white/[0.10] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.16] transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
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
                    className="w-4 h-4 rounded bg-white/10 border-white/30 text-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-white/80">Keep me signed in</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-white hover:bg-white/95 text-zinc-950 font-bold text-sm rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="w-full border-t border-white/15" />
                </div>
                <span className="relative px-3 bg-transparent text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  OR CONTINUE WITH
                </span>
              </div>

              {/* Social / SSO Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {/* Google */}
                <button
                  type="button"
                  className="h-11 rounded-2xl bg-white/[0.10] hover:bg-white/[0.18] border border-white/20 flex items-center justify-center transition-all shadow-sm"
                  title="Sign in with Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z" />
                  </svg>
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  className="h-11 rounded-2xl bg-white/[0.10] hover:bg-white/[0.18] border border-white/20 flex items-center justify-center transition-all shadow-sm"
                  title="Sign in with GitHub"
                >
                  <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </button>

                {/* Microsoft */}
                <button
                  type="button"
                  className="h-11 rounded-2xl bg-white/[0.10] hover:bg-white/[0.18] border border-white/20 flex items-center justify-center transition-all shadow-sm"
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
            <div className="text-center text-xs text-white/80 mt-6 pt-2">
              Don't have an account?{' '}
              <Link
                href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
                className="text-white font-bold hover:underline transition-colors"
              >
                Create Workspace
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
        <div>&copy; {new Date().getFullYear()} WithUs Inc. All rights reserved.</div>
        <div className="flex items-center gap-4">
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
