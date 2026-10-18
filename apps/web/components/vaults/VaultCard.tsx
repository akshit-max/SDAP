'use client';

import React from 'react';
import Link from 'next/link';
import { VaultResponse } from '@repo/types';
import { KeyRound, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '../../lib/formatters';

export function VaultCard({ vault }: { vault: VaultResponse }) {
  const createdDate = formatDate(vault.createdAt);

  return (
    <Link 
      href={`/vaults/${vault.id}`}
      className="block group rounded-[28px] bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:border-zinc-300 dark:hover:border-white/20 hover:scale-[1.01] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-200 w-full"
    >
      <div className="p-6 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-11 h-11 bg-sky-500/10 dark:bg-sky-500/15 text-sky-500 dark:text-sky-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              {vault.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              AES-256 Vault
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white dark:bg-white/[0.06] border border-zinc-200/80 dark:border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white group-hover:border-zinc-300 dark:group-hover:border-white/20 transition-all shadow-sm flex-shrink-0">
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      <div className="p-6 space-y-5">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[40px] leading-relaxed font-normal">
          {vault.description || 'Secure credential storage for workspace secrets and delegated login access.'}
        </p>

        <div className="flex items-center justify-between w-full pt-4 border-t border-zinc-100 dark:border-white/10 text-xs">
          <div className="flex items-center text-zinc-400 dark:text-zinc-500 text-[11px] font-medium shrink-0">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            <span>{createdDate}</span>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-950 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all shrink-0 ml-auto shadow-sm">
            <span>View Credentials</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
