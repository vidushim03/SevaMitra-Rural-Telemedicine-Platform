import React, { createContext, useContext, useState } from "react";

const translations = {
  en: {
    welcome: "Welcome to SevaMitra Telemedicine",
    dashboard: "Dashboard",
    appointments: "Appointments",
    consultations: "Consultations",
    book_now: "Book Now",
    active_doctors: "Active Doctors",
    patients_treated: "Patients Treated",
    hello: "Hello",
  },
  hi: {
    welcome: "सेवामित्र टेलीमेडिसिन में आपका स्वागत है",
    dashboard: "डैशबोर्ड",
    appointments: "नियुक्तियाँ",
    consultations: "परामर्श",
    book_now: "बुक करें",
    active_doctors: "सक्रिय डॉक्टर",
    patients_treated: "उपचारित रोगी",
    hello: "नमस्ते",
  },
  pa: {
    welcome: "ਸੇਵਾਮਿੱਤਰ ਟੈਲੀਮੈਡੀਸਨ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ",
    dashboard: "ਡੈਸ਼ਬੋਰਡ",
    appointments: "ਮੁਲਾਕਾਤਾਂ",
    consultations: "ਸਲਾਹ",
    book_now: "ਹੁਣ ਬੁੱਕ ਕਰੋ",
    active_doctors: "ਸਰਗਰਮ ਡਾਕਟਰ",
    patients_treated: "ਇਲਾਜ ਕੀਤੇ ਮਰੀਜ਼",
    hello: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ",
  },
};

const LanguageContext = createContext(undefined);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const t = (key) => {
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
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
