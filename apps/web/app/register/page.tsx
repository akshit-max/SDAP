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
    <div className="min-h-screen min-h-[100dvh] w-full relative flex flex-col overflow-x-hidden text-white font-geist antialiased selection:bg-white selection:text-zinc-950">
      {/* High-Resolution Clean Twilight Horizon Wallpaper */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none -z-10"
        style={{ backgroundImage: "url('/bg-dunes.jpg')" }}
      />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between relative z-20 shrink-0">
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
            href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/30 hover:border-white/70 hover:bg-white/10 text-white font-medium transition-all shadow-sm backdrop-blur-md"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Grid: Left Narrative + Right Frosted Glass Card */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-5 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Brand & Product Showcase */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6 sm:space-y-7 select-none max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
          {/* Badge: Thin line + uppercase tracking text */}
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="w-9 h-[1.5px] bg-white/60" />
            <span className="text-xs font-bold tracking-[0.22em] uppercase text-white/90">
              DELEGATED ACCESS PLATFORM
            </span>
          </div>

          {/* Main Headline with font-geist */}
          <h1 className="font-geist text-4xl sm:text-5xl lg:text-[56px] font-medium tracking-tight text-white leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
            Create your<br />
            enterprise<br />
            <span className="text-sky-300 drop-shadow-[0_0_24px_rgba(125,211,252,0.45)]">workspace.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-[17px] text-white/90 leading-relaxed font-normal max-w-lg mx-auto lg:mx-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
            Set up a workspace, invite your team, and start managing delegated access across all your tools in minutes.
          </p>

          {/* 4 Feature Items Stacked Vertically with Subtitles */}
          <div className="space-y-4 pt-1 max-w-md mx-auto lg:mx-0 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Invite team members</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Effortless provisioning</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Role-based permissions</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">Granular access control</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Start in minutes</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">No complex setup</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.12] border border-white/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-[15px] font-medium text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">Enterprise ready</p>
                <p className="text-xs sm:text-[13px] text-white/80 font-medium">SOC-2 compliant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Frosted Glass Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center w-full">
          <div className="w-full max-w-[450px] rounded-[32px] p-6 sm:p-9 bg-white/[0.10] backdrop-blur-2xl border border-white/25 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] text-white">
            {/* Card Header with Logo */}
            <div className="text-center mb-5">
              <div className="flex justify-center mb-3">
                <img
                  src="/withus_white_full.png"
                  alt="WithUs"
                  className="h-7 sm:h-8 w-auto object-contain select-none"
                />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-medium tracking-tight text-white">
                {isInviteFlow ? 'Accept Team Invitation' : 'Create your workspace'}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 mt-1 font-normal">
                {isInviteFlow ? 'Join your organization on WithUs' : 'Get started in less than a minute'}
              </p>
            </div>

            {/* Invite Banner */}
            {isInviteFlow && (
              <div className="mb-4 p-3.5 bg-white/15 border border-white/25 rounded-2xl text-center text-xs leading-relaxed">
                <p className="text-white font-medium mb-0.5">First time joining WithUs?</p>
                <p className="text-white/80 text-[11px]">
                  You are creating an account with your invited email.
                </p>
                <p className="text-white/60 text-[11px] mt-0.5">
                  Already have an account?{' '}
                  <Link
                    href={`/login?redirect=${encodeURIComponent(redirectParam)}`}
                    className="text-white font-medium underline underline-offset-2 hover:text-white/90"
                  >
                    Sign In
                  </Link>{' '}
                  instead.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name & Company Name */}
              {!isInviteFlow ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                      FULL NAME
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full h-11 pl-10 pr-3.5 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                      COMPANY NAME
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                      <input
                        type="text"
                        required
                        className="w-full h-11 pl-10 pr-3.5 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                        placeholder="Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Full Name single row if invite */
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                    FULL NAME
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      className="w-full h-11 pl-10 pr-4 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

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
                    disabled={isInviteFlow}
                    className={`w-full h-11 pl-10 pr-4 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ${isInviteFlow ? 'opacity-60 cursor-not-allowed' : ''
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
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-10 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                    placeholder="Min. 8 characters"
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

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/90">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    className="w-full h-11 pl-10 pr-10 bg-white/[0.12] hover:bg-white/[0.16] focus:bg-white/[0.20] border border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full text-sm font-medium text-white placeholder:text-white/50 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] leading-snug">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-white/10 border-white/30 text-zinc-950 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-white/90 font-medium">
                    I agree to the{' '}
                    <Link href="/terms" className="text-white font-medium underline-offset-2 hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-white font-medium underline-offset-2 hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-white hover:bg-white/95 active:scale-[0.99] text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_25px_rgba(255,255,255,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Creating Account...</>
                ) : (
                  <>{isInviteFlow ? 'Accept & Join Workspace' : 'Create Workspace'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Bottom Card Switcher */}
            <div className="text-center text-xs text-white/85 mt-4 pt-1 font-medium">
              Already have an account?{' '}
              <Link
                href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
                className="text-white font-medium underline-offset-4 hover:underline transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 relative z-20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/75 shrink-0">
        <div>&copy; {new Date().getFullYear()} WithUs Inc. All rights reserved.</div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
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
