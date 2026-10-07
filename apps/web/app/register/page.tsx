'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, Mail, Lock, User, Building2, Eye, EyeOff } from 'lucide-react';
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!fullName.trim()) { toast('warning', 'Please enter your full name.'); return; }
    if (!isInviteFlow && !companyName.trim()) { toast('warning', 'Please enter your company name.'); return; }
    if (!email.trim()) { toast('warning', 'Please enter your email address.'); return; }
    if (password.length < 8) { toast('warning', 'Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { toast('warning', 'Passwords do not match.'); return; }

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
    <div className="min-h-screen min-h-[100dvh] lg:h-screen overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-premium-bg text-premium-main">
      {/* Brand Side (Left) */}
      <div className="hidden lg:flex lg:col-span-5 bg-zinc-950 text-white p-16 flex-col justify-between relative overflow-hidden border-r border-zinc-900 select-none h-full">

        {/* Brand Header */}
        <div className="flex items-center relative z-10 pl-2">
          <img src="/logo-dark.png" alt="WithUs" className="h-14 w-auto object-contain" />
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-sm my-auto space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Security first.<br />
            Credentials simplified.
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed font-medium">
            Manage delegated access to GitHub, Vercel, Stripe, and government portals with scoped sessions, automatic OTP extraction, and zero raw credential exposure.
          </p>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 flex items-center gap-2 text-zinc-500 text-[10px] font-bold tracking-wider uppercase">
          <svg className="w-4 h-4 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Enterprise Grade Protection
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="lg:col-span-7 flex flex-col justify-between min-h-full p-4 sm:p-8 pb-20 sm:pb-8 relative overflow-y-auto">
        <div className="h-8 hidden lg:block"></div>

        <div className="flex-1 flex items-center justify-center py-6 w-full">
          <div className="max-w-md w-full premium-card p-6 sm:p-10 bg-premium-surface">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <WithUsLogo height="h-16" />
              </div>
              {!isInviteFlow && (
                <p className="text-[10px] text-premium-muted font-bold tracking-widest uppercase">
                  Create your enterprise workspace
                </p>
              )}
            </div>

            {isInviteFlow && (
              <div className="mb-6 p-4 bg-zinc-100/50 dark:bg-zinc-900/40 border border-premium rounded-xl text-center text-xs font-semibold leading-relaxed">
                <p className="text-premium-main font-bold mb-1">First time joining WithUs?</p>
                <p className="text-premium-muted text-[11px]">
                  You are creating a new account using the invited email.
                </p>
                <p className="text-premium-muted text-[11px] mt-0.5">
                  Already have an account? Click{' '}
                  <Link href={`/login?redirect=${encodeURIComponent(redirectParam)}`} className="text-premium-main font-bold underline hover:text-zinc-800 transition-colors">
                    Sign In
                  </Link>{' '}
                  instead to join the team.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 premium-input text-xs font-medium"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Company Name — only shown for normal signups */}
              {!isInviteFlow && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-2.5 premium-input text-xs font-medium"
                      placeholder="Acme Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    disabled={isInviteFlow}
                    className={`w-full pl-10 pr-4 py-2.5 premium-input text-xs font-medium ${isInviteFlow ? 'text-zinc-500 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900/50' : ''}`}
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {isInviteFlow && (
                  <p className="text-[10px] text-premium-muted mt-1 font-semibold">This is the email address that was invited.</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 premium-input text-xs font-medium"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-premium-muted hover:text-premium-main focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wider">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 premium-input text-xs font-medium"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-premium-muted hover:text-premium-main focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-premium-muted font-medium text-center leading-relaxed pt-1 pb-2 px-2">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-premium-main font-semibold hover:underline hover:text-zinc-800 transition-colors">Terms & Conditions</Link>
                {' '}and acknowledge our{' '}
                <Link href="/privacy" className="text-premium-main font-semibold hover:underline hover:text-zinc-800 transition-colors">Privacy Policy</Link>.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full premium-button-primary py-2.5 text-xs shadow-md font-bold mt-3"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Creating Account...</>
                ) : (
                  isInviteFlow ? 'Create Account & Join Team' : 'Create Workspace'
                )}
              </button>

              <div className="text-center text-xs text-premium-muted pt-4 border-t border-premium mt-4">
                Already have an account?{' '}
                <Link
                  href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
                  className="text-premium-main font-bold hover:underline hover:text-zinc-800 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center text-[11px] text-premium-muted font-medium max-w-md mx-auto w-full pt-4 pb-2">
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1.5">
            <Link href="/privacy" className="hover:text-premium-main transition-colors hover:underline">Privacy Policy</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/terms" className="hover:text-premium-main transition-colors hover:underline">Terms & Conditions</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/security" className="hover:text-premium-main transition-colors hover:underline">Security & Data Protection</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/cookie-policy" className="hover:text-premium-main transition-colors hover:underline">Cookie Policy</Link>
            <span className="text-zinc-300 dark:text-zinc-700 select-none hidden sm:inline">&bull;</span>
            <Link href="/refund-policy" className="hover:text-premium-main transition-colors hover:underline">Refund & Cancellation Policy</Link>
          </div>
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
