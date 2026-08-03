'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, Mail, Lock, User, Building2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '../../lib/api/client';
import { AuthSession } from '../../lib/auth/session';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../lib/auth/AuthContext';
import { useInvitationDetails } from '../../hooks/useOrganization';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refreshContext } = useAuth();

  // Detect if this is an invite-based registration
  const redirectParam = searchParams.get('redirect') || '';
  const inviteMatch = redirectParam.match(/\/invite\/([a-zA-Z0-9]+)/);
  const inviteToken = inviteMatch ? inviteMatch[1] : null;
  const isInviteFlow = !!inviteToken;

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-premium-bg p-6">
      <div className="max-w-md w-full premium-card p-8 shadow-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 mb-4">
            <img src="/logo.png" alt="WithUs Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-premium-main">WithUs</h1>
          <p className="text-xs text-premium-muted mt-1.5 font-medium">
            {isInviteFlow
              ? (inviteDetails?.organizationName ? `Join ${inviteDetails.organizationName}` : 'Join the team')
              : 'Create your enterprise workspace'}
          </p>
        </div>

        {isInviteFlow && (
          <div className="mb-6 p-4 bg-slate-50/50 dark:bg-zinc-900/30 border border-premium/50 rounded-lg text-center text-xs font-semibold leading-relaxed">
            <p className="text-premium-main font-bold mb-1">First time joining WithUs?</p>
            <p className="text-premium-muted text-[11px]">
              You are creating a new account using the invited email.
            </p>
            <p className="text-premium-muted text-[11px] mt-0.5">
              Already have an account? Click{' '}
              <Link href={`/login?redirect=${encodeURIComponent(redirectParam)}`} className="text-premium-main font-bold underline">
                Sign In
              </Link>{' '}
              instead to join the team.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
              <input
                type="text"
                required
                autoComplete="name"
                className="w-full pl-10 pr-4 py-2.5 premium-input text-xs"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Company Name — only shown for normal signups */}
          {!isInviteFlow && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wide">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 premium-input text-xs"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
              <input
                type="email"
                required
                autoComplete="email"
                disabled={isInviteFlow}
                className={`w-full pl-10 pr-4 py-2.5 premium-input text-xs ${isInviteFlow ? 'text-slate-500 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`}
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
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-premium-muted uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
              <input
                type="password"
                required
                autoComplete="new-password"
                className="w-full pl-10 pr-4 py-2.5 premium-input text-xs"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full premium-button-primary py-2.5 text-xs shadow-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Creating Account...</>
            ) : (
              isInviteFlow ? 'Create Account & Join Team' : 'Create Workspace'
            )}
          </button>

          <div className="text-center text-xs text-premium-muted pt-2 border-t border-premium">
            Already have an account?{' '}
            <Link
              href={isInviteFlow ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
              className="text-premium-main font-semibold hover:underline"
            >
              Sign In
            </Link>
          </div>
        </form>
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
