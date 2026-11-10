'use client';

import React from 'react';
import { Shield, Lock, Key, Search, Database, Activity } from 'lucide-react';
import { PolicyPageLayout } from '../../components/layout/PolicyPageLayout';

export default function SecurityPage() {
  return (
    <PolicyPageLayout title="Security & Data Protection" lastUpdated="November 10, 2026" badge="ENTERPRISE SECURITY">
      {/* Section 1 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Shield className="w-5 h-5 text-sky-300" />
          <span>1. Our Security Commitment</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          At WithUs, security is the foundation of our credential delegation architecture. We employ defense-in-depth technical and organizational measures designed to protect high-privilege credentials and organizational data at every touchpoint.
        </p>
      </section>

      {/* Section 2 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Key className="w-5 h-5 text-sky-300" />
          <span>2. Credential Encryption</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            Sensitive credential secrets managed within the WithUs Vault are encrypted using industry-standard <strong className="text-white">AES-256-GCM</strong> authenticated encryption prior to resting in our secure databases.
          </p>
          <div className="p-4 bg-white/[0.08] border border-white/20 rounded-2xl">
            <strong className="text-white block mb-1">No Credential Storage in the Browser</strong>
            <p className="text-white/80">
              For an authorized autofill, the browser extension receives the credential over HTTPS, enters it into the login form, and does not save it to browser or extension storage.
            </p>
          </div>
          <p>
            Data transmission between your browser, the extension, and our services takes place over encrypted HTTPS (TLS) connections.
          </p>
        </div>
      </section>

      {/* Section 3 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Lock className="w-5 h-5 text-sky-300" />
          <span>3. Access Controls &amp; Authentication</span>
        </h2>
        <ul className="space-y-4 text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal pl-1">
          <li className="flex gap-3 items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Session Security</strong>
              Web authentication sessions use Secure, HTTP-only cookies, so session tokens cannot be read by page scripts.
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Role-Based Access Control (RBAC)</strong>
              Access to credentials and workspace settings is governed by user roles (Owner, Admin, Member) and time-limited delegated access sessions.
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Instant Administrative Revocation</strong>
              Workspace administrators can terminate active delegated access sessions instantly across connected endpoints with single-click revocation.
            </div>
          </li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Search className="w-5 h-5 text-sky-300" />
          <span>4. Audit Logging</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          WithUs records audit events for credential creation, updates and deletion, successful credential access (including browser extension autofill), delegated session creation, revocation and expiry, and approval decisions. Each record captures the workspace ID, actor ID, action type, affected resource, and timestamp.
        </p>
      </section>

      {/* Section 5 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Database className="w-5 h-5 text-sky-300" />
          <span>5. Infrastructure &amp; Tenant Isolation</span>
        </h2>
        <ul className="space-y-4 text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal pl-1">
          <li className="flex gap-3 items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Logical Data Separation</strong>
              Every organization operates within isolated logical boundaries enforced by access checks, and each encrypted credential is cryptographically bound to its own organization.
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Continuous Backup &amp; PITR</strong>
              PostgreSQL databases maintain continuous Point-In-Time Recovery (PITR) to safeguard enterprise continuity.
            </div>
          </li>
        </ul>
      </section>

      {/* Section 6 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Activity className="w-5 h-5 text-sky-300" />
          <span>6. Monitoring &amp; Incident Response</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          Our services use request rate limiting and application error monitoring. Infrastructure alerts and suspected security incidents are investigated and addressed by our engineering team.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
