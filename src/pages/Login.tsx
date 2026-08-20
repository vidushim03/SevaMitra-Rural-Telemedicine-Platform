import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { UserRole } from '../types/app';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../components/translations';

export function LoginPage() {
  const { login } = useAuth();
  const { data } = useAppData();
  const { language } = useLanguage();
  const t = translations[language];

  const [role, setRole] = useState<UserRole>('patient');
  
  // For Patient
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');

  // For Doctor
  const doctorUsers = data.users.filter(u => u.role === 'doctor');
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorUsers.length > 0 ? doctorUsers[0].id : '');

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (role === 'doctor') {
      const doc = doctorUsers.find(u => u.id === selectedDoctorId);
      if (doc) {
        login({ name: doc.name, email: doc.email || `${doc.id}@demo.com`, role: 'doctor' });
      }
    } else if (role === 'patient') {
      login({ name: patientName, email: patientEmail, role: 'patient' });
    } else if (role === 'admin') {
      login({ name: 'System Admin', email: 'admin@demo.com', role: 'admin' });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#143b8f_0%,#091329_45%,#05070f_100%)] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">
        <form onSubmit={onSubmit} className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 space-y-5 shadow-2xl">
          <h1 className="text-3xl font-bold">SevaMitra Access</h1>
          <p className="text-white/70 text-sm">{t.signInDescription}</p>

          <div className="space-y-2">
            <label className="text-sm">{t.role}</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-xl bg-slate-900 border border-white/25 px-4 py-3 outline-none">
              <option value="patient">{t.patient}</option>
              <option value="doctor">{t.doctor}</option>
              <option value="admin">{t.admin}</option>
            </select>
          </div>

          {role === 'patient' && (
            <>
              <div className="space-y-2">
                <label className="text-sm">{t.name}</label>
                <input value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full rounded-xl bg-white/10 border border-white/25 px-4 py-3 outline-none" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm">{t.email}</label>
                <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} className="w-full rounded-xl bg-white/10 border border-white/25 px-4 py-3 outline-none" required />
              </div>
            </>
          )}

          {role === 'doctor' && (
            <div className="space-y-2">
              <label className="text-sm">Select Doctor</label>
              <select 
                value={selectedDoctorId} 
                onChange={(e) => setSelectedDoctorId(e.target.value)} 
                className="w-full rounded-xl bg-slate-900 border border-white/25 px-4 py-3 outline-none"
                required
              >
                {doctorUsers.length === 0 && <option value="" disabled>No doctors available</option>}
                {doctorUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email || `${u.id}@demo.com`})
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === 'admin' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
              You will be signed in securely as System Administrator (admin@demo.com).
            </div>
          )}

          <button type="submit" className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 transition py-3 font-semibold" disabled={role === 'doctor' && !selectedDoctorId}>
            {t.continueBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
