'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { usePresence } from '../../hooks/usePresence';
import { useAuth } from '../../lib/auth/AuthContext';
import { Activity, Circle, Users } from 'lucide-react';

// Presence is considered active within this window (mirrors backend: 90 seconds)
const ACTIVE_WINDOW_MS = 90_000;

/** Format seconds → "Xs ago", "Xm ago", "Xh ago" */
function timeAgo(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export default function ActivityPage() {
  const { organization, user } = useAuth();
  const router = useRouter();
  const orgId = organization?.id ?? null;
  const isAdmin =
    organization?.role === 'OWNER' || organization?.role === 'ADMIN';

  // Non-admin members get bounced — presence is admin/owner only
  React.useEffect(() => {
    if (organization && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [organization, isAdmin, router]);

  const { presenceMap, isLoading } = usePresence(orgId, isAdmin);

  // Build a flat list of org members from the presence map keys,
  // plus any members the admin can see from orgContext.
  // We aggregate: userId → { activePlatforms[], mostRecentLastSeenAt }
  const members = useMemo(() => {
    const now = Date.now();
    const result: {
      userId: string;
      activePlatforms: string[];
      lastSeenAt: Date | null;
      lastPlatforms: string[];  // platforms seen at lastSeenAt (for offline label)
      isActive: boolean;
    }[] = [];

    for (const [userId, records] of presenceMap.entries()) {
      const active = records.filter(
        (r) => now - new Date(r.lastSeenAt).getTime() <= ACTIVE_WINDOW_MS,
      );
      const inactive = records.filter(
        (r) => now - new Date(r.lastSeenAt).getTime() > ACTIVE_WINDOW_MS,
      );

      // Most recent lastSeenAt across all records for this user
      const allDates = records.map((r) => new Date(r.lastSeenAt).getTime());
      const mostRecentMs = Math.max(...allDates);
      const mostRecentDate = new Date(mostRecentMs);

      // Which platforms were seen at the most-recent timestamp (±2s tolerance)
      const lastPlatforms = records
        .filter(
          (r) =>
            Math.abs(new Date(r.lastSeenAt).getTime() - mostRecentMs) < 2000,
        )
        .map((r) => r.platform);

      result.push({
        userId,
        activePlatforms: active.map((r) => r.platform),
        lastSeenAt: records.length > 0 ? mostRecentDate : null,
        lastPlatforms,
        isActive: active.length > 0,
      });
    }

    // Sort: active first, then by most-recent lastSeenAt desc
    result.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      const aMs = a.lastSeenAt?.getTime() ?? 0;
      const bMs = b.lastSeenAt?.getTime() ?? 0;
      return bMs - aMs;
    });

    return result;
  }, [presenceMap]);

  const activeCount = members.filter((m) => m.isActive).length;

  if (!isAdmin) return null;

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ─── Header ───────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-5 h-5 text-premium-main" />
            <h1 className="text-xl font-bold text-premium-main tracking-tight">
              Activity
            </h1>
          </div>
          <p className="text-sm text-premium-muted ml-8">
            Monitor delegated platform activity in real time
          </p>
        </div>

        {/* ─── Active-count pill ────────────────────────────────────── */}
        {!isLoading && members.length > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                activeCount > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  activeCount > 0
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              {activeCount > 0
                ? `${activeCount} member${activeCount !== 1 ? 's' : ''} active now`
                : 'No members active'}
            </span>
          </div>
        )}

        {/* ─── Loading skeleton ─────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-premium-surface border border-premium rounded-xl px-5 py-4 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-3 w-44 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Empty state ──────────────────────────────────────────── */}
        {!isLoading && members.length === 0 && (
          <div className="text-center py-16 bg-premium-surface border border-premium rounded-xl">
            <Users className="w-10 h-10 mx-auto mb-3 text-premium-muted opacity-40" />
            <p className="text-sm font-semibold text-premium-muted">
              No activity recorded
            </p>
            <p className="text-xs text-premium-muted mt-1 opacity-70">
              Activity appears here once team members open an assigned platform
              with the WithUs extension active.
            </p>
          </div>
        )}

        {/* ─── Member cards ─────────────────────────────────────────── */}
        {!isLoading && members.length > 0 && (
          <div className="space-y-2">
            {members.map((member) => {
              const now = Date.now();
              const lastSeenMs = member.lastSeenAt
                ? now - member.lastSeenAt.getTime()
                : null;

              return (
                <div
                  key={member.userId}
                  className="bg-premium-surface border border-premium rounded-xl px-5 py-4 transition-all duration-150 hover:border-premium/80 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: user info + platforms */}
                    <div className="min-w-0 flex-1">
                      {/* User ID (replace with name when org-member list is available) */}
                      <p className="text-sm font-bold text-premium-main truncate">
                        {member.userId}
                      </p>

                      {/* Platform pills */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {member.isActive ? (
                          member.activePlatforms.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                              {p}
                            </span>
                          ))
                        ) : (
                          // Offline: show last-seen platform(s) in muted style so
                          // it is visually clear this is HISTORICAL, not current
                          member.lastPlatforms.length > 0 && (
                            <span className="text-xs text-premium-muted italic">
                              Last active on{' '}
                              <span className="font-semibold not-italic">
                                {member.lastPlatforms.join(' · ')}
                              </span>
                              {lastSeenMs !== null && (
                                <> · {timeAgo(lastSeenMs)}</>
                              )}
                            </span>
                          )
                        )}
                        {!member.isActive && member.lastPlatforms.length === 0 && (
                          <span className="text-xs text-premium-muted italic">
                            No activity recorded
                          </span>
                        )}
                      </div>

                      {/* Last-seen for active users */}
                      {member.isActive && lastSeenMs !== null && (
                        <p className="mt-1.5 text-[11px] text-premium-muted">
                          Last seen{' '}
                          <span className="font-semibold">{timeAgo(lastSeenMs)}</span>
                        </p>
                      )}
                    </div>

                    {/* Right: status badge */}
                    <div className="flex-shrink-0 pt-0.5">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Footer note ──────────────────────────────────────────── */}
        <p className="mt-6 text-center text-[11px] text-premium-muted opacity-60">
          Refreshes every 30 seconds · Active = extension heartbeat within 90s
        </p>
      </div>
    </DashboardShell>
  );
}
