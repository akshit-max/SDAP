import React from 'react';
import Link from 'next/link';
import { VaultResponse } from '@repo/types';
import { KeyRound, Clock } from 'lucide-react';

export function VaultCard({ vault }: { vault: VaultResponse }) {
  const createdDate = new Date(vault.createdAt).toLocaleDateString();

  return (
    <Link 
      href={`/vaults/${vault.id}`}
      className="block group premium-card overflow-hidden transition-all duration-150 shadow-none"
    >
      <div className="p-4 border-b border-premium bg-slate-50/20 dark:bg-zinc-900/10 group-hover:bg-slate-50/50 dark:group-hover:bg-zinc-900/30 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-slate-100 dark:bg-zinc-800 text-premium-muted rounded-lg">
            <KeyRound className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-premium-main truncate">
            {vault.name}
          </h3>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-premium-muted line-clamp-2 min-h-[32px]">
          {vault.description || 'No description provided.'}
        </p>
        <div className="flex items-center text-[10px] font-bold text-premium-muted uppercase tracking-wider">
          <Clock className="w-3 h-3 mr-1" />
          Created on {createdDate}
        </div>
      </div>
    </Link>
  );
}
