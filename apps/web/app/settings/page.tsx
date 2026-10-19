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

  const inputClass = 'w-full px-3.5 py-2 rounded-lg text-xs bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] dark:placeholder-[#8E8E93] focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all';
  const sectionClass = 'rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden';
  const headerClass = 'px-6 py-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]';
  const labelClass = 'block text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5';
  const saveBtn = 'inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium bg-[#0071E3] hover:bg-[#0077ED] text-white disabled:opacity-40 transition-colors shadow-sm';

  const userInitial = (fullName || profile?.fullName || profile?.email || 'U').charAt(0).toUpperCase();

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-normal">
            Manage your personal profile, workspace, and organizational configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* ── Profile Section ── */}
            <div className={sectionClass}>
              <div className={headerClass}>
                <User className="w-4 h-4 text-[#86868B]" />
                <span>Profile</span>
              </div>
              <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
                {/* Avatar Row */}
                <div className="flex items-center gap-4 pb-2">
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#38383A] flex items-center justify-center text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] shadow-sm">
                    {userInitial}
                  </div>
                  <button
                    type="button"
                    onClick={() => toast('info', 'Avatar upload will be available in the next release.')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-white dark:bg-[#2C2C2E] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A]/80 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] shadow-sm transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#86868B]" />
                    <span>Change Avatar</span>
                  </button>
                </div>

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
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 border border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#8E8E93] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Title</label>
                  <input
                    type="text"
                    readOnly
                    value={role || 'Owner'}
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 border border-[#E5E5EA] dark:border-[#38383A] text-[#1D1D1F] dark:text-[#F5F5F7] cursor-not-allowed"
                  />
                  <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">This will be visible to your team members</p>
                </div>
                
                <div className="pt-2">
                  <label className={`${labelClass} flex items-center gap-1.5`}>
                    <GitBranch className="w-3.5 h-3.5 text-[#86868B]" />
                    <span>GitHub Username</span>
                  </label>
                  <input
                    id="profile-github"
                    type="text"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. octocat"
                  />
                  <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">Required to receive delegated access to GitHub repositories.</p>
                </div>
                
                <div className="flex justify-start pt-2">
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
                <Building2 className="w-4 h-4 text-[#86868B]" />
                <span>Workspace</span>
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
                    className={`${inputClass} font-mono`}
                  />
                  <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">
                    10-digit mobile number for payment receipts and billing updates.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Organization ID</label>
                  <input type="text" readOnly value={organization?.id || ''}
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 border border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#8E8E93] font-mono cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-start">
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
            <div className={sectionClass}>
              <div className={headerClass}>
                <Building2 className="w-4 h-4 text-[#86868B]" />
                <span>Workspace</span>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className={labelClass}>Workspace Name</label>
                  <input
                    type="text"
                    readOnly
                    value={orgDetail?.name || organization?.name || ''}
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 border border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#8E8E93] cursor-not-allowed"
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
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 border border-[#E5E5EA] dark:border-[#38383A] text-[#86868B] dark:text-[#8E8E93] cursor-not-allowed font-mono"
                  />
                </div>
              </div>
            </div>
            )}
          </div>

          <div>
            {/* ── Change Password Section ── */}
            <div className={sectionClass}>
              <div className={headerClass}>
                <Lock className="w-4 h-4 text-[#86868B]" />
                <span>Change Password</span>
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
                      placeholder="Enter your current password"
                    />
                    <button type="button" onClick={() => setShowPasswords(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors">
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
                    placeholder="Enter new password"
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
                    placeholder="Confirm new password"
                  />
                </div>
                {pwError && (
                  <p className="text-xs text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-3 py-2 rounded-lg font-medium">{pwError}</p>
                )}
                <div className="flex justify-start">
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
