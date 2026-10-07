'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, Server, Users, Mail, AlertTriangle } from 'lucide-react';
import { PublicFooter } from '../../components/layout/PublicFooter';

export default function PrivacyPolicyPage() {
  return (
    <div className="h-screen overflow-y-auto bg-premium-bg py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 mb-4">
            <img src="/favicon.svg" alt="WithUs Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-premium-main sm:text-4xl">Privacy Policy</h1>
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
              1. Introduction
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The WithUs Vault Browser Extension ("the Extension") is an enterprise security tool designed exclusively for authorized organizational users. It securely facilitates access to organization-approved credentials and autofills them on supported platforms after successful authentication and authorization.
              </p>
              <p>
                Because we handle sensitive credential access, our privacy practices are strict. The Extension does not sell your data, intentionally collect general browsing history, use advertising trackers, or inject advertisements. This policy explains exactly what data the Extension accesses, stores, and transmits.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <FileText className="w-5 h-5 text-premium-muted" />
              2. Data Accessed by the Extension
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>To function properly, the Extension requests specific browser permissions:</p>
              <ul className="space-y-4 pl-2">
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-premium-main block mb-1">ActiveTab & Scripting</strong>
                    The Extension accesses the Document Object Model (DOM) of supported websites configured by the WithUs platform strictly to identify login fields and safely inject autofill credentials. The Extension's supported-site access is limited to functionality required for authorized login and autofill operations.
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-premium-main block mb-1">Host Permissions</strong>
                    The Extension is strictly scoped to specific domains and does not possess broad access to your entire web history.
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Lock className="w-5 h-5 text-premium-muted" />
              3. Authentication & Local Storage
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The Extension authenticates users securely through the central WithUs API.
              </p>
              <ul className="space-y-4 pl-2">
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-premium-main block mb-1">What is stored locally</strong>
                    Upon successful authentication, the Extension temporarily stores the minimum information required to maintain an authenticated session, including an authentication token and session metadata. Locally stored session information is subject to the Extension's session expiration and sign-out handling.
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-premium-main block mb-1">Security Controls</strong>
                    The Extension is designed to automatically expire inactive sessions and clear locally stored authentication information when a session expires or the user signs out.
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Server className="w-5 h-5 text-premium-muted" />
              4. Data Transmission
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The Extension communicates exclusively with the secure WithUs backend infrastructure.
              </p>
              <ul className="space-y-4 pl-2">
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-premium-main block mb-1">What is transmitted</strong>
                    The Extension transmits only the minimum information required to authenticate requests and establish authorized access sessions with the WithUs platform.
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-premium-muted mt-2.5 flex-shrink-0"></span>
                  <div>
                    <strong className="text-premium-main block mb-1">Encryption</strong>
                    Communications between the Extension and WithUs services are transmitted over HTTPS/TLS connections.
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Users className="w-5 h-5 text-premium-muted" />
              5. Authorized Use Only
            </h2>
            <p className="text-base text-premium-muted leading-relaxed font-medium">
              This Extension is not for general public utility. It is intended strictly for employees, contractors, and interns who have been explicitly invited and authorized by a managing organization using the WithUs platform.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Users className="w-5 h-5 text-premium-muted" />
              6. Data Sharing
            </h2>
            <p className="text-base text-premium-muted leading-relaxed font-medium">
              The Extension does not sell, rent, or use personal information for advertising or marketing purposes. Information is processed only to provide the requested functionality and communicate securely with the WithUs platform.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <FileText className="w-5 h-5 text-premium-muted" />
              7. Policy Updates
            </h2>
            <p className="text-base text-premium-muted leading-relaxed font-medium">
              We may update this Privacy Policy from time to time. Any changes will be published on this page with an updated effective date.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-premium-main flex items-center gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-800/50">
              <Mail className="w-5 h-5 text-premium-muted" />
              8. Contact Us
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                For privacy-related inquiries, please contact:
              </p>
              <div className="flex flex-col gap-4 items-start">
                <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/30 border border-premium/50 rounded-lg inline-block">
                  <a href="mailto:contact@makewithus.in" className="text-premium-main font-bold hover:underline flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email: contact@makewithus.in
                  </a>
                </div>
              </div>
            </div>
          </section>

          <PublicFooter />
        </div>

      </div>
    </div>
  );
}
