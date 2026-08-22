import { Link } from 'react-router-dom';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../components/translations';

export const Dashboard = () => {
  const { data } = useAppData();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

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
        { label: t.myAppointments, value: myAppointments.length },
        { label: t.queueActive, value: myQueue.filter((q) => q.status === 'waiting' || q.status === 'ongoing').length },
        { label: t.completedConsults, value: myAppointments.filter((a) => a.status === 'completed').length },
        { label: t.upcomingToday, value: myAppointments.filter((a) => a.status === 'scheduled' && a.date === new Date().toISOString().slice(0, 10)).length },
      ]
    : [
        { label: t.myAppointments, value: myAppointments.length },
        { label: t.queueActive, value: myQueue.filter((q) => q.status === 'waiting' || q.status === 'ongoing').length },
        { label: t.pendingPayments, value: pendingPayments },
        { label: isAdmin ? t.revenueCollected : t.totalPaid, value: `₹${paidAmount}` },
      ];

  const quickActions = [
    { to: '/appointments', label: t.manageAppts },
    ...(isDoctor ? [{ to: '/consultations', label: t.runConsultations }] : []),
    ...(isDoctor ? [{ to: '/prescriptions', label: t.issuePrescriptions }] : []),
    { to: '/records', label: t.openEMR },
    ...(isDoctor ? [] : [{ to: '/symptoms', label: t.checkSymptoms }]),
    ...(isDoctor ? [] : [{ to: '/payments', label: t.trackPayments }]),
    ...(isDoctor ? [] : [{ to: '/medicines', label: t.myMedicines }]),
    ...(isDoctor ? [] : [{ to: '/vitals', label: t.trackVitals }]),
    ...(isAdmin ? [{ to: '/admin', label: t.adminAnalytics }] : []),
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl p-6 text-white bg-[linear-gradient(120deg,#0c4a6e_0%,#1e40af_45%,#3b0764_100%)] shadow-2xl">
        <p className="text-white/80 text-sm uppercase">{(t as any)[user.role] || user.role} {(t as any).portal || 'PORTAL'}</p>
        <h2 className="text-3xl font-bold mt-1">{t.welcomeBack.replace('{name}', user.name)}</h2>
        <p className="text-white/80 mt-2">{t.dashboardSubtitle}</p>
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
          <h3 className="font-semibold text-lg">{t.liveQueue}</h3>
          <div className="mt-4 space-y-3">
            {myQueue.length === 0 && <p className="text-sm text-muted-foreground">{t.noQueueActivity}</p>}
            {myQueue.slice(0, 5).map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-medium">{q.appointmentId}</p>
                  <p className="text-xs text-muted-foreground">{(t as any).joined || 'Joined:'} {new Date(q.joinedAt).toLocaleString()}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 capitalize">{(t as any)[q.status] || q.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold text-lg">{t.quickActions}</h3>
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
