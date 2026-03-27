import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es' | 'hi' | 'fr';

interface Translations {
  [key: string]: Record<string, string>;
}

const translations: Translations = {
  en: {
    welcome: 'Welcome to SevaMitra Telemedicine',
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    consultations: 'Consultations',
    book_now: 'Book Now',
    active_doctors: 'Active Doctors',
    patients_treated: 'Patients Treated',
    hello: 'Hello',
  },
  es: {
    welcome: 'Bienvenido a la Telemedicina SevaMitra',
    dashboard: 'Tablero',
    appointments: 'Citas',
    consultations: 'Consultas',
    book_now: 'Reservar',
    active_doctors: 'Doctores Activos',
    patients_treated: 'Pacientes Tratados',
    hello: 'Hola',
  },
  hi: {
    welcome: 'सेवामित्र टेलीमेडिसिन में आपका स्वागत है',
    dashboard: 'डैशबोर्ड',
    appointments: 'नियुक्तियाँ',
    consultations: 'परामर्श',
    book_now: 'बुक करें',
    active_doctors: 'सक्रिय डॉक्टर',
    patients_treated: 'उपचारित रोगी',
    hello: 'नमस्ते',
  },
  fr: {
    welcome: 'Bienvenue sur SevaMitra Télémédecine',
    dashboard: 'Tableau de Bord',
    appointments: 'Rendez-vous',
    consultations: 'Consultations',
    book_now: 'Réserver',
    active_doctors: 'Médecins Actifs',
    patients_treated: 'Patients Traités',
    hello: 'Bonjour',
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
