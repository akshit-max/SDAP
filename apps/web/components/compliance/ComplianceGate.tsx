"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthContext";
import {
  billingApi,
  WITHUS_VAULT_PLATFORMS,
  PLATFORM_LABELS,
  ComplianceStatusResponse,
  VaultPlatformId,
} from "../../lib/api/billing";
import { AlertTriangle, Lock, Check, Clock, Crown, ArrowRight, Loader2 } from "lucide-react";
import clsx from "clsx";

/**
 * Returns how many days remain until selectionLockedUntil expires.
 * Returns null if no lock exists or lock has already expired.
 * Backend is authoritative — this is display-only.
 */
function getDaysUntilUnlock(lockedUntil: string | null): number | null {
  if (!lockedUntil) return null;
  const diff = new Date(lockedUntil).getTime() - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * ComplianceGate
 *
 * Renders a full-screen modal when a FREE org has complianceState===PLATFORM_SELECTION_REQUIRED.
 * The user must select exactly 2 platforms before the modal dismisses.
 *
 * Placement: inside layout.tsx, wrapped in AuthProvider so it has access to orgId.
 * Only shown to authenticated users on FREE plan who have not yet confirmed platforms.
 * PRO/BUSINESS orgs always get complianceState=COMPLIANT and never see this modal.
 */
export default function ComplianceGate() {
  const { organization, user, isLoading } = useAuth();
  const pathname = usePathname();
  const [status, setStatus] = useState<ComplianceStatusResponse | null>(null);
  const [selected, setSelected] = useState<VaultPlatformId[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!organization?.id || !user || isLoading) return;
    billingApi
      .getComplianceStatus(organization.id)
      .then(setStatus)
      .catch(() => setFetchError(true));
  }, [organization?.id, user, isLoading]);

  // Exempt pages — these are always accessible regardless of compliance state.
  // /pricing   → escape route to upgrade
  // /settings/members → owner manages cleanup here; detailed banner already shown
  const isExemptPage = pathname === "/pricing" || pathname === "/settings/members";

  // ── Member-over-limit blocking gate ─────────────────────────────────────────
  // Shown before the platform-selection gate so a downgraded org with BOTH issues
  // sees member cleanup first (it is the harder blocker — platform selection can
  // happen immediately, member removal requires human action).
  // Skipped on /pricing and /settings/members.
  const isOverMemberLimit =
    status !== null &&
    status.activeUserCount > status.userLimit &&
    !isLoading &&
    !!organization?.id &&
    !!user &&
    !fetchError &&
    !isExemptPage;

  if (isOverMemberLimit && status) {
    const overage = status.activeUserCount - status.userLimit;
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/80 dark:bg-black/85 backdrop-blur-sm"
        aria-modal="true"
        role="dialog"
        aria-labelledby="member-limit-title"
      >
        <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Badge + Header */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p
                id="member-limit-title"
                className="text-sm font-bold text-slate-900 dark:text-slate-100"
              >
                Action Required — Plan Limit Exceeded
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your {status.plan} plan limit has been reached
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
            <p>
              Your <strong className="font-semibold text-slate-900 dark:text-slate-100">FREE plan</strong> allows up to{" "}
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {status.userLimit} active member{status.userLimit !== 1 ? "s" : ""}
              </strong>.
            </p>
            <p>
              Your organization currently has{" "}
              <strong className="font-semibold text-red-600 dark:text-red-400">
                {status.activeUserCount} active members
              </strong>.
            </p>
            <p className="pt-1.5 text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-zinc-800/80 mt-2">
              Please remove <strong className="font-semibold text-red-600 dark:text-red-400">{overage} member{overage !== 1 ? "s" : ""}</strong> to restore access.
            </p>
          </div>

          {/* Owner protection notice */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 my-4 font-medium">
            <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Owner account is protected and cannot be removed.</span>
          </div>

          {/* CTA */}
          <a
            href="/settings/members"
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
          >
            <span>Manage Members</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <p className="text-center mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Or{" "}
            <a
              href="/pricing"
              className="font-semibold text-slate-900 dark:text-slate-100 hover:underline"
            >
              upgrade to PRO
            </a>{" "}
            to increase your member limit.
          </p>
        </div>
      </div>
    );
  }

  // ── Platform-selection gate ──────────────────────────────────────────────────
  // Not shown: loading, unauthenticated, fetch failure, PRO/BUSINESS, already COMPLIANT, or exempt pages.
  if (
    isLoading ||
    !organization?.id ||
    !user ||
    fetchError ||
    !status ||
    status.complianceState !== "PLATFORM_SELECTION_REQUIRED" ||
    isExemptPage
  ) {
    return null;
  }

  const togglePlatform = (pid: VaultPlatformId) => {
    setSelected((prev: VaultPlatformId[]) =>
      prev.includes(pid)
        ? prev.filter((p: VaultPlatformId) => p !== pid)
        : prev.length < 2
        ? [...prev, pid]
        : prev
    );
    setError(null);
  };

  const handleConfirm = async () => {
    if (selected.length !== 2) {
      setError("Please select exactly 2 platforms.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await billingApi.confirmPlatformSelection(organization.id, selected);
      setStatus((prev: ComplianceStatusResponse | null) =>
        prev ? { ...prev, complianceState: "COMPLIANT" as const, selectedPlatforms: selected } : null
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/80 dark:bg-black/85 backdrop-blur-sm cursor-default">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-7 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 mb-3">
            <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Free Plan Setup</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Choose Your 2 Platforms
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Your Free plan includes access to{" "}
            <strong className="font-semibold text-slate-900 dark:text-slate-200">2 platforms</strong>.
            Select the ones you want to store credentials for. You can change this selection once every 15 days.
          </p>

          {/* 15-day countdown banner — shown when selectionLockedUntil is present */}
          {(() => {
            const daysLeft = getDaysUntilUnlock(status?.selectionLockedUntil ?? null);
            if (daysLeft === null) return null;
            return (
              <div className="mt-3.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  You can re-select platforms again in{" "}
                  <strong className="font-semibold">{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.
                  Your current selection is locked until{" "}
                  {new Date(status!.selectionLockedUntil!).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "short", year: "numeric" }
                  )}.
                </span>
              </div>
            );
          })()}
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {WITHUS_VAULT_PLATFORMS.map((pid) => {
            const isSelected = selected.includes(pid);
            const isDisabled = !isSelected && selected.length === 2;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => togglePlatform(pid)}
                disabled={isDisabled || submitting}
                className={clsx(
                  "py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold",
                  isSelected
                    ? "border-2 border-slate-900 dark:border-slate-100 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm"
                    : isDisabled
                    ? "opacity-40 cursor-not-allowed border border-slate-200 dark:border-zinc-800/60 bg-slate-50 dark:bg-zinc-900/20 text-slate-400 dark:text-zinc-600"
                    : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{PLATFORM_LABELS[pid]}</span>
              </button>
            );
          })}
        </div>

        {/* Selection count */}
        <div className="flex items-center justify-between text-xs font-medium mb-4">
          <span
            className={clsx(
              "transition-colors",
              selected.length === 2
                ? "text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1"
                : "text-slate-500 dark:text-slate-400"
            )}
          >
            {selected.length === 2 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>
                  {PLATFORM_LABELS[selected[0] as VaultPlatformId]} &{" "}
                  {PLATFORM_LABELS[selected[1] as VaultPlatformId]} selected
                </span>
              </>
            ) : (
              <span>{selected.length}/2 selected</span>
            )}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.length !== 2 || submitting}
          className={clsx(
            "w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2",
            selected.length === 2 && !submitting
              ? "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 cursor-pointer"
              : "bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-600 cursor-not-allowed border border-slate-200 dark:border-zinc-800"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirming...</span>
            </>
          ) : (
            <span>Confirm Platform Selection</span>
          )}
        </button>

        {/* Upgrade nudge */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
          Want all 11 platforms?{" "}
          <a
            href="/pricing"
            className="font-semibold text-slate-900 dark:text-slate-100 hover:underline inline-flex items-center gap-0.5"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
