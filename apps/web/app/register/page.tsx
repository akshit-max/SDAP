'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-[#070b14] text-white font-sans flex flex-col justify-between relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Atmospheric Marketing Sun-Halo & Ambient Glows */}
      <div className="absolute top-0 left-0 w-full lg:w-2/3 h-full pointer-events-none overflow-hidden -z-0">
        <img
          src="/sun-halo.png"
          alt=""
          className="absolute -top-32 -left-32 w-[900px] max-w-none opacity-45 mix-blend-screen select-none pointer-events-none"
        />
        <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] bg-blue-600/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-10 w-[420px] h-[420px] bg-indigo-600/12 rounded-full blur-[110px] pointer-events-none" />
      </div>

      {/* Two-Sided Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left Side: Brand & Product Showcase (Two-Sided, Cheerful Marketing Theme) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 xl:p-16 border-r border-white/10 relative">
          {/* Top Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-85 transition-opacity">
              <WithUsLogo height="h-8" forceTheme="dark" />
            </Link>
          </div>

          {/* Hero Content */}
          <div className="my-auto max-w-xl space-y-7">
            {/* Cheerful Badge with Steady Luminous Dot (NO pulsating flicker) */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-medium text-blue-400 tracking-wide">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.85)] flex-shrink-0" />
              <span>Enterprise Credential Gateway</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.14]">
              Give access without <br />
              <span className="bg-gradient-to-r from-white via-zinc-200 to-blue-200 bg-clip-text text-transparent">
                giving away control.
              </span>
            </h1>

            <p className="text-zinc-400 text-sm xl:text-base leading-relaxed font-normal max-w-lg">
              Manage scoped, temporary delegated access to platforms, cloud repositories, and enterprise portals with automatic OTP relay and zero credential leakage.
            </p>

            {/* Cheerful Visual Feature Cards */}
            <div className="pt-2 space-y-3.5 max-w-lg">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:border-blue-500/30 hover:bg-white/[0.05] transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Zero Credential Exposure</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Credentials inject directly into authenticated browser enclaves. Collaborators never view or copy raw passwords.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Time-Scoped Sessions</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Automatic access expiry with full audit trail, screenshot proof, and instant live revocation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Info */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-6 border-t border-white/10">
            <span className="font-medium text-zinc-400">WithUs Platform &bull; Security First</span>
            <span className="inline-flex items-center gap-2 text-zinc-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" /> 256-bit AES Vault
            </span>
          </div>
        </div>

        {/* Right Side: Form Side */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-y-auto">
          {/* Top Header Switcher */}
          <div className="w-full flex items-center justify-between mb-6">
            <div className="lg:hidden">
              <Link href="/" className="hover:opacity-85 transition-opacity">
                <WithUsLogo height="h-7" forceTheme="dark" />
              </Link>
            </div>
            <div className="ml-auto">
              <Link
                href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
                className="text-xs font-medium text-zinc-300 hover:text-white transition-all px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Form Container */}
          <div className="w-full max-w-[440px] mx-auto my-auto py-6">
            <div className="bg-gradient-to-b from-[#0e1424]/90 to-[#0a0e18]/90 border border-white/15 rounded-[28px] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(59,130,246,0.12)] backdrop-blur-xl">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {isInviteFlow ? 'Accept Team Invitation' : 'Create your workspace'}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 font-normal">
                  {isInviteFlow ? 'Join your organization on WithUs' : 'Start managing secure delegated access in minutes'}
                </p>
              </div>

              {/* Invite Banner */}
              {isInviteFlow && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center text-xs leading-relaxed">
                  <p className="text-white font-semibold mb-1">First time joining WithUs?</p>
                  <p className="text-zinc-300 text-[11px]">
                    You are creating an account with your invited email.
                  </p>
                  <p className="text-zinc-400 text-[11px] mt-1">
                    Already have an account?{' '}
                    <Link
                      href={`/login?redirect=${encodeURIComponent(redirectParam)}`}
                      className="text-blue-400 font-semibold underline hover:text-blue-300"
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
                  <label className="block text-xs font-medium text-zinc-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/15 rounded-xl text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/[0.07] transition-all"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Company Name (only if not invite) */}
                {!isInviteFlow && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full h-11 px-3.5 bg-white/[0.04] border border-white/15 rounded-xl text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/[0.07] transition-all"
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isInviteFlow}
                    className={`w-full h-11 px-3.5 bg-white/[0.04] border border-white/15 rounded-xl text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/[0.07] transition-all ${
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
                  <label className="block text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="w-full h-11 pl-3.5 pr-10 bg-white/[0.04] border border-white/15 rounded-xl text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/[0.07] transition-all"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="w-full h-11 pl-3.5 pr-10 bg-white/[0.04] border border-white/15 rounded-xl text-sm font-normal text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/[0.07] transition-all"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms note */}
                <div className="text-[11px] text-zinc-400 text-center leading-relaxed pt-1">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-white font-medium underline hover:text-blue-300">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-white font-medium underline hover:text-blue-300">
                    Privacy Policy
                  </Link>.
                </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-sm rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_30px_rgba(255,255,255,0.15)] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Creating Account...</>
                  ) : (
                    isInviteFlow ? 'Accept & Join Workspace' : 'Create Workspace'
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Switcher */}
            <div className="text-center text-xs text-zinc-400 mt-6">
              Already have an account?{' '}
              <Link
                href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
                className="text-white font-semibold hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Footer */}
          <footer className="w-full text-center text-xs text-zinc-500 pt-6">
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
              <span>&copy; {new Date().getFullYear()} WithUs Inc.</span>
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-zinc-300 transition-colors">Security</Link>
              <Link href="/cookie-policy" className="hover:text-zinc-300 transition-colors">Cookies</Link>
              <Link href="/refund-policy" className="hover:text-zinc-300 transition-colors">Refund Policy</Link>
            </div>
          </footer>
        </div>
      </div>
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
