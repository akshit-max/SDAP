'use client';

import React from 'react';
import { Ticket, AlertCircle, Mail, HelpCircle, ArrowUpRight } from 'lucide-react';
import { SupportCard } from '../../../components/common/SupportCard';

export default function SupportPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-sm">
            <Ticket className="w-4 h-4" />
          </div>
          WITHUS Support & Help Center
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
          Direct email assistance and ticket-based support status for WITHUS platform accounts.
        </p>
      </div>

      {/* Direct Email Support Banner — Always Active */}
      <SupportCard />

      {/* Coming Soon Notice for Automated Infrastructure */}
      <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 p-5 rounded-lg">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              Automated Support Infrastructure — Coming Soon
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
              In-app ticket creation, ticket status tracking, and SLA escalation workflows will be integrated when the automated ticketing backend is provisioned. Direct email support via{' '}
              <a href="mailto:support@makewithus.in" className="font-bold underline">
                support@makewithus.in
              </a>{' '}
              is live and fully monitored.
            </p>
          </div>
        </div>
      </div>

      {/* Future Metric Cards Placeholder */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Open Issues', icon: '🔴' },
          { label: 'Resolved Issues', icon: '✅' },
          { label: 'Pending Issues', icon: '🟡' },
          { label: 'Critical Escalations', icon: '🚨' },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-zinc-900 p-5 rounded-lg flex flex-col items-center justify-center text-center space-y-2 border-dashed border-2 border-zinc-200 dark:border-zinc-800"
          >
            <span className="text-xl">{item.icon}</span>
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{item.label}</p>
            <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Infrastructure Deferred
            </span>
          </div>
        ))}
      </div>

      {/* Ticket Table Placeholder */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm p-8 text-center space-y-3 border-dashed border-2 border-zinc-200 dark:border-zinc-800">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
          <Ticket className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">No Ticketing System Connected</h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
            The support ticket log table will display organisation details, issue categories, SLAs, and resolution metrics once backend ticketing API integrations are connected.
          </p>
        </div>
        <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          Future Module — Infrastructure Required
        </span>
      </div>
    </div>
  );
}
