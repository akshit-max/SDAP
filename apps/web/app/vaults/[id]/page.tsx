import { DashboardShell } from '../../../components/layout/DashboardShell';
import { VaultDetailsPage } from '../../../components/vaults/VaultDetailsPage';
import { use } from 'react';

export default function VaultDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <DashboardShell>
      <VaultDetailsPage vaultId={id} />
    </DashboardShell>
  );
}
