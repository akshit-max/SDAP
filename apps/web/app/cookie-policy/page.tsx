'use client';

import React from 'react';
import { Shield, FileText, Settings, Info } from 'lucide-react';
import { PolicyPageLayout } from '../../components/layout/PolicyPageLayout';

export default function CookiePolicyPage() {
  return (
    <PolicyPageLayout title="Cookie Policy" lastUpdated="August 24, 2026" badge="PRIVACY & PREFERENCES">
      {/* Section 1 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Info className="w-5 h-5 text-sky-300" />
          <span>1. What Are Cookies</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          Cookies are small data files placed on your computer or mobile device when you access a website or application. We use cookies strictly to make the website operate efficiently and to securely manage authenticated delegated access sessions.
        </p>
      </section>

      {/* Section 2 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Shield className="w-5 h-5 text-sky-300" />
          <span>2. Strictly Essential Cookies</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            WithUs relies solely on strictly necessary cookies required for the core security and cryptographic functionality of the platform:
          </p>
          <ul className="space-y-3 pl-1">
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">Authentication &amp; Security: </strong>
                <span>We use secure, HTTP-only cookies to maintain your authenticated session. This ensures that session identifiers cannot be read or stolen by malicious client-side scripts.</span>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">Functionality: </strong>
                <span>Essential cookies preserve interface preferences such as active organization context and dark mode styling.</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Settings className="w-5 h-5 text-sky-300" />
          <span>3. No Third-Party Ad Trackers</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          WithUs does not use advertising, marketing, or cross-site tracking cookies. We only collect anonymized diagnostic telemetry via Sentry to monitor errors, platform uptime, and security incidents.
        </p>
      </section>

      {/* Section 4 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <FileText className="w-5 h-5 text-sky-300" />
          <span>4. Managing Your Preferences</span>
        </h2>
        <p className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal">
          You can configure your browser to refuse all cookies. However, because our cryptographic session management depends on essential authentication cookies, disabling cookies entirely will prevent you from signing in to your WithUs workspace.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
