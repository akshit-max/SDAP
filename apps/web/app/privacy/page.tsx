'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, Server, Users, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-premium-bg flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="mx-auto w-16 h-16 mb-6">
            <img src="/logo.png" alt="WithUs Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-premium-main">Privacy Policy</h1>
          <p className="text-sm text-premium-muted font-medium">
            Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content Box */}
        <div className="premium-card p-8 md:p-10 space-y-10">
          
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-premium-main flex items-center gap-2">
              <Shield className="w-5 h-5 text-premium-muted" />
              1. Introduction
            </h2>
            <div className="text-sm text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The WithUs Vault Browser Extension ("the Extension") is an enterprise security tool designed exclusively for authorized organizational users. It securely retrieves and autofills delegated credentials for approved platforms.
              </p>
              <p>
                Because we handle sensitive credential access, our privacy practices are strict. We do not sell your data, track your general browsing activity, or inject advertisements. This policy explains exactly what data the Extension accesses, stores, and transmits.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-premium-main flex items-center gap-2">
              <FileText className="w-5 h-5 text-premium-muted" />
              2. Data Accessed by the Extension
            </h2>
            <div className="text-sm text-premium-muted leading-relaxed font-medium space-y-4">
              <p>To function properly, the Extension requests specific browser permissions:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-premium-main">ActiveTab & Scripting:</strong> The Extension accesses the Document Object Model (DOM) of specific, pre-approved target websites (e.g., Vercel, GitHub, GoDaddy) strictly to identify login fields and safely inject autofill credentials. It does not read your data or activity on other websites.
                </li>
                <li>
                  <strong className="text-premium-main">Host Permissions:</strong> The Extension is strictly scoped to specific domains and does not possess broad access to your entire web history.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-premium-main flex items-center gap-2">
              <Lock className="w-5 h-5 text-premium-muted" />
              3. Authentication & Local Storage
            </h2>
            <div className="text-sm text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The Extension authenticates users securely through the central WithUs API.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-premium-main">What is stored locally:</strong> Upon successful login, the Extension stores a temporary Authentication Token (JWT) and basic session metadata in your browser's local secure storage.
                </li>
                <li>
                  <strong className="text-premium-main">Security Controls:</strong> This token is protected by background alarms that enforce automatic session timeouts, clearing your authentication state when not in use.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-premium-main flex items-center gap-2">
              <Server className="w-5 h-5 text-premium-muted" />
              4. Data Transmission
            </h2>
            <div className="text-sm text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The Extension communicates exclusively with the secure WithUs backend infrastructure.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-premium-main">What is transmitted:</strong> The Extension transmits your authentication token and strict identifiers necessary to request credential access for a specific session.
                </li>
                <li>
                  <strong className="text-premium-main">Encryption:</strong> All transmissions occur over secure, encrypted HTTPS connections. No credentials or tokens are ever sent over unencrypted channels.
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-premium-main flex items-center gap-2">
              <Users className="w-5 h-5 text-premium-muted" />
              5. Authorized Use Only
            </h2>
            <div className="text-sm text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                This Extension is not for general public utility. It is intended strictly for employees, contractors, and interns who have been explicitly invited and authorized by a managing organization using the WithUs platform. Unauthorized access attempts are logged and blocked by the API infrastructure.
              </p>
            </div>
          </section>

          <section className="space-y-4 border-t border-premium pt-8">
            <h2 className="text-lg font-bold text-premium-main flex items-center gap-2">
              <Mail className="w-5 h-5 text-premium-muted" />
              6. Contact Us
            </h2>
            <div className="text-sm text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                If you have questions or concerns about this Privacy Policy or how your organizational data is handled, please contact our support team.
              </p>
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/30 border border-premium/50 rounded-lg inline-block">
                <a href="mailto:makewithus.in@gmail.com" className="text-premium-main font-bold hover:underline flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  makewithus.in@gmail.com
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-premium-muted font-medium pt-8">
          &copy; {new Date().getFullYear()} WithUs. All rights reserved.
          <div className="mt-2">
            <Link href="/" className="hover:text-premium-main transition-colors">
              Return to Home
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
