import { useAuth } from '../contexts/AuthContext';

import { AdminAnalytics } from '../components/admin-analytics';

export function AdminPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <div className="rounded-2xl border bg-card p-6">Admin access only.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Admin Analytics</h2>
      <AdminAnalytics />
    </div>
  );
}
