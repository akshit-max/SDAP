'use client';

import React from 'react';
import { Shield, Lock, FileText, Server, Users, AlertTriangle, Link2, DollarSign, FileCheck } from 'lucide-react';
import { PolicyPageLayout } from '../../components/layout/PolicyPageLayout';

export default function TermsPage() {
  return (
    <PolicyPageLayout title="Terms & Conditions" lastUpdated="August 24, 2026">
      {/* Section 1 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Shield className="w-5 h-5 text-sky-300" />
          <span>1. Eligibility &amp; Acceptance</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          By creating an account, accessing, or using the WithUs platform and associated browser extension, you agree to be bound by these Terms &amp; Conditions. If you are accepting these Terms on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these terms.
        </p>
      </section>

      {/* Section 2 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Users className="w-5 h-5 text-sky-300" />
          <span>2. Account Responsibilities</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          You are strictly responsible for maintaining the confidentiality of your login credentials to the WithUs platform. Any actions taken within your workspace or by authorized delegates fall under the responsibility of the organization owner.
        </p>
      </section>

      {/* Section 3 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Lock className="w-5 h-5 text-sky-300" />
          <span>3. Acceptable Use &amp; Credential Responsibility</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            The WithUs platform provides a credential delegation system. You agree not to abuse this system to circumvent legal access controls, scrape data, or perform unauthorized activities on connected platforms.
          </p>
          <div className="p-4 bg-white/[0.08] border border-white/20 rounded-2xl">
            <strong className="text-white block mb-1">Credential Responsibility</strong>
            <p className="text-white/80">
              Users retain full responsibility for the credentials stored within the WithUs Vault. It is your obligation to ensure these credentials are valid, authorized, and actively monitored for security.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Link2 className="w-5 h-5 text-sky-300" />
          <span>4. Third-Party Integrations</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            WithUs provides automated access and autofill capabilities for third-party government and commercial platforms (including GitHub, Vercel, Stripe, AWS, and enterprise portals).
          </p>
          <ul className="space-y-3 pl-1">
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">No Ownership/Control: </strong>
                <span>WithUs does not own, operate, or control these third-party platforms.</span>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">Availability: </strong>
                <span>WithUs cannot guarantee the availability, uptime, or API stability of third-party external services.</span>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">User Authorization: </strong>
                <span>Users are strictly responsible for ensuring they possess legal rights and authorization to access the connected accounts.</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <DollarSign className="w-5 h-5 text-sky-300" />
          <span>5. Subscription &amp; Payment Terms</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          Subscriptions are offered on a monthly or yearly basis. Billing is handled through enterprise payment gateways with recurring invoices generated automatically.
        </p>
      </section>

      {/* Section 6 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <AlertTriangle className="w-5 h-5 text-sky-300" />
          <span>6. Suspension &amp; Termination</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          Access to the platform may be suspended or terminated if a violation of these Terms, unauthorized data access, or threat to system infrastructure is detected.
        </p>
      </section>

      {/* Section 7 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <FileCheck className="w-5 h-5 text-sky-300" />
          <span>7. Legal Safeguards</span>
        </h2>
        <ul className="space-y-4 text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal pl-1">
          <li className="flex gap-3 items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Intellectual Property</strong>
              The WithUs platform, extension, and related materials are proprietary property, protected under applicable intellectual property laws.
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
            <div>
              <strong className="text-white block mb-0.5">Liability Limitations</strong>
              Under no circumstances shall WithUs be liable for indirect, incidental, or consequential damages resulting from the use or inability to use the service.
            </div>
          </li>
        </ul>
      </section>
    </PolicyPageLayout>
  );
}
