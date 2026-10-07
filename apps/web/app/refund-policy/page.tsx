'use client';

import React from 'react';
import { Shield, Info, AlertTriangle } from 'lucide-react';
import { PublicFooter } from '../../components/layout/PublicFooter';

export default function RefundPolicyPage() {
  return (
    <div className="h-screen overflow-y-auto bg-premium-bg py-16 px-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 mb-4">
            <img src="/favicon.svg" alt="WithUs Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-premium-main sm:text-4xl">Refund & Cancellation Policy</h1>
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
              <Info className="w-5 h-5 text-premium-muted" />
              1. Commercial Terms Pending
            </h2>
            <div className="text-base text-premium-muted leading-relaxed font-medium space-y-4">
              <p>
                The commercial pricing model, including monthly and yearly subscription plans, is currently being finalized. Specific details regarding cancellation windows, refund eligibility, renewals, failed payments, and upgrades/downgrades will be published here prior to the commencement of any paid service.
              </p>
            </div>
          </section>

          <PublicFooter />
        </div>

      </div>
    </div>
  );
}
