import React from 'react';
import Link from 'next/link';
import { VaultResponse } from '@repo/types';
import { KeyRound, Clock } from 'lucide-react';

export function VaultCard({ vault }: { vault: VaultResponse }) {
  const createdDate = new Date(vault.createdAt).toLocaleDateString();

  return (
    <Link 
      href={`/vaults/${vault.id}`}
      className="block group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 group-hover:bg-blue-50/50 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {vault.name}
          </h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-500 line-clamp-2">
          {vault.description || 'No description provided.'}
        </p>
        <div className="flex items-center text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Created on {createdDate}
        </div>
      </div>
    </Link>
  );
}
