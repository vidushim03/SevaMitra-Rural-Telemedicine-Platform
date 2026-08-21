import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../components/translations';
import { AdminAnalytics } from '../components/admin-analytics';
import { OperationsAnalytics } from '../components/operations-analytics';
import { SessionUser, UserRole } from '../types/app';
import { Users, Stethoscope, UserCheck, BarChart3, Calendar, FileText, Trash2, Plus, X, CreditCard, IndianRupee, CheckCircle, Clock } from 'lucide-react';

type Tab = 'analytics' | 'doctors' | 'patients' | 'appointments' | 'records' | 'payments';

const SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'Neurologist',
  'Orthopedist',
  'Psychiatrist',
  'ENT Specialist',
  'Ophthalmologist',
];

export function AdminPage() {
  const { user } = useAuth();
  const { data, doctors, patients, addUser, removeUser, updateAppointmentStatus, markPayment } = useAppData();
  const { language } = useLanguage();
  const t = translations[language];

    const translateStatus = (s: string) => {
      if (s === 'completed') return t.completed;
      if (s === 'in-progress') return t.inProgress;
      if (s === 'cancelled') return (t as any).cancelled || 'Cancelled';
      if (s === 'paid') return t.paid;
      if (s === 'pending') return t.pending;
      if (s === 'failed') return t.failed;
      return s;
    };

    const translateSpecialty = (s: string) => {
      const map: Record<string, string> = {
        'General Physician': (t as any).generalPhysician,
        'Cardiologist': (t as any).cardiologist,
        'Dermatologist': (t as any).dermatologist,
        'Pediatrician': (t as any).pediatrician,
        'Gynecologist': (t as any).gynecologist,
      };
      return map[s] || s;
    };

  const [tab, setTab] = useState<Tab>('analytics');

  // Add Doctor form state
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docSpecialty, setDocSpecialty] = useState(SPECIALTIES[0]);

  // Add Patient form state
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patName, setPatName] = useState('');
  const [patEmail, setPatEmail] = useState('');

  if (!user || user.role !== 'admin') {
    return <div className="rounded-2xl border bg-card p-6">{t.adminAccessOnly}</div>;
  }

  const handleAddDoctor = (e: FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    const newDoc: SessionUser = {
      id: `doctor_${Date.now()}`,
      name: docName.trim(),
      email: docEmail.trim(),
      role: 'doctor' as UserRole,
      specialty: docSpecialty,
    };
    addUser(newDoc);
    setDocName(''); setDocEmail(''); setDocSpecialty(SPECIALTIES[0]);
    setShowAddDoctor(false);
  };

  const handleAddPatient = (e: FormEvent) => {
    e.preventDefault();
    if (!patName.trim()) return;
    const newPat: SessionUser = {
      id: `patient_${Date.now()}`,
      name: patName.trim(),
      email: patEmail.trim(),
      role: 'patient' as UserRole,
    };
    addUser(newPat);
    setPatName(''); setPatEmail('');
    setShowAddPatient(false);
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'analytics', label: t.analytics, icon: BarChart3 },
    { id: 'doctors', label: `${t.doctors} (${doctors.length})`, icon: Stethoscope },
    { id: 'patients', label: `${t.patients} (${patients.length})`, icon: UserCheck },
    { id: 'appointments', label: `${t.appointments} (${data.appointments.length})`, icon: Calendar },
    { id: 'records', label: `${t.records} (${data.records.length})`, icon: FileText },
    { id: 'payments', label: `${t.payments} (${data.payments.length})`, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t.adminPanel}</h2>
        <p className="text-muted-foreground mt-1">{t.manageUsersDesc}</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 flex-wrap border-b pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="space-y-8">
          <OperationsAnalytics />
          <div>
            <h3 className="text-xl font-bold mb-4">{t.livePlatformActivity}</h3>
            <AdminAnalytics />
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {tab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{t.registeredDoctors}</h3>
            <button
              onClick={() => setShowAddDoctor(!showAddDoctor)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} />
              {t.addDoctor}
            </button>
          </div>

          {showAddDoctor && (
            <form onSubmit={handleAddDoctor} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{t.newDoctor}</p>
                <button type="button" onClick={() => setShowAddDoctor(false)}><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={docName} onChange={e => setDocName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder={`${t.name} *`} required />
                <input value={docEmail} onChange={e => setDocEmail(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder={t.email} type="email" />
                <select value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                  {SPECIALTIES.map(s => <option key={s} value={s}>{translateSpecialty(s)}</option>)}
                </select>
              </div>
              <button className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">{t.addDoctor}</button>
            </form>
          )}

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">{t.nameLabel}</th>
                  <th className="p-3 text-left">{t.specialty}</th>
                  <th className="p-3 text-left">{t.email}</th>
                  <th className="p-3 text-left">{t.appointments}</th>
                  <th className="p-3 text-left">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => {
                  const apptCount = data.appointments.filter(a => a.doctorId === doc.id).length;
                  return (
                    <tr key={doc.id} className="border-t">
                      <td className="p-3 font-medium">{doc.name}</td>
                      <td className="p-3 text-muted-foreground">{(doc as any).specialty || '—'}</td>
                      <td className="p-3 text-muted-foreground">{doc.email || '—'}</td>
                      <td className="p-3">{apptCount}</td>
                      <td className="p-3">
                        <button
                          onClick={() => removeUser(doc.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          title={t.removeDoctor}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patients Tab */}
      {tab === 'patients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{t.registeredPatients}</h3>
            <button
              onClick={() => setShowAddPatient(!showAddPatient)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus size={15} />
              {t.addPatient}
            </button>
          </div>

          {showAddPatient && (
            <form onSubmit={handleAddPatient} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">{t.newPatient}</p>
                <button type="button" onClick={() => setShowAddPatient(false)}><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={patName} onChange={e => setPatName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder={`${t.name} *`} required />
                <input value={patEmail} onChange={e => setPatEmail(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder={t.email} type="email" />
              </div>
              <button className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium">{t.addPatient}</button>
            </form>
          )}

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">{t.nameLabel}</th>
                  <th className="p-3 text-left">{t.email}</th>
                  <th className="p-3 text-left">{t.appointments}</th>
                  <th className="p-3 text-left">{t.records}</th>
                  <th className="p-3 text-left">{t.prescriptions}</th>
                  <th className="p-3 text-left">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(pat => {
                  const apptCount = data.appointments.filter(a => a.patientId === pat.id).length;
                  const recCount = data.records.filter(r => r.patientId === pat.id).length;
                  const rxCount = data.prescriptions.filter(p => p.patientId === pat.id).length;
                  return (
                    <tr key={pat.id} className="border-t">
                      <td className="p-3 font-medium">{pat.name}</td>
                      <td className="p-3 text-muted-foreground">{pat.email || '—'}</td>
                      <td className="p-3">{apptCount}</td>
                      <td className="p-3">{recCount}</td>
                      <td className="p-3">{rxCount}</td>
                      <td className="p-3">
                        <button
                          onClick={() => removeUser(pat.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                          title={t.removePatient}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {tab === 'appointments' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">{t.allAppointments}</h3>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">{t.patient}</th>
                  <th className="p-3 text-left">{t.doctor}</th>
                  <th className="p-3 text-left">{t.when}</th>
                  <th className="p-3 text-left">{t.reason}</th>
                  <th className="p-3 text-left">{t.fee}</th>
                  <th className="p-3 text-left">{t.status}</th>
                  <th className="p-3 text-left">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data.appointments.length === 0 && (
                  <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">{t.noAppointments}</td></tr>
                )}
                {data.appointments.map(a => {
                  const patName = data.users.find(u => u.id === a.patientId)?.name || a.patientId;
                  const drName = data.users.find(u => u.id === a.doctorId)?.name || a.doctorId;
                  return (
                    <tr key={a.id} className="border-t">
                      <td className="p-3 font-medium">{patName}</td>
                      <td className="p-3">{drName}</td>
                      <td className="p-3">{a.date} {a.time}</td>
                      <td className="p-3">{a.reason}</td>
                      <td className="p-3">₹{a.fee}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          a.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                          a.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{translateStatus(a.status)}</span>
                      </td>
                      <td className="p-3 flex gap-1">
                        <button onClick={() => updateAppointmentStatus(a.id, 'completed')} className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-xs">{t.completeBtn}</button>
                        <button onClick={() => updateAppointmentStatus(a.id, 'cancelled')} className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900/30 text-xs">{t.cancel}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {tab === 'records' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">{t.allEmrRecords}</h3>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">{t.patient}</th>
                  <th className="p-3 text-left">{t.doctor}</th>
                  <th className="p-3 text-left">{t.date}</th>
                  <th className="p-3 text-left">{t.diagnosis}</th>
                  <th className="p-3 text-left">{t.notes}</th>
                </tr>
              </thead>
              <tbody>
                {data.records.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{t.noRecords}</td></tr>
                )}
                {data.records.map(r => {
                  const patName = data.users.find(u => u.id === r.patientId)?.name || r.patientId;
                  const drName = data.users.find(u => u.id === r.doctorId)?.name || r.doctorId;
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="p-3 font-medium">{patName}</td>
                      <td className="p-3">{drName}</td>
                      <td className="p-3 text-muted-foreground">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="p-3 font-medium">{r.diagnosis}</td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">{r.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{t.allBills}</h3>
            <div className="flex gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <IndianRupee size={14} />
                {t.totalCollected}: ₹{data.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock size={14} />
                {t.pending}: ₹{data.payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">{t.billId}</th>
                  <th className="p-3 text-left">{t.patient}</th>
                  <th className="p-3 text-left">{t.doctor}</th>
                  <th className="p-3 text-left">{t.consultation}</th>
                  <th className="p-3 text-left">{t.medicines}</th>
                  <th className="p-3 text-left">{t.billTotal}</th>
                  <th className="p-3 text-left">{t.status}</th>
                  <th className="p-3 text-left">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.length === 0 && (
                  <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">{t.noBillsYet}</td></tr>
                )}
                {data.payments.map(p => {
                  const patName = data.users.find(u => u.id === p.patientId)?.name || p.patientId;
                  const drName = data.users.find(u => u.id === p.doctorId)?.name || p.doctorId;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3 font-mono text-xs">{p.id}</td>
                      <td className="p-3 font-medium">{patName}</td>
                      <td className="p-3">{drName}</td>
                      <td className="p-3">₹{p.consultationFee}</td>
                      <td className="p-3">₹{p.medicineTotal}</td>
                      <td className="p-3 font-bold">₹{p.amount}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          p.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>{translateStatus(p.status)}</span>
                      </td>
                      <td className="p-3 flex gap-1">
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => markPayment(p.id, 'paid')} className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-xs">{t.markPaid}</button>
                            <button onClick={() => markPayment(p.id, 'failed')} className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900/30 text-xs">{t.failBtn}</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
