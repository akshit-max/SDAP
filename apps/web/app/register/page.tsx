'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  Eye,
  EyeOff,
  User,
  Building2,
  Mail,
  Lock,
  Users,
  Package,
  Zap,
  ShieldCheck,
  ArrowRight,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';
import { useInvitationDetails } from '../../hooks/useOrganization';
import { WithUsStar } from '../../components/common/WithUsLogo';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshContext } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

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

    if (!agreeTerms) {
      toast('warning', 'Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }
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
        payload.inviteToken = inviteToken;
      } else {
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
          <span className="hidden sm:inline text-white/70">Already have an account?</span>
          <Link
            href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold transition-all shadow-sm"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Grid: Left Narrative + Right Frosted Glass Card */}
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
            Create your <br />
            enterprise <br />
            workspace.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/85 leading-relaxed font-normal max-w-md">
            Set up a workspace, invite your team, and start managing delegated access across all your tools in minutes.
          </p>

          {/* 4 Feature Items with Outline Icons */}
          <div className="space-y-3.5 pt-1 text-sm font-medium text-white/90">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span>Invite team members</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span>Role-based permissions</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span>Start in minutes</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span>Enterprise ready</span>
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
          <div className="w-full max-w-[440px] rounded-[32px] p-8 sm:p-9 bg-white/[0.12] backdrop-blur-2xl border border-white/25 shadow-[0_30px_70px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.25)] text-white">
            {/* Card Header with Logo */}
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2 mb-2.5">
                <span className="text-xl font-black tracking-wider text-white">WITH US</span>
                <WithUsStar className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {isInviteFlow ? 'Accept Team Invitation' : 'Create your workspace'}
              </h2>
              <p className="text-xs text-white/75 mt-1 font-normal">
                {isInviteFlow ? 'Join your organization on WithUs' : 'Get started in less than a minute'}
              </p>
            </div>

            {/* Invite Banner */}
            {isInviteFlow && (
              <div className="mb-4 p-3 bg-white/15 border border-white/20 rounded-2xl text-center text-xs leading-relaxed">
                <p className="text-white font-semibold mb-0.5">First time joining WithUs?</p>
                <p className="text-white/80 text-[11px]">
                  You are creating an account with your invited email.
                </p>
                <p className="text-white/60 text-[11px] mt-0.5">
                  Already have an account?{' '}
                  <Link
                    href={`/login?redirect=${encodeURIComponent(redirectParam)}`}
                    className="text-white font-bold underline underline-offset-2 hover:text-white/90"
                  >
                    Sign In
                  </Link>{' '}
                  instead.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                  FULL NAME
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    className="w-full h-10 pl-10 pr-4 bg-white/[0.10] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.16] transition-all"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Company Name (only if not invite) */}
              {!isInviteFlow && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                    COMPANY NAME
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      required
                      className="w-full h-10 pl-10 pr-4 bg-white/[0.10] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.16] transition-all"
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isInviteFlow}
                    className={`w-full h-10 pl-10 pr-4 bg-white/[0.10] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.16] transition-all ${
                      isInviteFlow ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {isInviteFlow && (
                  <p className="text-[11px] text-white/60 mt-0.5">This is the email address that was invited.</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    className="w-full h-10 pl-10 pr-10 bg-white/[0.10] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.16] transition-all"
                    placeholder="Min. 8 characters"
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

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    className="w-full h-10 pl-10 pr-10 bg-white/[0.10] border border-white/20 rounded-xl text-sm font-normal text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:bg-white/[0.16] transition-all"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox matching user reference */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] leading-snug">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-3.5 h-3.5 mt-0.5 rounded bg-white/10 border-white/30 text-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-white/75">
                    I agree to the{' '}
                    <Link href="/terms" className="text-white font-bold hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-white font-bold hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-white hover:bg-white/95 text-zinc-950 font-bold text-sm rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Creating Account...</>
                ) : (
                  <>{isInviteFlow ? 'Accept & Join Workspace' : 'Create Workspace'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Bottom Card Switcher */}
            <div className="text-center text-xs text-white/80 mt-5 pt-1">
              Already have an account?{' '}
              <Link
                href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
                className="text-white font-bold hover:underline transition-colors"
              >
                Sign In
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
