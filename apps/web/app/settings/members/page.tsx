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
} from '../../../hooks/useOrganization';
import { Loading } from '../../../components/common/Loading';
import { useToast } from '../../../components/common/Toast';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { CreateSessionModal } from '../../../components/sessions/CreateSessionModal';
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
  UserCheck,
  MoreVertical,
} from 'lucide-react';

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Crown className="w-3 h-3 text-amber-500" />,
  ADMIN: <Shield className="w-3 h-3 text-blue-500" />,
  MEMBER: <User className="w-3 h-3 text-slate-400" />,
};

const roleBadge: Record<string, string> = {
  OWNER: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30',
  ADMIN: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30',
  MEMBER: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

function Avatar({ name, email }: { name?: string; email?: string }) {
  const label = (name || email || '?')[0]?.toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
    </div>
  );
}

export default function MembersPage() {
  const { organization, user } = useAuth();
  const orgId = organization?.id || '';
  const currentUserId = user?.id || '';

  const { data: members = [], isLoading } = useOrgMembers(orgId);
  const { data: invitations = [] } = useOrgInvitations(orgId);
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember(orgId);
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation(orgId);
  const { mutate: changeRole, isPending: isChangingRole } = useChangeMemberRole(orgId);
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember(orgId);
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [grantAccessMemberId, setGrantAccessMemberId] = useState<string | null>(null);
  // Confirm modal state for member removal
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; email?: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Determine current user's role for permission gating
  const currentMember = members.find((m) => m.userId === currentUserId);
  const canManage = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';

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
      // Because tokens are securely hashed, we cannot retrieve old links.
      // Generate a new token by re-inviting (upsert) to get a fresh link to copy.
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

  const pendingInvitations = invitations.filter((inv: { status: string }) => inv.status === 'PENDING');

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Team Members</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage who has access to <span className="font-semibold">{organization?.name}</span>.
          </p>
        </div>

        {/* ── Invite Form ──────────────────────────────────────────────── */}
        {canManage && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-400" />
              Invite a Member
            </h2>
            <form onSubmit={handleInvite} className="flex gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-slate-950 dark:text-slate-50 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isInviting || !email.trim()}
                className="flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Invite'}
              </button>
            </form>

            {inviteToken && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  ⚠️ Share this invite link with your colleague:
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-amber-700 dark:text-amber-400 break-all flex-1">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/invite/{inviteToken}
                  </p>
                  <button
                    onClick={() => handleCopyInvite('new', inviteToken)}
                    className="flex-shrink-0 p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  </button>
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2">
                  In production, this link would be sent via email automatically.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Pending Invitations ──────────────────────────────────────── */}
        {canManage && pendingInvitations.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Pending Invitations
              </h2>
              <span className="text-[10px] text-amber-500 font-semibold">
                {pendingInvitations.length} awaiting response
              </span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {pendingInvitations.map((inv: { id: string; email: string; createdAt: string; expiresAt: string }) => {
                const isExpired = new Date() > new Date(inv.expiresAt);
                const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                <li
                  key={inv.id}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isExpired ? 'bg-red-100 dark:bg-red-950/30' : 'bg-amber-100 dark:bg-amber-950/30'}`}>
                      <Mail className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {inv.email}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Invited {new Date(inv.createdAt).toLocaleDateString()}
                        <span className="mx-1.5">•</span>
                        {isExpired ? (
                          <span className="text-red-500 font-medium">Expired</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-500 font-medium">Expires in {daysLeft} days</span>
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Current Members
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="p-6">
              <Loading message="Loading members…" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {members.map((member) => {
                const isOwner = member.role === 'OWNER';
                const isSelf = member.userId === currentUserId;
                const canEdit = canManage && !isOwner && !isSelf;

                return (
                  <li
                    key={member.id}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Left: Avatar + Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={member.user?.fullName} email={member.user?.email} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {member.user?.fullName || '—'}
                          {isSelf && (
                            <span className="ml-1.5 text-[10px] font-normal text-slate-400">(you)</span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>

                    {/* Right: Role + Actions */}
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

                      {/* Manage Access shortcut */}
                      {!isSelf && (
                        <button
                          onClick={() => setGrantAccessMemberId(member.userId)}
                          title="Manage access to a secret"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <UserCheck className="w-3 h-3" />
                          Manage Access
                        </button>
                      )}

                      {/* Three-dot menu for edit/remove */}
                      {canEdit && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openMenuId === member.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)} 
                              />
                              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden z-20 py-1">
                                <button
                                  onClick={() => {
                                    handleChangeRole(member.id, member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN');
                                    setOpenMenuId(null);
                                  }}
                                  disabled={isChangingRole}
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                                >
                                  Change Role
                                </button>
                                <button
                                  onClick={() => {
                                    handleRemoveMember(member.id, member.user?.email);
                                    setOpenMenuId(null);
                                  }}
                                  disabled={isRemoving}
                                  className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                                >
                                  Remove Member
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
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
    </DashboardShell>
  );
}
