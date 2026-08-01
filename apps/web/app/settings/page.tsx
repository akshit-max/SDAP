'use client';

import React, { useState, useEffect } from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuth } from '../../lib/auth/AuthContext';
import { useUpdateOrganization } from '../../hooks/useOrganization';
import { useUpdateProfile, useChangePassword, useProfile } from '../../hooks/useProfile';
import { useToast } from '../../components/common/Toast';
import { Loader2, Building2, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const { organization, refreshContext } = useAuth();
  const { toast } = useToast();

  // ── Workspace ──────────────────────────────────────────────
  const [orgName, setOrgName] = useState(organization?.name || '');
  const { mutate: updateOrg, isPending: orgPending } = useUpdateOrganization(organization?.id || '');

  useEffect(() => {
    if (organization?.name) setOrgName(organization.name);
  }, [organization?.name]);

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    updateOrg(
      { name: orgName.trim() },
      {
        onSuccess: () => { toast('success', 'Workspace name updated.'); refreshContext(); },
        onError: (err: any) => toast('error', err.message || 'Failed to update workspace.'),
      }
    );
  };

  // ── Profile ────────────────────────────────────────────────
  const { data: profile } = useProfile();
  const [fullName, setFullName] = useState('');
  const { mutate: updateProfile, isPending: profilePending } = useUpdateProfile();

  useEffect(() => {
    if (profile?.fullName) setFullName(profile.fullName);
  }, [profile]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    updateProfile(
      { fullName: fullName.trim() },
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

  const inputClass = 'w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm';
  const sectionClass = 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm';
  const headerClass = 'px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50';
  const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';
  const saveBtn = 'flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm disabled:opacity-50';

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your profile and workspace configuration.</p>
        </div>

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
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Email changes require email verification — coming soon.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={profilePending || !fullName.trim() || fullName === profile?.fullName} className={saveBtn}>
                {profilePending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Profile
              </button>
            </div>
          </form>
        </div>

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
              <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 px-3 py-2 rounded-lg">{pwError}</p>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={pwPending || !currentPassword || !newPassword || !confirmPassword} className={saveBtn}>
                {pwPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Change Password
              </button>
            </div>
          </form>
        </div>

        {/* ── Workspace Section ── */}
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
              <label className={labelClass}>Organization ID</label>
              <input type="text" readOnly value={organization?.id || ''}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-mono cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-1">Use this ID when calling the API directly.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={orgPending || !orgName.trim() || orgName === organization?.name} className={saveBtn}>
                {orgPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

      </div>
    </DashboardShell>
  );
}
