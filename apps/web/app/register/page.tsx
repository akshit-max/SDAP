'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';
import { useInvitationDetails } from '../../hooks/useOrganization';
import { WithUsLogo } from '../../components/common/WithUsLogo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshContext } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Detect if this is an invite-based registration
  const redirectParam = searchParams.get('redirect') || '';
  const inviteMatch = redirectParam.match(/\/invite\/([a-zA-Z0-9\-_]+)/);
  const inviteToken = inviteMatch ? inviteMatch[1] : null;
  const isInviteFlow = !!inviteToken;

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: inviteDetails } = useInvitationDetails(inviteToken || '');

  // Pre-fill email if we have invite details
  useEffect(() => {
    if (inviteDetails?.status === 'PENDING' && inviteDetails.invitedEmail) {
      setEmail(inviteDetails.invitedEmail);
    }
  }, [inviteDetails]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast('warning', 'Please enter your full name.');
      return;
    }
    if (!isInviteFlow && !companyName.trim()) {
      toast('warning', 'Please enter your company name.');
      return;
    }
    if (!email.trim()) {
      toast('warning', 'Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      toast('warning', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast('warning', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { fullName, email, password };
      if (isInviteFlow) {
        // Invite flow: send inviteToken so backend atomically accepts the invitation
        payload.inviteToken = inviteToken;
      } else {
        // Normal flow: create a new workspace
        payload.companyName = companyName;
      }

      const response = await apiClient.post('/auth/register', payload);

      if (response.data?.user) {
        AuthSession.setSession(response.data.user, response.data.organization);
        refreshContext();

        if (isInviteFlow) {
          toast('success', `Welcome to ${response.data.organization?.name || 'the team'}!`);
          router.push('/dashboard');
        } else {
          toast('success', `Workspace "${companyName}" created! Welcome aboard.`);
          router.push('/dashboard');
        }
      } else {
        toast('error', 'Invalid response from server. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
          href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-4 py-2 rounded-full border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20"
        >
          Sign In
        </Link>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          {/* Card */}
          <div className="bg-white dark:bg-[#0f0f11] border border-black/10 dark:border-white/10 rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.8)]">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {isInviteFlow ? 'Accept Team Invitation' : 'Create your workspace'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-normal">
                {isInviteFlow ? 'Join your organization on WithUs' : 'Start managing secure delegated access in minutes'}
              </p>
            </div>

            {/* Invite Banner */}
            {isInviteFlow && (
              <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-black/10 dark:border-white/10 rounded-2xl text-center text-xs leading-relaxed">
                <p className="text-zinc-900 dark:text-white font-semibold mb-1">First time joining WithUs?</p>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                  You are creating an account with your invited email.
                </p>
                <p className="text-zinc-400 dark:text-zinc-500 text-[11px] mt-1">
                  Already have an account?{' '}
                  <Link
                    href={`/login?redirect=${encodeURIComponent(redirectParam)}`}
                    className="text-zinc-900 dark:text-white font-semibold underline"
                  >
                    Sign In
                  </Link>{' '}
                  instead.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white/40 focus:bg-white dark:focus:bg-white/[0.07] transition-all"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Company Name (only if not invite) */}
              {!isInviteFlow && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full h-11 px-3.5 bg-zinc-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white/40 focus:bg-white dark:focus:bg-white/[0.07] transition-all"
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  disabled={isInviteFlow}
                  className={`w-full h-11 px-3.5 bg-zinc-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white/40 focus:bg-white dark:focus:bg-white/[0.07] transition-all ${
                    isInviteFlow ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {isInviteFlow && (
                  <p className="text-[11px] text-zinc-400 mt-1">This is the email address that was invited.</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    className="w-full h-11 pl-3.5 pr-10 bg-zinc-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white/40 focus:bg-white dark:focus:bg-white/[0.07] transition-all"
                    placeholder="Min. 8 characters"
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    className="w-full h-11 pl-3.5 pr-10 bg-zinc-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl text-sm font-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white/40 focus:bg-white dark:focus:bg-white/[0.07] transition-all"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms note */}
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center leading-relaxed pt-1">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-zinc-900 dark:text-white font-medium underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-zinc-900 dark:text-white font-medium underline">
                  Privacy Policy
                </Link>.
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-sm rounded-full shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                ) : (
                  isInviteFlow ? 'Accept & Join Workspace' : 'Create Workspace'
                )}
              </button>
            </form>
          </div>

          {/* Bottom Switcher */}
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6">
            Already have an account?{' '}
            <Link
              href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
              className="text-zinc-900 dark:text-white font-semibold hover:underline"
            >
              Sign In
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
