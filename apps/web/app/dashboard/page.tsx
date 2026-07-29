import { DashboardShell } from '../../components/layout/DashboardShell';
import { VaultListPage } from '../../components/vaults/VaultListPage';

export default function Dashboard() {
  return (
    <DashboardShell>
      <VaultListPage />
    </DashboardShell>
  );
}
