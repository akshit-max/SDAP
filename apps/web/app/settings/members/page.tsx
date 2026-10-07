'use client';

import React, { useState } from 'react';
import { DashboardShell } from '../../../components/layout/DashboardShell';
import { useAuth } from '../../../lib/auth/AuthContext';
import {
  useOrgMembers,
  useInviteMember,
  useOrgInvitations,
  useCancelInvitation,
  useChangeMemberRole,
  useRemoveMember,
  useOffboardMember,
} from '../../../hooks/useOrganization';
import { useComplianceStatus } from '../../../hooks/useBilling';
import { Loading } from '../../../components/common/Loading';
import { formatDate } from '../../../lib/formatters';
import { useToast } from '../../../components/common/Toast';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { CreateSessionModal } from '../../../components/sessions/CreateSessionModal';
import { DowngradeCleanupBanner } from '../../../components/compliance/DowngradeCleanupBanner';
import {
  UserPlus,
  Users,
  Shield,
  Crown,
  User,
  Loader2,
  Mail,
  Trash2,
  Clock,
  Copy,
  Check,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ShieldOff,
  ShieldAlert,
  Key,
  GitBranch,
  Globe,
  ArrowRight,
  Search,
  UserX,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { hasPermission } from '../../../lib/auth/permissions';

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Crown className="w-3 h-3 text-amber-500" />,
  ADMIN: <Shield className="w-3 h-3 text-indigo-500" />,
  MEMBER: <User className="w-3 h-3 text-slate-400" />,
};

const roleBadge: Record<string, string> = {
  OWNER: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30',
  ADMIN: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-900/30',
  MEMBER: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const sessionStatusBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50',
  EXPIRED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
  REVOKED: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200/50',
  REVOKE_FAILED: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50',
};

function Avatar({ name, email }: { name?: string; email?: string }) {
  const label = (name || email || '?')[0]?.toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}

function ResourceIcon({ provider }: { provider?: string | null }) {
  if (provider === 'GITHUB') return <GitBranch className="w-3 h-3 text-slate-500" />;
  if (provider === 'GODADDY') return <Globe className="w-3 h-3 text-slate-500" />;
  return <Key className="w-3 h-3 text-slate-500" />;
}


export default function MembersPage() {
  const router = useRouter();
  const { organization, user } = useAuth();
  const orgId = organization?.id || '';
  const currentUserId = user?.id || '';

  const { data: members = [], isLoading } = useOrgMembers(orgId);
  const { data: invitations = [] } = useOrgInvitations(orgId);
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember(orgId);
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation(orgId);
  const { mutate: changeRole } = useChangeMemberRole(orgId);
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember(orgId);
  const { mutate: offboardMember, isPending: isOffboarding } = useOffboardMember(orgId);
  const { toast } = useToast();

  // ── Downgrade cleanup: fetch compliance status to detect over-limit state
  // Only fires when orgId is available. Lightweight read-only call.
  const { status: complianceStatus } = useComplianceStatus(orgId || null);

  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [grantAccessMemberId, setGrantAccessMemberId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; email?: string } | null>(null);
  const [confirmOffboard, setConfirmOffboard] = useState<{ memberId: string; email?: string; name?: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentMember = members.find((m: any) => m.userId === currentUserId);
  const role = currentMember?.role as string | undefined;
  const canInvite     = hasPermission(role, 'MEMBER_INVITE');      // OWNER + ADMIN
  const canRemove     = hasPermission(role, 'MEMBER_REMOVE');      // OWNER + ADMIN
  const canChangeRole = hasPermission(role, 'MEMBER_UPDATE_ROLE'); // OWNER only

  const filteredMembers = members.filter((member: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = member.user?.fullName?.toLowerCase() || '';
    const emailStr = member.user?.email?.toLowerCase() || '';
    return name.includes(term) || emailStr.includes(term);
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMember(email.trim(), {
      onSuccess: (data) => {
        toast('success', `Invitation sent to ${email}.`);
        if (data?.data?.rawToken) setInviteToken(data.data.rawToken);
        setEmail('');
      },
      onError: (err) => toast('error', err.message || 'Failed to send invitation.'),
    });
  };

  const handleCopyInvite = (inviteId: string, token?: string, email?: string) => {
    if (token) {
      const link = `${window.location.origin}/invite/${token}`;
      navigator.clipboard.writeText(link).then(() => {
        setCopiedInviteId(inviteId);
        setTimeout(() => setCopiedInviteId(null), 2000);
      });
    } else if (email) {
      inviteMember(email, {
        onSuccess: (data) => {
          if (data?.data?.rawToken) {
            const link = `${window.location.origin}/invite/${data.data.rawToken}`;
            navigator.clipboard.writeText(link).then(() => {
              setCopiedInviteId(inviteId);
              toast('success', 'New invite link copied to clipboard.');
              setTimeout(() => setCopiedInviteId(null), 2000);
            });
          }
        },
        onError: () => toast('error', 'Failed to generate a new invite link.'),
      });
    }
  };

  const handleResendInvite = (email: string) => {
    inviteMember(email, {
      onSuccess: () => toast('success', `Invitation resent to ${email}.`),
      onError: (err) => toast('error', err.message || 'Failed to resend invitation.'),
    });
  };

  const handleCancelInvitation = (inviteId: string) => {
    cancelInvitation(inviteId, {
      onSuccess: () => toast('success', 'Invitation cancelled.'),
      onError: (err) => toast('error', err.message || 'Failed to cancel invitation.'),
    });
  };

  const handleChangeRole = (memberId: string, role: 'ADMIN' | 'MEMBER') => {
    changeRole(
      { memberId, role },
      {
        onSuccess: () => toast('success', 'Role updated successfully.'),
        onError: (err) => toast('error', err.message || 'Failed to update role.'),
      },
    );
  };

  const handleRemoveMember = (memberId: string, memberEmail?: string) => {
    setConfirmRemove({ memberId, email: memberEmail });
  };

  const handleRemoveConfirmed = () => {
    if (!confirmRemove) return;
    const { memberId } = confirmRemove;
    setConfirmRemove(null);
    removeMember(memberId, {
      onSuccess: () => toast('success', 'Member removed.'),
      onError: (err) => toast('error', err.message || 'Failed to remove member.'),
    });
  };

  const handleOffboardMember = (memberId: string, memberEmail?: string, memberName?: string) => {
    setConfirmOffboard({ memberId, email: memberEmail, name: memberName });
  };

  const handleOffboardConfirmed = () => {
    if (!confirmOffboard) return;
    const { memberId, email, name } = confirmOffboard;
    setConfirmOffboard(null);
    offboardMember(memberId, {
      onSuccess: (data: any) => {
        const label = name || email || 'Member';
        toast('success', `${label} offboarded. ${data?.sessionsRevoked ?? 0} session(s) revoked.`);
      },
      onError: (err: any) => toast('error', err.message || 'Failed to offboard member.'),
    });
  };

  const pendingInvitations = invitations.filter((inv: { status: string }) => inv.status === 'PENDING');

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="pb-2 border-b border-premium">
          <h1 className="text-lg font-bold tracking-tight text-premium-main">Team Members</h1>
          <p className="text-xs text-premium-muted mt-0.5">
            Manage who has access to <span className="font-semibold">{organization?.name}</span>.
          </p>
        </div>

        {/* ── Downgrade cleanup banner — only visible to OWNER when over limit ── */}
        {canRemove && complianceStatus && complianceStatus.activeUserCount > complianceStatus.userLimit && (
          <DowngradeCleanupBanner
            activeUserCount={complianceStatus.activeUserCount}
            userLimit={complianceStatus.userLimit}
            members={members}
            currentUserId={currentUserId}
            isOffboarding={isOffboarding}
            onOffboardMember={handleOffboardMember}
          />
        )}

        {/* ── Invite Form ──────────────────────────────────────────────── */}
        {canInvite && (
          <div className="premium-card p-5 shadow-none">
            <h2 className="text-[10px] font-bold text-premium-main uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-premium-muted" />
              Invite a Member
            </h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-premium-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-9 pr-4 py-2 premium-input text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={isInviting || !email.trim()}
                className="premium-button-primary"
              >
                {isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Invite'}
              </button>
            </form>

            {inviteToken && (
              <div className="mt-4 p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 relative transition-all animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Share Invite Link
                  </p>
                  <button
                    onClick={() => setInviteToken(null)}
                    className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-white/60 dark:bg-zinc-950/80 p-2 border border-amber-500/20">
                  <p className="text-xs font-mono text-amber-900 dark:text-amber-200 break-all flex-1 select-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/invite/{inviteToken}
                  </p>
                  <button
                    onClick={() => handleCopyInvite('new', inviteToken)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-zinc-950 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedInviteId === 'new' ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Pending Invitations ──────────────────────────────────────── */}
        {canInvite && pendingInvitations.length > 0 && (
          <div className="premium-card overflow-hidden shadow-none">
            <div className="px-5 py-3 border-b border-premium bg-slate-50/20 dark:bg-zinc-900/10 flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-premium-main uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Invitations
              </h2>
              <span className="text-[10px] text-amber-550 font-bold uppercase tracking-wider">
                {pendingInvitations.length} awaiting response
              </span>
            </div>
            <ul className="divide-y divide-premium">
              {pendingInvitations.map((inv: { id: string; email: string; createdAt: string; expiresAt: string }) => {
                const isExpired = new Date() > new Date(inv.expiresAt);
                const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                <li
                  key={inv.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/30 dark:hover:bg-zinc-900/10 transition-colors border-b border-premium/65 last:border-b-0 bg-premium-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-red-100 dark:bg-red-950/20' : 'bg-amber-100 dark:bg-amber-950/20'}`}>
                      <Mail className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-premium-main">
                        {inv.email}
                      </p>
                      <p className="text-[10px] text-premium-muted font-semibold">
                        Invited {formatDate(inv.createdAt)}
                        <span className="mx-1.5">•</span>
                        {isExpired ? (
                          <span className="text-red-500 font-bold">Expired</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-500 font-bold">Expires in {daysLeft} days</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyInvite(inv.id, undefined, inv.email)}
                      title="Copy invite link"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                    >
                      {copiedInviteId === inv.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleResendInvite(inv.email)}
                      title="Resend invitation"
                      className="p-1.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 rounded transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      disabled={isCancelling}
                      title="Cancel invitation"
                      className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              )})}
            </ul>
          </div>
        )}

        {/* ── Current Members ──────────────────────────────────────────── */}
        <div className="premium-card shadow-none">
          <div className="px-5 py-3 border-b border-premium bg-slate-50/20 dark:bg-zinc-900/10 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-premium-main uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-premium-muted" />
              Current Members
            </h2>
            <span className="text-[10px] text-premium-muted font-bold uppercase tracking-wider">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="px-5 py-3 border-b border-premium bg-premium-surface">
            <div className="relative">
              <Search className="w-4 h-4 text-premium-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search team members by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-600 transition-shadow text-premium-main placeholder:text-premium-muted"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 bg-premium-surface">
              <Loading message="Loading members…" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-premium-muted text-sm bg-premium-surface">
              No members match your search.
            </div>
          ) : (
            <ul className="divide-y divide-premium">
              {filteredMembers.map((member: any) => {
                const isOwner = member.role === 'OWNER';
                const isSelf = member.userId === currentUserId;
                const canEdit = canRemove && !isOwner && !isSelf;
                return (
                  <li key={member.id} className={`border-b border-premium/65 last:border-b-0 bg-premium-surface ${openMenuId === member.id ? 'relative z-20' : ''}`}>
                    {/* ── Member Row ── */}
                    <div
                      className="px-5 py-3.5 flex items-center justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                    >
                      {/* Left: Avatar + Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={member.user?.fullName} email={member.user?.email} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-premium-main truncate">
                            {member.user?.fullName || '—'}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] font-bold text-premium-muted">(you)</span>
                            )}
                          </p>
                          <p className="text-[10px] text-premium-muted font-semibold truncate">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Right: Role + Expand chevron + Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {/* Role badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            roleBadge[member.role] || roleBadge['MEMBER']
                          }`}
                        >
                          {roleIcons[member.role]}
                          {member.role}
                        </span>

                        {/* Expand toggle (admin/owner view) */}
                        {canInvite && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/settings/members/' + member.userId);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            View Access
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {/* Three-dot menu for edit/remove */}
                        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                          {canEdit && (
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === member.id && (
                                 <>
                                   <div
                                     className="fixed inset-0 z-40"
                                     onClick={() => setOpenMenuId(null)}
                                   />
                                   <div className="absolute right-0 mt-1 w-52 bg-premium-surface border border-premium rounded-lg shadow-xl overflow-hidden z-50 py-1.5">
                                     {/* Promote / Demote — OWNER only */}
                                     {canChangeRole && member.role === 'MEMBER' && (
                                       <button
                                         onClick={() => {
                                           handleChangeRole(member.id, 'ADMIN');
                                           setOpenMenuId(null);
                                         }}
                                         className="w-full text-left px-3.5 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 flex items-center gap-2.5 whitespace-nowrap transition-colors"
                                       >
                                         <Shield className="w-4 h-4 flex-shrink-0" />
                                         <span>Promote to Admin</span>
                                       </button>
                                     )}
                                     {canChangeRole && member.role === 'ADMIN' && (
                                       <button
                                         onClick={() => {
                                           handleChangeRole(member.id, 'MEMBER');
                                           setOpenMenuId(null);
                                         }}
                                         className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 whitespace-nowrap transition-colors"
                                       >
                                         <ShieldOff className="w-4 h-4 flex-shrink-0" />
                                         <span>Demote to Member</span>
                                       </button>
                                     )}
                                     {canChangeRole && (
                                       <div className="border-t border-premium my-1" />
                                     )}
                                     {canRemove && (
                                       <button
                                         onClick={() => {
                                           handleOffboardMember(member.id, member.user?.email, member.user?.fullName);
                                           setOpenMenuId(null);
                                         }}
                                         disabled={isOffboarding}
                                         className="w-full text-left px-3.5 py-2 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 disabled:opacity-50 flex items-center gap-2.5 whitespace-nowrap transition-colors"
                                       >
                                         <UserX className="w-4 h-4 flex-shrink-0" />
                                         <span>Offboard Employee</span>
                                       </button>
                                     )}
                                     {canRemove && (
                                       <>
                                         <div className="border-t border-premium my-1" />
                                         <button
                                           onClick={() => {
                                             handleRemoveMember(member.id, member.user?.email);
                                             setOpenMenuId(null);
                                           }}
                                           disabled={isRemoving}
                                           className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 flex items-center gap-2.5 whitespace-nowrap transition-colors"
                                         >
                                           <Trash2 className="w-4 h-4 flex-shrink-0" />
                                           <span>Remove Member</span>
                                         </button>
                                       </>
                                     )}
                                   </div>
                                 </>
                               )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>


                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Grant Access Modal — pre-filled with selected member */}
      {grantAccessMemberId && (
        <CreateSessionModal
          orgId={orgId}
          isOpen={!!grantAccessMemberId}
          onClose={() => setGrantAccessMemberId(null)}
          preselectedGranteeId={grantAccessMemberId}
        />
      )}

      {/* Member Removal Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmRemove}
        title="Remove Member"
        message={`Remove ${confirmRemove?.email || 'this member'} from the organization? They will lose all access immediately.`}
        confirmLabel="Remove"
        danger
        isPending={isRemoving}
        onConfirm={handleRemoveConfirmed}
        onCancel={() => setConfirmRemove(null)}
      />

      {/* Offboard Employee Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmOffboard}
        title="Offboard Employee"
        message={`This will permanently offboard ${confirmOffboard?.name || confirmOffboard?.email || 'this member'} from WITHUS:\n\n• Revoke all active delegated sessions\n• Invalidate all refresh tokens (login sessions)\n• Cancel any pending approval requests\n• Remove from this organization\n\nNote: External portals (GitHub, Vercel, etc.) that WITHUS granted access to will have that access revoked. Any short-lived access JWTs (≤15 min) may briefly remain valid until expiry.`}
        confirmLabel="Offboard Now"
        danger
        isPending={isOffboarding}
        onConfirm={handleOffboardConfirmed}
        onCancel={() => setConfirmOffboard(null)}
      />
    </DashboardShell>
  );
}

