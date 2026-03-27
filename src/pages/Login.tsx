import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/app';

export function LoginPage() {
  const { login } = useAuth();
  const [name, setName] = useState('Rohan Verma');
  const [email, setEmail] = useState('rohan@demo.com');
  const [role, setRole] = useState<UserRole>('patient');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login({ name, email, role });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#143b8f_0%,#091329_45%,#05070f_100%)] text-white flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 space-y-5 shadow-2xl">
        <h1 className="text-3xl font-bold">SevaMitra Access</h1>
        <p className="text-white/70 text-sm">Sign in as patient, doctor, or admin.</p>

        <div className="space-y-2">
          <label className="text-sm">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl bg-white/10 border border-white/25 px-4 py-3 outline-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl bg-white/10 border border-white/25 px-4 py-3 outline-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-xl bg-slate-900 border border-white/25 px-4 py-3 outline-none">
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button type="submit" className="w-full rounded-xl bg-blue-500 hover:bg-blue-400 transition py-3 font-semibold">
          Continue
        </button>
      </form>
    </div>
  );
}
