'use client';

/**
 * DowngradeCleanupBanner
 *
 * Shows a targeted downgrade cleanup warning when the org is over its plan's
 * active user limit. This happens when a PRO/BUSINESS subscription expires and
 * the org has more members than the FREE plan allows (limit = 2).
 *
 * Rules:
 *  - Only shown to the OWNER (canRemove check in parent ensures this).
 *  - Reads activeUserCount / userLimit from ComplianceStatusResponse (no extra API call).
 *  - Actual enforcement is backend-side (assertNotOverUserLimit). This banner
 *    is purely informational and facilitates cleanup by surfacing the right members.
 *  - OWNER members are NEVER listed as removable (preserved by isOwner filter below).
 *  - Uses existing offboardMember mutation from the parent — no new API dependency.
 *  - Disappears automatically when activeUserCount <= userLimit (re-fetched after removal).
 */

import React from 'react';
import { AlertTriangle, UserX, Loader2, Crown } from 'lucide-react';
import type { OrganizationMember } from '../../lib/api/organizations';

interface DowngradeCleanupBannerProps {
  activeUserCount: number;
  userLimit: number;
  members: OrganizationMember[];
  currentUserId: string;
  isOffboarding: boolean;
  onOffboardMember: (memberId: string, email?: string, name?: string) => void;
}

export function DowngradeCleanupBanner({
  activeUserCount,
  userLimit,
  members,
  currentUserId,
  isOffboarding,
  onOffboardMember,
}: DowngradeCleanupBannerProps) {
  const overage = activeUserCount - userLimit;

  // Never show if within limit.
  if (overage <= 0) return null;

  // Eligible members = non-OWNER, non-self members that can be offboarded.
  // OWNERs are NEVER listed — backend also protects this; we just match the UX.
  const eligibleForRemoval = members.filter(
    (m: any) => m.role !== 'OWNER' && m.userId !== currentUserId,
  );

  return (
    <div
      role="alert"
      aria-live="polite"
      className="p-5 mb-6 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 leading-tight">
            Action Required — Over Plan Limit
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Your Free plan allows up to{' '}
            <strong className="font-semibold text-slate-900 dark:text-slate-100">
              {userLimit} active member{userLimit !== 1 ? 's' : ''}
            </strong>
            . Your organization currently has{' '}
            <strong className="font-semibold text-red-600 dark:text-red-300">{activeUserCount} active members</strong>. Please
            remove{' '}
            <strong className="font-semibold text-red-600 dark:text-red-400">
              {overage} member{overage !== 1 ? 's' : ''}
            </strong>{' '}
            to restore full access.
          </p>
        </div>
      </div>

      {/* What is blocked */}
      <div className="mt-3.5 p-3 rounded-xl bg-white/70 dark:bg-zinc-950/60 border border-red-200/50 dark:border-red-900/30 text-xs text-slate-600 dark:text-slate-400">
        <strong className="block text-red-700 dark:text-red-300 font-semibold mb-0.5">
          Currently blocked until cleanup:
        </strong>
        Creating Vaults · Revealing Secrets · Creating Sessions · API-key Secret Access
      </div>

      {/* Eligible members list */}
      {eligibleForRemoval.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Members you can remove ({eligibleForRemoval.length}):
          </p>
          <ul className="space-y-2">
            {eligibleForRemoval.map((member: any) => (
              <li
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 gap-3 shadow-xs"
              >
                {/* Avatar + name/email */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {(
                        (member.user?.fullName || member.user?.email || '?')[0] ?? '?'
                      ).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {member.user?.fullName || '—'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {member.user?.email}
                    </p>
                  </div>
                </div>

                {/* Offboard button */}
                <button
                  id={`cleanup-offboard-${member.id}`}
                  onClick={() =>
                    onOffboardMember(member.id, member.user?.email, member.user?.fullName)
                  }
                  disabled={isOffboarding}
                  title={`Offboard ${member.user?.fullName || member.user?.email}`}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isOffboarding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserX className="w-3.5 h-3.5" />
                  )}
                  <span>Offboard</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // Edge case: all non-owner members already removed but count is still over limit.
        <div className="mt-3.5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
          No non-owner members available to remove. Please contact support if the over-limit
          state persists.
        </div>
      )}

      {/* Owner-protection notice */}
      <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span>Owner account is protected and cannot be removed.</span>
      </div>
    </div>
  );
}
