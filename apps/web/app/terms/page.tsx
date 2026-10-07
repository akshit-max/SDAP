'use client';

import React from 'react';
import { Shield, Lock, FileText, Server, Users, Mail, AlertTriangle, Link2, Briefcase, FileCheck, DollarSign } from 'lucide-react';
import { PublicFooter } from '../../components/layout/PublicFooter';

export default function TermsPage() {
  return (
    <div className="h-screen overflow-y-auto bg-premium-bg py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 mb-4">
            <img src="/favicon.svg" alt="WithUs Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-premium-main sm:text-4xl">Terms & Conditions</h1>
          <div className="flex justify-center mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/50">
              Last Updated: August 24, 2026
            </span>
          </div>
        </div>

        {/* Content Document Wrapper */}
        <div className="premium-card p-8 md:p-12 lg:p-16 space-y-12">
          
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Shield className="w-5 h-5 text-premium-muted" />
              1. Eligibility & Acceptance
            </h2>
            <p className="text-base text-premium-muted leading-relaxed font-medium">
              By creating an account, accessing, or using the WithUs platform and associated browser extension, you agree to be bound by these Terms & Conditions. If you are accepting these Terms on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these terms.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Users className="w-5 h-5 text-premium-muted" />
              2. Account Responsibilities
            </h2>
            <p className="text-base text-premium-muted leading-relaxed font-medium">
              You are strictly responsible for maintaining the confidentiality of your login credentials to the WithUs platform. Any actions taken within your workspace or by authorized delegates fall under the responsibility of the organization owner.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Lock className="w-5 h-5 text-premium-muted" />
              3. Acceptable Use & Credential Responsibility
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The WithUs platform provides a credential delegation system. You agree not to abuse this system to circumvent legal access controls, scrape data, or perform unauthorized activities on connected platforms.
              </p>
              <p>
                <strong className="text-premium-main">Credential Responsibility:</strong> Users retain full responsibility for the credentials stored within the WITHUS Vault. It is your obligation to ensure these credentials are valid, authorized, and actively monitored for security.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Link2 className="w-5 h-5 text-premium-muted" />
              4. Third-Party Integrations
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                WITHUS provides automated access and autofill capabilities for third-party government and commercial portals (including but not limited to MCA, GST, GitHub, Vercel).
              </p>
              <ul className="space-y-3 pl-2">
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <span>
                    <strong className="text-premium-main">No Ownership/Control:</strong> WITHUS does not own, operate, or control these third-party portals.
                  </span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <span>
                    <strong className="text-premium-main">Availability:</strong> WITHUS cannot guarantee the availability, uptime, or API stability of these third-party services.
                  </span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <span>
                    <strong className="text-premium-main">User Authorization:</strong> Users are strictly responsible for ensuring they possess the legal right and authorization to access the connected accounts.
                  </span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <span>
                    <strong className="text-premium-main">No Implied Partnership:</strong> WITHUS should not be represented as an official partner, affiliate, or endorsed vendor of these third-party services unless a formal partnership exists.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <DollarSign className="w-5 h-5 text-premium-muted" />
              5. Subscription & Payment Terms
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                Subscriptions are intended to be offered on a monthly or yearly basis. Payment processing is expected to be provided through HDFC Bank as the preferred gateway, with Razorpay as an alternative, subject to final configuration.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <AlertTriangle className="w-5 h-5 text-premium-muted" />
              6. Suspension & Termination
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                Access to the platform may be suspended or terminated if a violation of these Terms, unauthorized data access, or threat to system infrastructure is detected.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <FileCheck className="w-5 h-5 text-premium-muted" />
              7. Legal Safeguards
            </h2>
            <ul className="space-y-6 text-base text-premium-muted leading-relaxed font-medium">
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                <div>
                  <strong className="text-premium-main block mb-1">Intellectual Property</strong>
                  The WithUs platform, extension, and related materials are the proprietary property of makewithus, subject to applicable intellectual property laws.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                <div>
                  <strong className="text-premium-main block mb-1">Liability Limitations</strong>
                  Under no circumstances shall WithUs be liable for indirect, incidental, or consequential damages resulting from the use or inability to use the service.
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                <div>
                  <strong className="text-premium-main block mb-1">Governing Law</strong>
                  These Terms & Conditions are governed by and construed in accordance with the laws of India, and specifically subject to the jurisdiction of the courts in Kerala.
                </div>
              </li>
            </ul>
          </section>

          <PublicFooter />
        </div>

      </div>
    </div>
  );
}
