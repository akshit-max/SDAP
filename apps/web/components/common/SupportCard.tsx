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
      <div className={`p-4 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 shadow-sm space-y-2 ${className}`}>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <h4 className="text-xs font-bold tracking-tight">Need help with WITHUS?</h4>
        </div>
        <p className="text-[11px] text-zinc-300 dark:text-zinc-600 leading-relaxed">
          Raise a support request and our team will get back to you -{' '}
          <a
            href="mailto:support@makewithus.in"
            className="font-bold underline text-white dark:text-zinc-900 hover:text-emerald-400 dark:hover:text-emerald-600 transition-colors inline-flex items-center gap-0.5"
          >
            support@makewithus.in
            <ArrowUpRight className="w-3 h-3 inline" />
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-900 dark:text-zinc-100 flex-shrink-0 mt-0.5">
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Need help with WITHUS?
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
              Raise a support request and our team will get back to you -{' '}
              <a
                href="mailto:support@makewithus.in"
                className="font-bold text-zinc-900 dark:text-zinc-100 underline decoration-zinc-400 hover:decoration-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-0.5"
              >
                support@makewithus.in
                <ArrowUpRight className="w-3 h-3 inline text-zinc-400" />
              </a>
            </p>
          </div>
        </div>

        <a
          href="mailto:support@makewithus.in"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors self-start sm:self-auto flex-shrink-0"
        >
          <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Contact Support</span>
        </a>
      </div>
    </div>
  );
}

export default SupportCard;
