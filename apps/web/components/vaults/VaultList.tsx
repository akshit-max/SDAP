import React from 'react';
import { VaultResponse } from '@repo/types';
import { VaultCard } from './VaultCard';

export function VaultList({ vaults }: { vaults: VaultResponse[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {vaults.map((vault) => (
        <VaultCard key={vault.id} vault={vault} />
      ))}
    </div>
  );
}
