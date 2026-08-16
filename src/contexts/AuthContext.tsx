import React, { createContext, useContext, useMemo, useState } from 'react';
import { SessionUser, UserRole } from '../types/app';

interface AuthContextValue {
  user: SessionUser | null;
  login: (payload: { name: string; email: string; role: UserRole }) => void;
  logout: () => void;
}

// Demo accounts with pre-seeded data in AppDataContext. Logging in with these
// names/roles links the session to the matching seed user id (patient_demo,
// doctor_1, doctor_2, admin_1) so dashboards show real demo data.
const DEMO_ACCOUNTS: { name: string; role: UserRole; id: string }[] = [
  { name: 'Rohan Verma', role: 'patient', id: 'patient_demo' },
  { name: 'Dr. Priya Sharma', role: 'doctor', id: 'doctor_1' },
  { name: 'Dr. Rajesh Kumar', role: 'doctor', id: 'doctor_2' },
  { name: 'System Admin', role: 'admin', id: 'admin_1' },
];

const STORAGE_KEY = 'sevamitra.auth.v1';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// sessionStorage (not localStorage): the session lives for the browser session,
// so the app opens on the login page on a fresh start, but survives reloads.
function loadUser(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => loadUser());

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login: ({ name, email, role }) => {
      const demo = DEMO_ACCOUNTS.find(
        (a) => a.role === role && a.name.toLowerCase() === name.trim().toLowerCase(),
      );
      const next: SessionUser = {
        id: demo ? demo.id : `${role}_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        name: name.trim(),
        email,
        role,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
    },
    logout: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
