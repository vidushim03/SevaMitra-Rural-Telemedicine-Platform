import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { AdminAnalytics } from '../components/admin-analytics';
import { OperationsAnalytics } from '../components/operations-analytics';
import { SessionUser, UserRole } from '../types/app';
import { Users, Stethoscope, UserCheck, BarChart3, Calendar, FileText, Trash2, Plus, X } from 'lucide-react';

type Tab = 'analytics' | 'doctors' | 'patients' | 'appointments' | 'records';

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
  const { data, doctors, patients, addUser, removeUser, updateAppointmentStatus } = useAppData();
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
    return <div className="rounded-2xl border bg-card p-6">Admin access only.</div>;
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
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'doctors', label: `Doctors (${doctors.length})`, icon: Stethoscope },
    { id: 'patients', label: `Patients (${patients.length})`, icon: UserCheck },
    { id: 'appointments', label: `Appointments (${data.appointments.length})`, icon: Calendar },
    { id: 'records', label: `Records (${data.records.length})`, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Admin Panel</h2>
        <p className="text-muted-foreground mt-1">Manage users, appointments, records, and platform analytics.</p>
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
            <h3 className="text-xl font-bold mb-4">Live Platform Activity</h3>
            <AdminAnalytics />
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {tab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Registered Doctors</h3>
            <button
              onClick={() => setShowAddDoctor(!showAddDoctor)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} />
              Add Doctor
            </button>
          </div>

          {showAddDoctor && (
            <form onSubmit={handleAddDoctor} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">New Doctor</p>
                <button type="button" onClick={() => setShowAddDoctor(false)}><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={docName} onChange={e => setDocName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="Full name *" required />
                <input value={docEmail} onChange={e => setDocEmail(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="Email" type="email" />
                <select value={docSpecialty} onChange={e => setDocSpecialty(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                  {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">Add Doctor</button>
            </form>
          )}

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Specialty</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Appointments</th>
                  <th className="p-3 text-left">Action</th>
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
                          title="Remove doctor"
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
            <h3 className="text-xl font-bold">Registered Patients</h3>
            <button
              onClick={() => setShowAddPatient(!showAddPatient)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus size={15} />
              Add Patient
            </button>
          </div>

          {showAddPatient && (
            <form onSubmit={handleAddPatient} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-sm">New Patient</p>
                <button type="button" onClick={() => setShowAddPatient(false)}><X size={16} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={patName} onChange={e => setPatName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="Full name *" required />
                <input value={patEmail} onChange={e => setPatEmail(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" placeholder="Email" type="email" />
              </div>
              <button className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium">Add Patient</button>
            </form>
          )}

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Appointments</th>
                  <th className="p-3 text-left">Records</th>
                  <th className="p-3 text-left">Prescriptions</th>
                  <th className="p-3 text-left">Action</th>
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
                          title="Remove patient"
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
          <h3 className="text-xl font-bold">All Appointments</h3>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Patient</th>
                  <th className="p-3 text-left">Doctor</th>
                  <th className="p-3 text-left">When</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Fee</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.appointments.length === 0 && (
                  <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No appointments.</td></tr>
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
                        }`}>{a.status}</span>
                      </td>
                      <td className="p-3 flex gap-1">
                        <button onClick={() => updateAppointmentStatus(a.id, 'completed')} className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-xs">Complete</button>
                        <button onClick={() => updateAppointmentStatus(a.id, 'cancelled')} className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-900/30 text-xs">Cancel</button>
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
          <h3 className="text-xl font-bold">All EMR Records</h3>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Patient</th>
                  <th className="p-3 text-left">Doctor</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Diagnosis</th>
                  <th className="p-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.records.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No records.</td></tr>
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
    </div>
  );
}
