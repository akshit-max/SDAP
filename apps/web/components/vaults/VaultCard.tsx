import React from 'react';
import Link from 'next/link';
import { VaultResponse } from '@repo/types';
import { KeyRound, Clock } from 'lucide-react';

export function VaultCard({ vault }: { vault: VaultResponse }) {
  const createdDate = new Date(vault.createdAt).toLocaleDateString();

  return (
    <Link 
      href={`/vaults/${vault.id}`}
      className="block group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-150"
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
            <KeyRound className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {vault.name}
          </h3>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
          {vault.description || 'No description provided.'}
        </p>
        <div className="flex items-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
          <Clock className="w-3 h-3 mr-1" />
          Created on {createdDate}
        </div>
      </div>
    </Link>
  );
}
