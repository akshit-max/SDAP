'use client';

import React from 'react';
import Link from 'next/link';
import { VaultResponse } from '@repo/types';
import { KeyRound, Clock, ArrowRight } from 'lucide-react';
import { formatDate } from '../../lib/formatters';

export function VaultCard({ vault }: { vault: VaultResponse }) {
  const createdDate = formatDate(vault.createdAt);
  const secretCount = (vault as any)?._count?.secrets ?? (vault as any)?.secretsCount;

  return (
    <Link 
      href={`/vaults/${vault.id}`}
      className="block group bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#D2D2D7] dark:hover:border-[#38383A] transition-all w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <KeyRound className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate group-hover:text-[#0071E3] transition-colors">
              {vault.name}
            </h3>
            {typeof secretCount === 'number' ? (
              <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
                <span>{secretCount} {secretCount === 1 ? 'credential' : 'credentials'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>AES-256 Encrypted</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-[#86868B] dark:text-[#8E8E93] line-clamp-2 min-h-[36px] leading-relaxed font-normal mb-4">
        {vault.description || 'Secure credential storage for workspace secrets and delegated login access.'}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-[#E5E5EA] dark:border-[#2C2C2E] text-xs">
        <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
          {createdDate}
        </span>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F5F7] dark:bg-[#2C2C2E] group-hover:bg-[#E5E5EA] dark:group-hover:bg-[#38383A] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors">
          <span>View Credentials</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
