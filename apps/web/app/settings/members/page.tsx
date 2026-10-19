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
  OWNER: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  ADMIN: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  MEMBER: 'bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10',
};

const sessionStatusBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  EXPIRED: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700',
  REVOKED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  REVOKE_FAILED: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
};

function Avatar({ name, email }: { name?: string; email?: string }) {
  const label = (name || email || '?')[0]?.toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
      <span>{label}</span>
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
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider mb-0.5">
              ORGANIZATION
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
              Team Members
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-normal">
              Manage member roles, invitations, and access delegation for <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{organization?.name}</span>.
            </p>
          </div>
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
          <div className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h2 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#0071E3]" />
              Invite a Team Member
            </h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868B]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted) {
                      setEmail(pasted.trim());
                    }
                  }}
                  placeholder="colleague@company.com"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E5E5EA] dark:border-[#38383A] bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isInviting || !email.trim()}
                className="px-4 py-2 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
              >
                {isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Invite'}
              </button>
            </form>

            {inviteToken && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 relative transition-all">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
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
                <div className="flex items-center gap-2 bg-white/80 dark:bg-black/40 p-2.5 rounded-xl border border-amber-500/20">
                  <p className="text-xs font-mono text-amber-900 dark:text-amber-200 break-all flex-1 select-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/invite/{inviteToken}
                  </p>
                  <button
                    onClick={() => handleCopyInvite('new', inviteToken)}
                    className="flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 transition-colors flex items-center gap-1.5 shadow-sm"
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
          <div className="rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Invitations
              </h2>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {pendingInvitations.length} awaiting response
              </span>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-white/5">
              {pendingInvitations.map((inv: { id: string; email: string; createdAt: string; expiresAt: string }) => {
                const isExpired = new Date() > new Date(inv.expiresAt);
                const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                <li
                  key={inv.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {inv.email}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                        Invited {formatDate(inv.createdAt)}
                        <span className="mx-1.5">&bull;</span>
                        {isExpired ? (
                          <span className="text-red-500 font-bold">Expired</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">Expires in {daysLeft} days</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyInvite(inv.id, undefined, inv.email)}
                      title="Copy invite link"
                      className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
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
                      className="p-2 text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      disabled={isCancelling}
                      title="Cancel invitation"
                      className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
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
        <div className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="px-6 py-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/40 rounded-t-xl flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0071E3]" />
              Current Members
            </h2>
            <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium bg-[#F5F5F7] dark:bg-[#2C2C2E] px-2 py-0.5 rounded border border-[#E5E5EA] dark:border-[#38383A]">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="px-6 py-3 border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search team members by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 border border-[#E5E5EA] dark:border-[#38383A] focus:outline-none focus:ring-1 focus:ring-[#0071E3] transition-all text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B]"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8">
              <Loading message="Loading members…" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-xs font-medium">
              No members match your search.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-white/5">
              {filteredMembers.map((member: any, index: number) => {
                const isOwner = member.role === 'OWNER';
                const isSelf = member.userId === currentUserId;
                const canEdit = canRemove && !isOwner && !isSelf;
                const isLast = index === filteredMembers.length - 1;
                const isNearBottom = index >= filteredMembers.length - 2;
                return (
                  <li key={member.id} className={`transition-colors ${isLast ? 'rounded-b-xl' : ''} ${openMenuId === member.id ? 'relative z-20' : ''}`}>
                    {/* ── Member Row ── */}
                    <div
                      className={`px-6 py-4 flex items-center justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] ${isLast ? 'rounded-b-xl' : ''}`}
                    >
                      {/* Left: Avatar + Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar name={member.user?.fullName} email={member.user?.email} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {member.user?.fullName || '—'}
                            {isSelf && (
                              <span className="ml-1.5 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">(you)</span>
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium truncate mt-0.5">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Right: Role + Expand chevron + Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        {/* Role badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/15 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.08] hover:text-zinc-950 dark:hover:text-white transition-all shadow-sm"
                          >
                            <span>View Access</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {/* Three-dot menu for edit/remove */}
                        <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                          {canEdit && (
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === member.id && (
                                 <>
                                   <div
                                     className="fixed inset-0 z-40"
                                     onClick={() => setOpenMenuId(null)}
                                   />
                                   <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-1.5' : 'mt-2'} w-52 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-[0_12px_32px_rgba(0,0,0,0.12)] z-50 py-1.5`}>
                                     {/* Promote / Demote — OWNER only */}
                                     {canChangeRole && member.role === 'MEMBER' && (
                                       <button
                                         onClick={() => {
                                           handleChangeRole(member.id, 'ADMIN');
                                           setOpenMenuId(null);
                                         }}
                                         className="w-full text-left px-4 py-2.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 flex items-center gap-2.5 transition-colors"
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
                                         className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors"
                                       >
                                         <ShieldOff className="w-4 h-4 flex-shrink-0" />
                                         <span>Demote to Member</span>
                                       </button>
                                     )}
                                     {canChangeRole && (
                                       <div className="border-t border-zinc-100 dark:border-white/10 my-1" />
                                     )}
                                     {canRemove && (
                                       <button
                                         onClick={() => {
                                           handleOffboardMember(member.id, member.user?.email, member.user?.fullName);
                                           setOpenMenuId(null);
                                         }}
                                         disabled={isOffboarding}
                                         className="w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 disabled:opacity-50 flex items-center gap-2.5 transition-colors"
                                       >
                                         <UserX className="w-4 h-4 flex-shrink-0" />
                                         <span>Offboard Employee</span>
                                       </button>
                                     )}
                                     {canRemove && (
                                       <>
                                         <div className="border-t border-zinc-100 dark:border-white/10 my-1" />
                                         <button
                                           onClick={() => {
                                             handleRemoveMember(member.id, member.user?.email);
                                             setOpenMenuId(null);
                                           }}
                                           disabled={isRemoving}
                                           className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 flex items-center gap-2.5 transition-colors"
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

