import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from 'next-themes';
import { Activity, Calendar, CreditCard, FileText, Globe, HeartPulse, MapPin, Moon, Pill, Shield, Stethoscope, Sun, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { translations } from './components/translations';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Appointments = lazy(() => import('./pages/Appointments').then(m => ({ default: m.Appointments })));
const Consultations = lazy(() => import('./pages/Consultations').then(m => ({ default: m.Consultations })));
const RecordsPage = lazy(() => import('./pages/Records').then(m => ({ default: m.RecordsPage })));
const PrescriptionsPage = lazy(() => import('./pages/Prescriptions').then(m => ({ default: m.PrescriptionsPage })));
const PaymentsPage = lazy(() => import('./pages/Payments').then(m => ({ default: m.PaymentsPage })));
const PaymentAnalyticsPage = lazy(() => import('./pages/PaymentAnalytics').then(m => ({ default: m.PaymentAnalyticsPage })));
const AdminPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import('./pages/Login').then(m => ({ default: m.LoginPage })));
const SymptomsPage = lazy(() => import('./pages/Symptoms').then(m => ({ default: m.SymptomsPage })));
const PharmacyPage = lazy(() => import('./pages/Pharmacy').then(m => ({ default: m.PharmacyPage })));
const MedicinesPage = lazy(() => import('./pages/Medicines').then(m => ({ default: m.MedicinesPage })));
const VitalsPage = lazy(() => import('./pages/Vitals').then(m => ({ default: m.VitalsPage })));

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

const ROLE_LINKS: Record<string, { to: string; label: string; icon: typeof Activity }[]> = {
  patient: [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/symptoms', label: 'Symptom Checker', icon: Stethoscope },
    { to: '/consultations', label: 'Consultations', icon: Video },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/records', label: 'Records', icon: FileText },
    { to: '/prescriptions', label: 'Prescriptions', icon: Stethoscope },
    { to: '/medicines', label: 'Medicines', icon: Pill },
    { to: '/pharmacy', label: 'Pharmacy', icon: MapPin },
    { to: '/vitals', label: 'Vitals', icon: HeartPulse },
    { to: '/payments', label: 'Payments', icon: CreditCard },
  ],
  doctor: [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/consultations', label: 'Consultations', icon: Video },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/records', label: 'Records', icon: FileText },
    { to: '/prescriptions', label: 'Prescriptions', icon: Stethoscope },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/payment-analytics', label: 'Analytics', icon: Activity },
    { to: '/pharmacy', label: 'Pharmacy', icon: MapPin },
  ],
  admin: [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/records', label: 'Records', icon: FileText },
    { to: '/pharmacy', label: 'Pharmacy', icon: MapPin },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/payment-analytics', label: 'Analytics', icon: Activity },
    { to: '/admin', label: 'Admin', icon: Shield },
  ],
};

const ROLE_ACCESS: Record<string, string[]> = {
  patient: ['/', '/symptoms', '/consultations', '/appointments', '/records', '/prescriptions', '/medicines', '/pharmacy', '/vitals', '/payments'],
  doctor: ['/', '/consultations', '/appointments', '/records', '/prescriptions', '/payments', '/payment-analytics', '/pharmacy'],
  admin: ['/', '/appointments', '/records', '/pharmacy', '/payments', '/payment-analytics', '/admin'],
};

function AccessGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !ROLE_ACCESS[user.role]?.includes(path)) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        This page is not available for your role. Use the sidebar to navigate your portal.
      </div>
    );
  }
  return <>{children}</>;
}

function ProtectedApp() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations];

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const baseLinks = ROLE_LINKS[user.role] ?? [];
  const links = baseLinks.map(link => {
    // Map hardcoded English labels to translation keys if they match
    const key = link.label.toLowerCase().replace(' ', '') as keyof typeof t;
    return { ...link, label: t[key] || link.label };
  });

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#09090b] text-foreground transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} transition-all duration-300 border-r border-border glass flex flex-col z-10 m-4 rounded-3xl overflow-hidden relative group/sidebar`}>
        <div className="p-6 border-b border-border/50 flex items-center justify-between min-h-[90px]">
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">SevaMitra</h1>
              <p className="text-xs text-muted-foreground mt-2">{user.name} ({(t as any)[user.role] || user.role})</p>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto font-bold text-xl text-primary flex items-center justify-center">SM</div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute right-3 top-6 p-1.5 rounded-full bg-background/80 hover:bg-muted border shadow-sm text-muted-foreground opacity-0 group-hover/sidebar:opacity-100 transition-opacity"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to;
            return (
              <Link 
                key={to} 
                to={to} 
                className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-bold shadow-sm' 
                    : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground font-medium'
                }`}
                title={isCollapsed ? label : undefined}
              >
                <Icon className={`${isActive ? 'text-primary' : 'text-primary/70'} group-hover:scale-110 transition-transform`} size={isCollapsed ? 22 : 18} />
                {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={`p-4 border-t border-border/50 flex ${isCollapsed ? 'flex-col gap-4 items-center justify-center' : 'items-center justify-between'}`}>
          <ThemeToggle />
          {!isCollapsed && <LanguageToggle />}
          <button 
            onClick={logout} 
            className={`px-3 py-1 text-sm rounded-full border hover:bg-muted ${isCollapsed ? 'w-10 h-10 flex items-center justify-center p-0' : ''}`}
            title={isCollapsed ? t.logout : undefined}
          >
            {isCollapsed ? "➜" : t.logout}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto overflow-x-hidden z-10 min-w-0">
        <div className="animate-in">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="text-muted-foreground text-lg">Loading...</div></div>}>
            <Routes>
              <Route path="/" element={<AccessGuard path="/"><Dashboard /></AccessGuard>} />
              <Route path="/symptoms" element={<AccessGuard path="/symptoms"><SymptomsPage /></AccessGuard>} />
              <Route path="/appointments" element={<AccessGuard path="/appointments"><Appointments /></AccessGuard>} />
              <Route path="/consultations" element={<AccessGuard path="/consultations"><Consultations /></AccessGuard>} />
              <Route path="/records" element={<AccessGuard path="/records"><RecordsPage /></AccessGuard>} />
              <Route path="/pharmacy" element={<AccessGuard path="/pharmacy"><PharmacyPage /></AccessGuard>} />
              <Route path="/medicines" element={<AccessGuard path="/medicines"><MedicinesPage /></AccessGuard>} />
              <Route path="/vitals" element={<AccessGuard path="/vitals"><VitalsPage /></AccessGuard>} />
              <Route path="/prescriptions" element={<AccessGuard path="/prescriptions"><PrescriptionsPage /></AccessGuard>} />
              <Route path="/payments" element={<AccessGuard path="/payments"><PaymentsPage /></AccessGuard>} />
              <Route path="/payment-analytics" element={<AccessGuard path="/payment-analytics"><PaymentAnalyticsPage /></AccessGuard>} />
              <Route path="/admin" element={<AccessGuard path="/admin"><AdminPage /></AccessGuard>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-muted-foreground text-lg">Loading...</div></div>}>{user ? <Navigate to="/" replace /> : <LoginPage />}</Suspense>} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <AppDataProvider>
          <AuthProvider>
            <Router>
              <AppRouter />
            </Router>
          </AuthProvider>
        </AppDataProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
