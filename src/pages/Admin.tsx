import { useMemo } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

export function AdminPage() {
  const { data } = useAppData();
  const { user } = useAuth();

  const metrics = useMemo(() => ({
    totalUsers: data.users.length,
    totalAppointments: data.appointments.length,
    conversion: data.payments.length ? Math.round((data.payments.filter((p) => p.status === 'paid').length / data.payments.length) * 100) : 0,
    openQueue: data.queue.filter((q) => q.status === 'waiting' || q.status === 'ongoing').length,
  }), [data]);

  if (!user || user.role !== 'admin') {
    return <div className="rounded-2xl border bg-card p-6">Admin access only.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Admin Control Room</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric label="Total Users" value={metrics.totalUsers} />
        <Metric label="Appointments" value={metrics.totalAppointments} />
        <Metric label="Payment Success" value={`${metrics.conversion}%`} />
        <Metric label="Open Queue" value={metrics.openQueue} />
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h3 className="font-semibold">Operational Snapshot</h3>
        <p className="text-sm text-muted-foreground mt-2">This panel helps monitor platform health, throughput, and service quality in one place.</p>
        <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
          <li>Doctors active: {data.users.filter((u) => u.role === 'doctor').length}</li>
          <li>Patients onboarded: {data.users.filter((u) => u.role === 'patient').length}</li>
          <li>Records generated: {data.records.length}</li>
          <li>Prescriptions issued: {data.prescriptions.length}</li>
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
