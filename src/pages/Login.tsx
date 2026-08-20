import { FormEvent, useState, useEffect } from 'react';
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

  const [role, setRole] = useState<UserRole>('doctor');
  
  // Get all users for the currently selected role
  const roleUsers = data.users.filter(u => u.role === role);
  
  // Default to the first user in that role if available
  const [selectedUserId, setSelectedUserId] = useState(roleUsers.length > 0 ? roleUsers[0].id : '');

  useEffect(() => {
    // When role changes, update the selected user to the first one in the new role
    const newRoleUsers = data.users.filter(u => u.role === role);
    if (newRoleUsers.length > 0) {
      setSelectedUserId(newRoleUsers[0].id);
    } else {
      setSelectedUserId('');
    }
  }, [role, data.users]);

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const user = data.users.find(u => u.id === selectedUserId);
    if (user) {
      login({ name: user.name, email: user.email || `${user.id}@demo.com`, role: user.role });
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

          <div className="space-y-2">
            <label className="text-sm">Select User</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)} 
              className="w-full rounded-xl bg-slate-900 border border-white/25 px-4 py-3 outline-none"
              required
            >
              {roleUsers.length === 0 && <option value="" disabled>No {role}s available</option>}
              {roleUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email || `${u.id}@demo.com`})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 transition py-3 font-semibold" disabled={!selectedUserId}>
            {t.continueBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
