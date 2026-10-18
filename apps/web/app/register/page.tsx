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
        {/* Soft atmospheric gradient overlay without blur to maintain crispness */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1528]/60 via-[#10203a]/25 to-[#121a28]/65" />
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
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Brand & Product Showcase */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between space-y-7 select-none">
          {/* Badge Pill */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/[0.08] backdrop-blur-md text-[11px] font-semibold text-white/90 tracking-widest uppercase shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              <span>ENTERPRISE ONBOARDING</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold tracking-[-0.035em] text-white leading-[1.08]">
            Create your<br />
            <span className="whitespace-nowrap">enterprise workspace.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/80 leading-relaxed font-normal max-w-lg">
            Set up a workspace, invite your team, and start managing delegated access across all your tools in minutes.
          </p>

          {/* 4 Feature Items with Structured Hierarchy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 max-w-lg">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-tight">Invite team members</p>
                <p className="text-[12px] text-white/60 font-normal">Effortless team provisioning</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-tight">Role-based access</p>
                <p className="text-[12px] text-white/60 font-normal">Granular scope boundaries</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-tight">Start in minutes</p>
                <p className="text-[12px] text-white/60 font-normal">Zero-credential extension</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white tracking-tight">Enterprise ready</p>
                <p className="text-[12px] text-white/60 font-normal">SOC-2 compliance & audit logs</p>
              </div>
            </div>
          </div>

          {/* Enterprise Protection Bottom Badge */}
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ENTERPRISE GRADE PROTECTION &bull; SOC-2 READY</span>
          </div>
        </div>

        {/* Right Column: Floating Frosted Glass Card */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
          <div className="w-full max-w-[450px] rounded-[30px] p-7 sm:p-8 bg-slate-950/40 backdrop-blur-2xl border-t border-t-white/35 border-x border-x-white/20 border-b border-b-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.4)] text-white">
            {/* Card Header with Logo */}
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xl font-black tracking-wider text-white">WITH US</span>
                <WithUsStar className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {isInviteFlow ? 'Accept Team Invitation' : 'Create your workspace'}
              </h2>
              <p className="text-xs text-white/65 mt-1 font-normal">
                {isInviteFlow ? 'Join your organization on WithUs' : 'Get started in less than a minute'}
              </p>
            </div>

            {/* Invite Banner */}
            {isInviteFlow && (
              <div className="mb-4 p-3.5 bg-white/15 border border-white/25 rounded-2xl text-center text-xs leading-relaxed">
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
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name & Company Name (side-by-side on desktop if not invite) */}
              {!isInviteFlow ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                      FULL NAME
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        className="w-full h-11 pl-9 pr-3 bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/15 focus:border-white/50 focus:ring-1 focus:ring-white/30 rounded-xl text-sm font-medium text-white placeholder:text-white/30 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                      COMPANY NAME
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                      <input
                        type="text"
                        required
                        className="w-full h-11 pl-9 pr-3 bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/15 focus:border-white/50 focus:ring-1 focus:ring-white/30 rounded-xl text-sm font-medium text-white placeholder:text-white/30 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                        placeholder="Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Full Name (single column if invite) */
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                    FULL NAME
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      className="w-full h-11 pl-10 pr-3 bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/15 focus:border-white/50 focus:ring-1 focus:ring-white/30 rounded-xl text-sm font-medium text-white placeholder:text-white/30 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isInviteFlow}
                    className={`w-full h-11 pl-10 pr-4 bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/15 focus:border-white/50 focus:ring-1 focus:ring-white/30 rounded-xl text-sm font-medium text-white placeholder:text-white/30 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] ${
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

              {/* Password & Confirm Password (side-by-side on desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="w-full h-11 pl-9 pr-9 bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/15 focus:border-white/50 focus:ring-1 focus:ring-white/30 rounded-xl text-sm font-medium text-white placeholder:text-white/30 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                      placeholder="Min. 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/75">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="w-full h-11 pl-9 pr-9 bg-black/40 hover:bg-black/50 focus:bg-black/60 border border-white/15 focus:border-white/50 focus:ring-1 focus:ring-white/30 rounded-xl text-sm font-medium text-white placeholder:text-white/30 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] leading-snug">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-black/40 border-white/30 text-white focus:ring-0 cursor-pointer accent-white"
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
                className="w-full h-12 mt-2 bg-white hover:bg-white/95 active:scale-[0.99] text-zinc-950 font-bold text-sm tracking-tight rounded-xl shadow-[0_4px_20px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_24px_rgba(255,255,255,0.3)] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Creating Account...</>
                ) : (
                  <>{isInviteFlow ? 'Accept & Join Workspace' : 'Create Workspace'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Bottom Card Switcher */}
            <div className="text-center text-xs text-white/75 mt-5 pt-1">
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
