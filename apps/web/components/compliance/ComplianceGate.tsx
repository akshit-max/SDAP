"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth/AuthContext";
import {
  billingApi,
  WITHUS_VAULT_PLATFORMS,
  PLATFORM_LABELS,
  ComplianceStatusResponse,
  VaultPlatformId,
} from "../../lib/api/billing";

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
  const [status, setStatus] = useState<ComplianceStatusResponse | null>(null);
  const [selected, setSelected] = useState<VaultPlatformId[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!organization?.id || !user || isLoading) return;

    // Check if user dismissed this session
    const dismissKey = `compliance_dismissed_${organization.id}`;
    if (sessionStorage.getItem(dismissKey) === '1') {
      setDismissed(true);
      return;
    }

    billingApi
      .getComplianceStatus(organization.id)
      .then(setStatus)
      .catch(() => setFetchError(true));
  }, [organization?.id, user, isLoading]);

  const handleDismiss = () => {
    // Store session dismiss — modal re-appears on next browser session
    if (organization?.id) {
      sessionStorage.setItem(`compliance_dismissed_${organization.id}`, '1');
    }
    setDismissed(true);
  };

  // Escape key to dismiss
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleDismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Not shown: loading, unauthenticated, fetch failure, PRO/BUSINESS, already COMPLIANT, or dismissed
  if (
    isLoading ||
    !organization?.id ||
    !user ||
    fetchError ||
    dismissed ||
    !status ||
    status.complianceState !== "PLATFORM_SELECTION_REQUIRED"
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
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "var(--modal-bg, #181c25)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          padding: "2rem 2.5rem",
          maxWidth: "560px",
          width: "100%",
          color: "#e8eaf0",
          position: "relative",
        }}
      >
        {/* Close ✕ button */}
        <button
          onClick={handleDismiss}
          aria-label="Close platform selection"
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "#64748b",
            cursor: "pointer",
            fontSize: "1rem",
            width: "2rem",
            height: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "inherit",
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "8px",
              padding: "0.35rem 0.75rem",
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
              color: "#a5b4fc",
              textTransform: "uppercase",
              marginBottom: "1rem",
              fontWeight: 600,
            }}
          >
            <span>🔒</span> Free Plan Setup
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1.3,
            }}
          >
            Choose Your 2 Platforms
          </h2>
          <p
            style={{
              margin: "0.6rem 0 0",
              fontSize: "0.875rem",
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            Your Free plan includes access to{" "}
            <strong style={{ color: "#e2e8f0" }}>2 platforms</strong>. Select
            the ones you want to store credentials for. You can change this once
            every 15 days.
          </p>
        </div>

        {/* Platform Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.65rem",
            marginBottom: "1.5rem",
          }}
        >
          {WITHUS_VAULT_PLATFORMS.map((pid) => {
            const isSelected = selected.includes(pid);
            const isDisabled = !isSelected && selected.length === 2;
            return (
              <button
                key={pid}
                onClick={() => togglePlatform(pid)}
                disabled={isDisabled || submitting}
                style={{
                  padding: "0.7rem 0.5rem",
                  borderRadius: "10px",
                  border: isSelected
                    ? "2px solid #6366f1"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: isSelected
                    ? "rgba(99,102,241,0.18)"
                    : isDisabled
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(255,255,255,0.04)",
                  color: isSelected
                    ? "#a5b4fc"
                    : isDisabled
                    ? "#4b5563"
                    : "#cbd5e1",
                  fontSize: "0.78rem",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: isDisabled || submitting ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                  opacity: isDisabled ? 0.45 : 1,
                  fontFamily: "inherit",
                }}
              >
                {PLATFORM_LABELS[pid]}
              </button>
            );
          })}
        </div>

        {/* Selection count */}
        <p
          style={{
            fontSize: "0.8rem",
            color: selected.length === 2 ? "#86efac" : "#64748b",
            marginBottom: "1rem",
            transition: "color 0.2s",
          }}
        >
          {selected.length === 2
            ? `✓ ${PLATFORM_LABELS[selected[0] as VaultPlatformId]} & ${PLATFORM_LABELS[selected[1] as VaultPlatformId]} selected`
            : `${selected.length}/2 selected`}
        </p>

        {/* Error */}
        {error && (
          <p
            style={{
              fontSize: "0.82rem",
              color: "#f87171",
              marginBottom: "1rem",
              background: "rgba(248,113,113,0.1)",
              borderRadius: "8px",
              padding: "0.6rem 0.85rem",
              border: "1px solid rgba(248,113,113,0.2)",
            }}
          >
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleConfirm}
          disabled={selected.length !== 2 || submitting}
          style={{
            width: "100%",
            padding: "0.85rem",
            borderRadius: "10px",
            border: "none",
            background:
              selected.length === 2 && !submitting
                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                : "rgba(99,102,241,0.25)",
            color: selected.length === 2 ? "#fff" : "#6366f1",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: selected.length !== 2 || submitting ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            letterSpacing: "0.02em",
            fontFamily: "inherit",
          }}
        >
          {submitting ? "Confirming…" : "Confirm Platform Selection"}
        </button>

        {/* Upgrade nudge */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#475569",
            marginTop: "1rem",
          }}
        >
          Want all 11 platforms?{" "}
          <a href="/pricing" style={{ color: "#818cf8", textDecoration: "none" }}>
            Upgrade to Pro →
          </a>
        </p>
      </div>
    </div>
  );
}
