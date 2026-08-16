import { useAuth } from '../contexts/AuthContext';

import { AdminAnalytics } from '../components/admin-analytics';
import { OperationsAnalytics } from '../components/operations-analytics';

export function AdminPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <div className="rounded-2xl border bg-card p-6">Admin access only.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Operations Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Platform KPIs on simulated traffic — demand, capacity, outcomes, pharmacy availability.
        </p>
      </div>
      <OperationsAnalytics />

      <div>
        <h2 className="text-2xl font-bold">Live Platform Activity</h2>
        <p className="text-muted-foreground mt-1">
          Real-time view of the running app's seeded data.
        </p>
      </div>
      <AdminAnalytics />
    </div>
  );
}
