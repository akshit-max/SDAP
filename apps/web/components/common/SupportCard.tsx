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
      <div className={`p-4 rounded-[20px] bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-zinc-200/80 dark:border-white/15 text-zinc-900 dark:text-white shadow-sm space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <h4 className="text-xs font-bold tracking-tight">Need assistance?</h4>
        </div>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Raise a support ticket with our engineering team &mdash;{' '}
          <a
            href="mailto:support@makewithus.in"
            className="font-bold underline text-zinc-900 dark:text-white hover:text-emerald-500 transition-colors inline-flex items-center gap-0.5"
          >
            support@makewithus.in
            <ArrowUpRight className="w-3 h-3 inline" />
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-[24px] bg-white/80 dark:bg-white/[0.06] backdrop-blur-xl border border-zinc-200/80 dark:border-white/15 p-6 shadow-sm hover:border-zinc-300 dark:hover:border-white/30 transition-all ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200/60 dark:border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Need assistance with your Vault or Extension?
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Raise a support inquiry and our security team will assist you &mdash;{' '}
              <a
                href="mailto:support@makewithus.in"
                className="font-bold text-zinc-900 dark:text-white underline underline-offset-2 hover:text-emerald-500 transition-colors inline-flex items-center gap-0.5"
              >
                support@makewithus.in
                <ArrowUpRight className="w-3 h-3 inline text-zinc-400" />
              </a>
            </p>
          </div>
        </div>

        <a
          href="mailto:support@makewithus.in"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/15 hover:bg-zinc-200/80 dark:hover:bg-white/20 transition-all self-start sm:self-auto flex-shrink-0 shadow-sm"
        >
          <Mail className="w-3.5 h-3.5 text-emerald-500" />
          <span>Contact Support</span>
        </a>
      </div>
    </div>
  );
}

export default SupportCard;
