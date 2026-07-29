import { DashboardShell } from '../../../components/layout/DashboardShell';
import { VaultDetailsPage } from '../../../components/vaults/VaultDetailsPage';

export default function VaultDetails({ params }: { params: { id: string } }) {
  return (
    <DashboardShell>
      <VaultDetailsPage vaultId={params.id} />
    </DashboardShell>
  );
}
