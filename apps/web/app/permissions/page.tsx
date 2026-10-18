'use client';

import React from 'react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { useAuth } from '../../lib/auth/AuthContext';
import { hasPermission, OrgRole } from '../../lib/auth/permissions';
import {
  Shield,
  Crown,
  UserCheck,
  User,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Key,
  Lock,
  Plug2,
  Clock,
  CheckSquare,
  Activity,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';

interface PermissionRow {
  key: string;
  label: string;
  description: string;
}

interface PermissionGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  permissions: PermissionRow[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'organization',
    title: 'Organization & Workspace',
    icon: Building2,
    permissions: [
      { key: 'ORGANIZATION_READ', label: 'View Workspace Details', description: 'Read organization metadata and workspace settings' },
      { key: 'ORGANIZATION_UPDATE', label: 'Update Workspace Settings', description: 'Modify workspace name and organization profile' },
      { key: 'ORGANIZATION_DELETE', label: 'Delete Workspace', description: 'Permanently remove organization and all associated data' },
    ],
  },
  {
    id: 'team',
    title: 'Team & Member Management',
    icon: Users,
    permissions: [
      { key: 'MEMBER_READ', label: 'View Team Members', description: 'See organization directory and member statuses' },
      { key: 'MEMBER_INVITE', label: 'Invite New Members', description: 'Send organization invitations and manage pending invites' },
      { key: 'MEMBER_REMOVE', label: 'Remove Members', description: 'Offboard or remove members from the organization' },
      { key: 'MEMBER_UPDATE_ROLE', label: 'Manage Member Roles', description: 'Promote members to Admin or demote Admins to Member' },
    ],
  },
  {
    id: 'vaults',
    title: 'Vault Management',
    icon: Key,
    permissions: [
      { key: 'VAULT_READ', label: 'View Vaults', description: 'Browse and view available organization vaults' },
      { key: 'VAULT_CREATE', label: 'Create Vaults', description: 'Initialize new secure credential vaults' },
      { key: 'VAULT_UPDATE', label: 'Update Vault Details', description: 'Modify vault name and description' },
      { key: 'VAULT_DELETE', label: 'Delete Vaults', description: 'Permanently delete a vault and all contained credentials' },
    ],
  },
  {
    id: 'secrets',
    title: 'Secret & Credential Operations',
    icon: Lock,
    permissions: [
      { key: 'SECRET_READ', label: 'View Secret Metadata', description: 'See secret names and metadata without revealing plaintext' },
      { key: 'SECRET_CREATE', label: 'Add Secrets', description: 'Store new credentials into existing vaults' },
      { key: 'SECRET_UPDATE', label: 'Edit Secrets', description: 'Update credential usernames, passwords, or notes' },
      { key: 'SECRET_DELETE', label: 'Delete Secrets', description: 'Remove individual credentials from a vault' },
      { key: 'SECRET_REVEAL', label: 'Reveal Secret Plaintext', description: 'Decrypt and reveal secret values directly in dashboard' },
    ],
  },
  {
    id: 'integrations',
    title: 'Platform Integrations',
    icon: Plug2,
    permissions: [
      { key: 'INTEGRATION_READ', label: 'View Connected Integrations', description: 'See active OAuth connections and custom portal configs' },
      { key: 'INTEGRATION_CONNECT', label: 'Connect Platforms', description: 'Authorize new OAuth integrations (Gmail, GitHub, Vercel)' },
      { key: 'INTEGRATION_DISCONNECT', label: 'Disconnect Platforms', description: 'Revoke connected platform integrations' },
    ],
  },
  {
    id: 'sessions',
    title: 'Delegated Sessions',
    icon: Clock,
    permissions: [
      { key: 'SESSION_START', label: 'Request / Use Delegated Access', description: 'Start authorized browser extension fill sessions' },
      { key: 'SESSION_REVOKE', label: 'Grant & Revoke Sessions', description: 'Directly issue delegated access or revoke active sessions' },
    ],
  },
  {
    id: 'approvals',
    title: 'Access Request Approvals',
    icon: CheckSquare,
    permissions: [
      { key: 'APPROVAL_READ', label: 'View Access Requests', description: 'Read incoming and outgoing access approval requests' },
      { key: 'APPROVAL_APPROVE', label: 'Approve Access Requests', description: 'Authorize delegated session access requests' },
      { key: 'APPROVAL_REJECT', label: 'Reject Access Requests', description: 'Decline delegated session access requests' },
    ],
  },
  {
    id: 'presence',
    title: 'Real-time Activity & Presence',
    icon: Activity,
    permissions: [
      { key: 'PRESENCE_READ', label: 'View Live Activity Monitor', description: 'Monitor real-time team extension heartbeats and active sessions' },
    ],
  },
  {
    id: 'audit',
    title: 'Security Audit Log',
    icon: FileText,
    permissions: [
      { key: 'AUDIT_READ', label: 'View Audit Logs', description: 'Inspect immutable historical security audit events' },
    ],
  },
];

export default function PermissionMatrixPage() {
  const { organization } = useAuth();
  const currentRole: OrgRole = (organization?.role as OrgRole) || 'MEMBER';

  const roles: { id: OrgRole; title: string; icon: React.ElementType; badgeStyle: string; cardBorder: string }[] = [
    {
      id: 'OWNER',
      title: 'Owner',
      icon: Crown,
      badgeStyle: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
      cardBorder: 'border-amber-400/40 dark:border-amber-600/40',
    },
    {
      id: 'ADMIN',
      title: 'Admin',
      icon: UserCheck,
      badgeStyle: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
      cardBorder: 'border-indigo-400/40 dark:border-indigo-600/40',
    },
    {
      id: 'MEMBER',
      title: 'Member',
      icon: User,
      badgeStyle: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700',
      cardBorder: 'border-slate-300 dark:border-zinc-700',
    },
  ];

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest mb-2">
              <Shield className="w-3 h-3 text-indigo-500" />
              Access Control Policy
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Role Permission Matrix
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Deterministic breakdown of role-based capabilities across your workspace.
            </p>
          </div>

          {/* Current Role Banner */}
          <div className="flex items-center gap-3 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 px-4 py-2.5 rounded-full shadow-sm">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Your Active Role:</span>
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border uppercase tracking-wider',
                roles.find((r) => r.id === currentRole)?.badgeStyle || 'bg-zinc-100 text-zinc-800 border-zinc-200'
              )}
            >
              {currentRole === 'OWNER' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
              {currentRole === 'ADMIN' && <UserCheck className="w-3.5 h-3.5 text-indigo-500" />}
              {currentRole === 'MEMBER' && <User className="w-3.5 h-3.5 text-zinc-400" />}
              {currentRole}
            </span>
          </div>
        </div>

        {/* Role Cards Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={clsx(
              'rounded-[24px] border p-6 transition-all relative backdrop-blur-xl',
              currentRole === 'OWNER' 
                ? 'border-amber-500/30 bg-amber-500/[0.03] shadow-[0_8px_30px_rgb(245,158,11,0.06)]' 
                : 'border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03]'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Crown className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Workspace Owner</h3>
              </div>
              {currentRole === 'OWNER' && (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  YOUR ROLE
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Full control over all organizational assets, billing, vault deletion, workspace configuration, and member role assignment.
            </p>
          </div>

          <div
            className={clsx(
              'rounded-[24px] border p-6 transition-all relative backdrop-blur-xl',
              currentRole === 'ADMIN' 
                ? 'border-indigo-500/30 bg-indigo-500/[0.03] shadow-[0_8px_30px_rgb(99,102,241,0.06)]' 
                : 'border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03]'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Administrator</h3>
              </div>
              {currentRole === 'ADMIN' && (
                <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  YOUR ROLE
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Trusted operational lead. Manages vaults, secrets, integrations, invites, and approvals. Cannot delete vaults or change member roles.
            </p>
          </div>

          <div
            className={clsx(
              'rounded-[24px] border p-6 transition-all relative backdrop-blur-xl',
              currentRole === 'MEMBER' 
                ? 'border-zinc-400/40 bg-zinc-500/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)]' 
                : 'border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03]'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Team Member</h3>
              </div>
              {currentRole === 'MEMBER' && (
                <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-white/10">
                  YOUR ROLE
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Standard consumer access. Can view permitted vaults, request delegated credential sessions, and browse team directory.
            </p>
          </div>
        </div>

        {/* Permission Table */}
        <div className="rounded-[28px] border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/60 dark:border-white/10 bg-zinc-50/60 dark:bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-4 px-6 min-w-[300px]">Capability & Resource Scope</th>
                  {roles.map((r) => {
                    const isCurrent = currentRole === r.id;
                    return (
                      <th
                        key={r.id}
                        className={clsx(
                          'py-4 px-6 text-center w-40 transition-colors border-l border-zinc-200/40 dark:border-white/5',
                          isCurrent && 'bg-zinc-100/50 dark:bg-white/[0.04] text-zinc-900 dark:text-white font-bold'
                        )}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <r.icon className="w-3.5 h-3.5" />
                          <span>{r.title}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-white/10 text-xs">
                {PERMISSION_GROUPS.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <React.Fragment key={group.id}>
                      {/* Group Section Header */}
                      <tr className="bg-zinc-50/80 dark:bg-white/[0.02] border-y border-zinc-200/60 dark:border-white/10 font-semibold">
                        <td colSpan={4} className="py-3 px-6">
                          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                            <GroupIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            <span>{group.title}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Group Permission Rows */}
                      {group.permissions.map((perm) => (
                        <tr key={perm.key} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-zinc-900 dark:text-white text-xs">{perm.label}</div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{perm.description}</div>
                          </td>

                          {roles.map((r) => {
                            const isAllowed = hasPermission(r.id, perm.key);
                            const isCurrentRole = currentRole === r.id;
                            return (
                              <td
                                key={r.id}
                                className={clsx(
                                  'py-4 px-6 text-center align-middle transition-colors border-l border-zinc-200/40 dark:border-white/5',
                                  isCurrentRole && 'bg-zinc-50/30 dark:bg-white/[0.02]'
                                )}
                              >
                                <div className="flex justify-center items-center">
                                  {isAllowed ? (
                                    <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-[11px]">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>Allowed</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-medium bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-zinc-200/60 dark:border-white/5 text-[11px]">
                                      <XCircle className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
                                      <span>Restricted</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
