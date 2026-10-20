'use client';

import React from 'react';
import { Shield, Lock, FileText, Server, Users, Mail } from 'lucide-react';
import { PolicyPageLayout } from '../../components/layout/PolicyPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageLayout title="Privacy Policy" lastUpdated="August 24, 2026">
      {/* Section 1 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Shield className="w-5 h-5 text-sky-300" />
          <span>1. Introduction</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            The WithUs Vault Browser Extension (&quot;the Extension&quot;) is an enterprise security tool designed exclusively for authorized organizational users. It securely facilitates access to organization-approved credentials and autofills them on supported platforms after successful authentication and authorization.
          </p>
          <p>
            Because we handle sensitive credential access, our privacy practices are strict. The Extension does not sell your data, intentionally collect general browsing history, use advertising trackers, or inject advertisements. This policy explains exactly what data the Extension accesses, stores, and transmits.
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <FileText className="w-5 h-5 text-sky-300" />
          <span>2. Data Accessed by the Extension</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>To function properly, the Extension requests specific browser permissions:</p>
          <ul className="space-y-4 pl-1">
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white block mb-0.5">ActiveTab &amp; Scripting</strong>
                The Extension accesses the Document Object Model (DOM) of supported websites configured by the WithUs platform strictly to identify login fields and safely inject autofill credentials. The Extension&apos;s supported-site access is limited to functionality required for authorized login and autofill operations.
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white block mb-0.5">Host Permissions</strong>
                The Extension is strictly scoped to specific domains and does not possess broad access to your entire web history.
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Lock className="w-5 h-5 text-sky-300" />
          <span>3. Authentication &amp; Local Storage</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            The Extension authenticates users securely through the central WithUs API.
          </p>
          <ul className="space-y-4 pl-1">
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white block mb-0.5">What is stored locally</strong>
                Upon successful authentication, the Extension temporarily stores the minimum information required to maintain an authenticated session, including an authentication token and session metadata. Locally stored session information is subject to the Extension&apos;s session expiration and sign-out handling.
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white block mb-0.5">Security Controls</strong>
                The Extension is designed to automatically expire inactive sessions and clear locally stored authentication information when a session expires or the user signs out.
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Server className="w-5 h-5 text-sky-300" />
          <span>4. Data Transmission</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            The Extension communicates exclusively with the secure WithUs backend infrastructure.
          </p>
          <ul className="space-y-4 pl-1">
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white block mb-0.5">What is transmitted</strong>
                The Extension transmits only the minimum information required to authenticate requests and establish authorized access sessions with the WithUs platform.
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white block mb-0.5">Encryption</strong>
                Communications between the Extension and WithUs services are transmitted over HTTPS/TLS connections.
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Users className="w-5 h-5 text-sky-300" />
          <span>5. Authorized Use Only</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          This Extension is not for general public utility. It is intended strictly for employees, contractors, and interns who have been explicitly invited and authorized by a managing organization using the WithUs platform.
        </p>
      </section>

      {/* Section 6 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Users className="w-5 h-5 text-sky-300" />
          <span>6. Data Sharing</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          The Extension does not sell, rent, or use personal information for advertising or marketing purposes. Information is processed only to provide the requested functionality and communicate securely with the WithUs platform.
        </p>
      </section>

      {/* Section 7 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <FileText className="w-5 h-5 text-sky-300" />
          <span>7. Policy Updates</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          We may update this Privacy Policy from time to time. Any changes will be published on this page with an updated effective date.
        </p>
      </section>

      {/* Section 8 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Mail className="w-5 h-5 text-sky-300" />
          <span>8. Contact Us</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-3">
          <p>
            For privacy-related inquiries, please contact our security team:
          </p>
          <div className="inline-block p-4 bg-white/[0.08] border border-white/20 rounded-2xl">
            <a href="mailto:contact@makewithus.in" className="text-white font-medium hover:underline flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-300" />
              <span>contact@makewithus.in</span>
            </a>
          </div>
        </div>
      </section>
    </PolicyPageLayout>
  );
}
