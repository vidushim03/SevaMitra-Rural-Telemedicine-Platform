import React from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider, useTheme } from 'next-themes';
import { Activity, Calendar, CreditCard, FileText, Globe, HeartPulse, MapPin, Moon, Pill, Shield, Stethoscope, Sun, Video } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { Dashboard } from './pages/Dashboard';
import { Appointments } from './pages/Appointments';
import { Consultations } from './pages/Consultations';
import { RecordsPage } from './pages/Records';
import { PrescriptionsPage } from './pages/Prescriptions';
import { PaymentsPage } from './pages/Payments';
import { AdminPage } from './pages/Admin';
import { LoginPage } from './pages/Login';
import { SymptomsPage } from './pages/Symptoms';
import { PharmacyPage } from './pages/Pharmacy';
import { MedicinesPage } from './pages/Medicines';
import { VitalsPage } from './pages/Vitals';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  const toggleLanguage = () => {
    const langs: ('en' | 'hi' | 'pa')[] = ['en', 'hi', 'pa'];
    const nextIdx = (langs.indexOf(language) + 1) % langs.length;
    setLanguage(langs[nextIdx]);
  };
  return (
    <button onClick={toggleLanguage} className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-semibold uppercase text-sm">
      <Globe size={20} />
      {language}
    </button>
  );
};

function ProtectedApp() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const links = [
    { to: '/', label: t('dashboard'), icon: Activity },
    { to: '/symptoms', label: 'Symptom Checker', icon: Stethoscope },
    { to: '/consultations', label: 'Consultations', icon: Video },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/records', label: 'Records', icon: FileText },
    { to: '/pharmacy', label: 'Pharmacy', icon: MapPin },
    { to: '/medicines', label: 'Medicines', icon: Pill },
    { to: '/vitals', label: 'Vitals', icon: HeartPulse },
    { to: '/prescriptions', label: 'Prescriptions', icon: Stethoscope },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#09090b] text-foreground transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

      <aside className="w-72 border-r border-border glass flex flex-col z-10 m-4 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">SevaMitra</h1>
          <p className="text-xs text-muted-foreground mt-2">{user.name} ({user.role})</p>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-primary/10 text-sm font-medium transition-all group">
              <Icon className="text-primary group-hover:scale-110 transition-transform" size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border/50 flex items-center justify-between">
          <ThemeToggle />
          <LanguageToggle />
          <button onClick={logout} className="px-3 py-1 text-sm rounded-full border hover:bg-muted">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="animate-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/symptoms" element={<SymptomsPage />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/pharmacy" element={<PharmacyPage />} />
            <Route path="/medicines" element={<MedicinesPage />} />
            <Route path="/vitals" element={<VitalsPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <AuthProvider>
          <AppDataProvider>
            <Router>
              <AppRouter />
            </Router>
          </AppDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
