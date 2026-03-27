import React, { createContext, useContext, useMemo, useState } from 'react';
import { SessionUser, UserRole } from '../types/app';

interface AuthContextValue {
  user: SessionUser | null;
  login: (payload: { name: string; email: string; role: UserRole }) => void;
  logout: () => void;
}

const STORAGE_KEY = 'sevamitra.auth.v1';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
      const next: SessionUser = {
        id: `${role}_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        name,
        email,
        role,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEY);
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
