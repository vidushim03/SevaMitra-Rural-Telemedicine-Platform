import { Link } from 'react-router-dom';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard = () => {
  const { data } = useAppData();
  const { user } = useAuth();

  if (!user) return null;

  const myAppointments = data.appointments.filter(
    (a) => a.patientId === user.id || a.doctorId === user.id || user.role === 'admin',
  );
  const myQueue = data.queue.filter(
    (q) => q.patientId === user.id || q.doctorId === user.id || user.role === 'admin',
  );
  const isDoctor = user.role === 'doctor';
  const isAdmin = user.role === 'admin';

  const myPayments = data.payments.filter((p) => p.patientId === user.id || isAdmin);
  const pendingPayments = myPayments.filter((p) => p.status === 'pending').length;
  const paidAmount = myPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = isDoctor
    ? [
        { label: 'My Appointments', value: myAppointments.length },
        { label: 'Queue Active', value: myQueue.filter((q) => q.status === 'waiting' || q.status === 'ongoing').length },
        { label: 'Completed Consults', value: myAppointments.filter((a) => a.status === 'completed').length },
        { label: 'Upcoming Today', value: myAppointments.filter((a) => a.status === 'scheduled' && a.date === new Date().toISOString().slice(0, 10)).length },
      ]
    : [
        { label: 'My Appointments', value: myAppointments.length },
        { label: 'Queue Active', value: myQueue.filter((q) => q.status === 'waiting' || q.status === 'ongoing').length },
        { label: 'Pending Payments', value: pendingPayments },
        { label: isAdmin ? 'Revenue Collected' : 'Total Paid', value: `₹${paidAmount}` },
      ];

  const quickActions = [
    { to: '/appointments', label: 'Manage Appointments' },
    ...(isDoctor ? [{ to: '/consultations', label: 'Run Consultations' }] : []),
    ...(isDoctor ? [{ to: '/prescriptions', label: 'Issue Prescriptions' }] : []),
    { to: '/records', label: 'Open EMR Timeline' },
    ...(isDoctor ? [] : [{ to: '/symptoms', label: 'Symptom Checker' }]),
    ...(isDoctor ? [] : [{ to: '/payments', label: 'Track Payments' }]),
    ...(isDoctor ? [] : [{ to: '/medicines', label: 'My Medicines' }]),
    ...(isDoctor ? [] : [{ to: '/vitals', label: 'Track Vitals' }]),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Analytics' }] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl p-6 text-white bg-[linear-gradient(120deg,#0c4a6e_0%,#1e40af_45%,#3b0764_100%)] shadow-2xl">
        <p className="text-white/80 text-sm">{user.role.toUpperCase()} PORTAL</p>
        <h2 className="text-3xl font-bold mt-1">Welcome back, {user.name}</h2>
        <p className="text-white/80 mt-2">Everything is now connected: calls, appointments, records, prescriptions, pharmacy, and admin analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-lg">Live Queue</h3>
          <div className="mt-4 space-y-3">
            {myQueue.length === 0 && <p className="text-sm text-muted-foreground">No queue activity yet.</p>}
            {myQueue.slice(0, 5).map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-medium">{q.appointmentId}</p>
                  <p className="text-xs text-muted-foreground">Joined: {new Date(q.joinedAt).toLocaleString()}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-zinc-800">{q.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-lg">Quick Actions</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map(({ to, label }) => (
              <Link key={to} to={to} className="rounded-xl border p-4 hover:bg-muted">{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
