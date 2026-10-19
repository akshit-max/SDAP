'use client';

import React from 'react';
import { HelpCircle, Mail, ArrowUpRight } from 'lucide-react';

interface SupportCardProps {
  className?: string;
  compact?: boolean;
}

export function SupportCard({ className = '', compact = false }: SupportCardProps) {
  if (compact) {
    return (
      <div className={`p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-semibold tracking-tight">Need assistance?</h4>
        </div>
        <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed font-normal">
          Raise a support ticket with our engineering team &mdash;{' '}
          <a
            href="mailto:support@makewithus.in"
            className="font-medium underline underline-offset-2 text-[#0071E3] hover:underline transition-colors inline-flex items-center gap-0.5"
          >
            support@makewithus.in
            <ArrowUpRight className="w-3 h-3 inline" />
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
              Need assistance with your Vault or Extension?
            </h4>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed font-normal">
              Raise a support inquiry and our security team will assist you &mdash;{' '}
              <a
                href="mailto:support@makewithus.in"
                className="font-medium text-[#0071E3] hover:underline inline-flex items-center gap-0.5"
              >
                support@makewithus.in
                <ArrowUpRight className="w-3 h-3 inline text-[#86868B]" />
              </a>
            </p>
          </div>
        </div>

        <a
          href="mailto:support@makewithus.in"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] bg-white dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] hover:bg-[#F5F5F7] dark:hover:bg-[#38383A] transition-colors self-start sm:self-auto flex-shrink-0 shadow-sm"
        >
          <Mail className="w-3.5 h-3.5 text-[#0071E3]" />
          <span>Contact Support</span>
        </a>
      </div>
    </div>
  );
}

export default SupportCard;

