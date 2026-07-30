import { DashboardShell } from '../../components/layout/DashboardShell';
import { DashboardSummary } from '../../components/layout/DashboardSummary';

export default function Dashboard() {
  return (
    <DashboardShell>
      <DashboardSummary />
    </DashboardShell>
  );
}
