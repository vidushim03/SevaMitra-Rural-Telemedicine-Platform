import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'pa';

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
  pa: {
    welcome: 'ਸੇਵਾਮਿੱਤਰ ਟੈਲੀਮੈਡੀਸਨ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ',
    dashboard: 'ਡੈਸ਼ਬੋਰਡ',
    appointments: 'ਮੁਲਾਕਾਤਾਂ',
    consultations: 'ਸਲਾਹ',
    book_now: 'ਹੁਣ ਬੁੱਕ ਕਰੋ',
    active_doctors: 'ਸਰਗਰਮ ਡਾਕਟਰ',
    patients_treated: 'ਇਲਾਜ ਕੀਤੇ ਮਰੀਜ਼',
    hello: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
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
