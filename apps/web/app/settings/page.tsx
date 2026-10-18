'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuth } from '../../lib/auth/AuthContext';
import { useUpdateOrganization, useOrganization } from '../../hooks/useOrganization';
import { useUpdateProfile, useChangePassword, useProfile } from '../../hooks/useProfile';
import { useToast } from '../../components/common/Toast';
import { Loader2, Building2, User, Lock, Eye, EyeOff, GitBranch } from 'lucide-react';
import { hasPermission } from '../../lib/auth/permissions';

export default function SettingsPage() {
  const { organization, refreshContext } = useAuth();
  const orgId = organization?.id || '';
  const { data: orgDetail } = useOrganization(orgId);
  const { toast } = useToast();
  const role = (organization as any)?.role as string | undefined;
  // ORGANIZATION_UPDATE is OWNER-only per the backend permission matrix
  const canUpdateOrg = hasPermission(role, 'ORGANIZATION_UPDATE');

  // ── Workspace ──────────────────────────────────────────────
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [billingPhone, setBillingPhone] = useState('');
  const { mutate: updateOrg, isPending: orgPending } = useUpdateOrganization(orgId);

  useEffect(() => {
    if (orgDetail?.name) {
      setOrgName(orgDetail.name);
    } else if (organization?.name) {
      setOrgName(organization.name);
    }

    const savedPhone =
      (orgDetail?.settings as any)?.billingPhone ||
      (organization as any)?.settings?.billingPhone;
    if (typeof savedPhone === 'string') {
      setBillingPhone(savedPhone);
    }
  }, [orgDetail, organization?.name]);

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    if (billingPhone.trim() && !/^\d{10}$/.test(billingPhone.trim())) {
      toast('error', 'Billing phone number must be exactly 10 digits.');
      return;
    }
    const currentSettings =
      (orgDetail?.settings as any) ||
      (organization as any)?.settings ||
      {};
    const updatedSettings = {
      ...currentSettings,
      ...(billingPhone.trim() ? { billingPhone: billingPhone.trim() } : {}),
    };
    if (!billingPhone.trim() && currentSettings.billingPhone) {
      delete updatedSettings.billingPhone;
    }

    updateOrg(
      {
        name: orgName.trim(),
        settings: updatedSettings,
      },
      {
        onSuccess: () => {
          toast('success', 'Workspace settings updated.');
          refreshContext();
        },
        onError: (err: any) =>
          toast('error', err.message || 'Failed to update workspace.'),
      }
    );
  };

  // ── Profile ────────────────────────────────────────────────
  const { data: profile } = useProfile();
  const [fullName, setFullName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const { mutate: updateProfile, isPending: profilePending } = useUpdateProfile();

  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
    if (profile?.providerProfiles?.githubUsername) setGithubUsername(profile.providerProfiles.githubUsername);
  }, [profile]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    updateProfile(
      { fullName: fullName.trim(), githubUsername: githubUsername.trim() },
      {
        onSuccess: () => { toast('success', 'Profile updated.'); refreshContext(); },
        onError: (err: any) => toast('error', err.message || 'Failed to update profile.'),
      }
    );
  };

  // ── Change Password ────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwError, setPwError] = useState('');
  const { mutate: changePassword, isPending: pwPending } = useChangePassword();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match.'); return; }
    if (newPassword.length < 8) { setPwError('New password must be at least 8 characters.'); return; }

    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast('success', 'Password changed. You will be logged out of all devices.');
          setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        },
        onError: (err: any) => setPwError(err?.response?.data?.message || 'Failed to change password.'),
      }
    );
  };

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-all';
  const sectionClass = 'rounded-[28px] border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden';
  const headerClass = 'px-6 py-4 border-b border-zinc-200/60 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.02]';
  const labelClass = 'block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2';
  const saveBtn = 'inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40 transition-all shadow-sm';

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-2">
            <Building2 className="w-3 h-3 text-zinc-500" />
            Workspace & Account
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Workspace Settings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your personal profile, credentials, and organizational configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* ── Profile Section ── */}
            <div className={sectionClass}>
              <div className={headerClass}>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Profile
                </h2>
              </div>
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    id="profile-fullname"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className={inputClass}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input
                    type="email"
                    readOnly
                    value={profile?.email || ''}
                    className="w-full px-3.5 py-2 bg-slate-50/50 dark:bg-zinc-900/50 border border-premium rounded-lg text-premium-muted text-xs cursor-not-allowed"
                  />
                  <p className="text-[10px] text-premium-muted mt-1 font-semibold">Email changes require email verification — coming soon.</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className={`${labelClass} flex items-center gap-1.5`}>
                    <GitBranch className="w-3.5 h-3.5" />
                    GitHub Username
                  </label>
                  <input
                    id="profile-github"
                    type="text"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. octocat"
                  />
                  <p className="text-[10px] text-premium-muted mt-1 font-semibold">Required to receive delegated access to GitHub repositories.</p>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={profilePending || (!fullName.trim() && !githubUsername.trim())} className={saveBtn}>
                    {profilePending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Save Profile
                  </button>
                </div>
              </form>
            </div>

            {/* ── Workspace Section ── */}
            {canUpdateOrg ? (
            <div className={sectionClass}>
              <div className={headerClass}>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" /> Workspace
                </h2>
              </div>
              <form onSubmit={handleOrgSubmit} className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Workspace Name</label>
                  <input
                    id="settings-org-name"
                    type="text"
                    required
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Billing Phone Number</label>
                  <input
                    id="settings-billing-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={billingPhone}
                    onChange={e => setBillingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                  <p className="text-[10px] text-premium-muted mt-1 font-semibold leading-relaxed">
                    10-digit mobile number for payment receipts and billing updates. Automatically pre-fills at checkout.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Organization ID</label>
                  <input type="text" readOnly value={organization?.id || ''}
                    className="w-full px-3.5 py-2 bg-slate-50/50 dark:bg-zinc-900/50 border border-premium rounded-lg text-premium-muted text-xs font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-premium-muted mt-1 font-semibold">Use this ID when calling the API directly.</p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      orgPending ||
                      !orgName.trim() ||
                      (orgName === (orgDetail?.name || organization?.name || '') &&
                        billingPhone === ((orgDetail?.settings as any)?.billingPhone || (organization as any)?.settings?.billingPhone || ''))
                    }
                    className={saveBtn}
                  >
                    {orgPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
            ) : (
            // Read-only Workspace section for non-Owner members.
            // Matches the same visual design as the Owner's editable version
            // but all inputs are read-only and no Save button is shown.
            <div className={sectionClass}>
              <div className={headerClass}>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" /> Workspace
                </h2>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Workspace Name</label>
                  <input
                    type="text"
                    readOnly
                    value={orgDetail?.name || organization?.name || ''}
                    className="w-full px-3.5 py-2 bg-slate-50/50 dark:bg-zinc-900/50 border border-premium rounded-lg text-premium-muted text-xs cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className={labelClass}>Billing Phone Number</label>
                  <input
                    type="text"
                    readOnly
                    value={
                      (orgDetail?.settings as any)?.billingPhone ||
                      (organization as any)?.settings?.billingPhone ||
                      'Not configured (set by Owner)'
                    }
                    className="w-full px-3.5 py-2 bg-slate-50/50 dark:bg-zinc-900/50 border border-premium rounded-lg text-premium-muted text-xs cursor-not-allowed font-mono"
                  />
                  <p className="text-[10px] text-premium-muted mt-1 font-semibold">
                    Contact mobile number for billing receipts and payment confirmations.
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>

          <div>
            {/* ── Change Password Section ── */}
            <div className={sectionClass}>
              <div className={headerClass}>
                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Change Password
                </h2>
              </div>
              <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Current Password</label>
                  <div className="relative">
                    <input
                      id="settings-current-password"
                      type={showPasswords ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={e => { setCurrentPassword(e.target.value); setPwError(''); }}
                      className={`${inputClass} pr-10`}
                      placeholder="Your current password"
                    />
                    <button type="button" onClick={() => setShowPasswords(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>New Password</label>
                  <input
                    id="settings-new-password"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPwError(''); }}
                    className={inputClass}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <input
                    id="settings-confirm-password"
                    type={showPasswords ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPwError(''); }}
                    className={inputClass}
                    placeholder="Repeat new password"
                  />
                </div>
                {pwError && (
                  <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg font-semibold">{pwError}</p>
                )}
                <div className="flex justify-end">
                  <button type="submit" disabled={pwPending || !currentPassword || !newPassword || !confirmPassword} className={saveBtn}>
                    {pwPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
