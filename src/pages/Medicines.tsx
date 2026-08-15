import { useLanguage } from '../contexts/LanguageContext';
import { MedicineTracker } from '../components/medicine-tracker';

export const MedicinesPage = () => {
  const { language } = useLanguage();
  return <MedicineTracker language={language} />;
};
