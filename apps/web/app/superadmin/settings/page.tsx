'use client';

import React from 'react';
import { Settings, Shield, AlertCircle } from 'lucide-react';

function SettingRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-premium last:border-b-0">
      <div>
        <p className="text-xs font-semibold text-premium-main">{label}</p>
        {note && <p className="text-[10px] text-premium-muted mt-0.5">{note}</p>}
      </div>
      <span className="text-xs font-mono text-premium-muted ml-4 flex-shrink-0">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-bold text-premium-main flex items-center gap-2">
          <Settings className="w-4 h-4" /> Platform Settings
        </h2>
        <p className="text-[11px] text-premium-muted mt-0.5">Read-only platform configuration. Write access requires a dedicated security review.</p>
      </div>

      {/* Read-only notice */}
      <div className="premium-card p-4 border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-premium-muted leading-relaxed">
            Platform settings are read-only in Phase 1. Modifying rate limits, CORS origins, or other platform configuration requires a dedicated security review and will not be self-service in the Super Admin portal.
          </p>
        </div>
      </div>

      {/* Current Platform Config */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Current Platform Configuration</p>
        <div className="premium-card p-5">
          <SettingRow label="Rate Limit — Requests per Window" value="100 requests / 60 seconds" note="Configured in app.module.ts ThrottlerModule" />
          <SettingRow label="JWT Access Token TTL" value="15 minutes" note="Short-lived for security" />
          <SettingRow label="JWT Refresh Token TTL" value="7 days" note="Rotated on each use (refresh token rotation)" />
          <SettingRow label="Session Expiry Scheduler" value="Enabled" note="Expired sessions are automatically cleaned up" />
          <SettingRow label="Credential Encryption" value="AES-256-GCM" note="Envelope encryption with MEK + DEK model" />
          <SettingRow label="CORS" value="Configured" note="Controlled by CORS_ORIGIN env variable" />
          <SettingRow label="Memory Heap Threshold" value="150 MB" note="Monitored via @nestjs/terminus health check" />
          <SettingRow label="Platform Audit Logging" value="Enabled" note="All Super Admin actions are logged to PlatformAuditEvent" />
        </div>
      </div>

      {/* Writable settings — all coming soon */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-premium-muted mb-4">Configuration Controls</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Rate Limit Editor', desc: 'Adjust request rate limits per endpoint' },
            { title: 'CORS Origin Manager', desc: 'Add or remove allowed CORS origins' },
            { title: 'Session Policy Editor', desc: 'Configure session TTL, max reveals, expiry policy' },
            { title: 'Notification Settings', desc: 'Configure alert thresholds and notification channels' },
            { title: 'Audit Retention Policy', desc: 'Set audit event retention period' },
            { title: 'Platform Feature Flags', desc: 'Enable or disable platform-level features' },
          ].map((item) => (
            <div key={item.title} className="premium-card p-4 flex items-start justify-between border-dashed border-2 border-zinc-200 dark:border-zinc-700/60">
              <div>
                <p className="text-xs font-semibold text-premium-main">{item.title}</p>
                <p className="text-[10px] text-premium-muted mt-0.5">{item.desc}</p>
              </div>
              <span className="ml-3 flex-shrink-0 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div className="premium-card p-4 border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/10">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
            Platform configuration write access will require MFA confirmation, a full audit trail, and dedicated security review before being made available in the Super Admin portal.
          </p>
        </div>
      </div>
    </div>
  );
}
