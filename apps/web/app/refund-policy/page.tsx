'use client';

import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { PolicyPageLayout } from '../../components/layout/PolicyPageLayout';

export default function RefundPolicyPage() {
  return (
    <PolicyPageLayout title="Refund & Cancellation Policy" lastUpdated="August 24, 2026" badge="BILLING & SUBSCRIPTIONS">
      {/* Section 1 */}
      <section className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 pb-3 border-b border-white/20">
          <Info className="w-5 h-5 text-sky-300" />
          <span>1. Commercial Terms &amp; Subscriptions</span>
        </h2>
        <div className="text-sm sm:text-[15px] text-white/90 leading-relaxed font-normal space-y-4">
          <p>
            WithUs offers flexible monthly and annual enterprise subscriptions for delegated credential management and audit logging. Specific terms regarding billing cycles, renewals, refund eligibility, and plan adjustments are detailed below:
          </p>
          <ul className="space-y-3 pl-1">
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">Cancellation: </strong>
                <span>You may cancel your subscription at any time via your workspace settings. Your access will remain active until the conclusion of your current billing period.</span>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">Refund Eligibility: </strong>
                <span>If you experience technical issues that prevent access to your vault credentials and our support team is unable to resolve them within 7 business days, you may request a pro-rated refund.</span>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-2.5 flex-shrink-0" />
              <div>
                <strong className="text-white">Billing Inquiries: </strong>
                <span>For invoice assistance or enterprise plan migrations, reach out to our billing team at <a href="mailto:contact@makewithus.in" className="text-white underline underline-offset-2 hover:text-sky-300">contact@makewithus.in</a>.</span>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </PolicyPageLayout>
  );
}
