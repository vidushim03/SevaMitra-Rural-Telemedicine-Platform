import { useLanguage } from '../contexts/LanguageContext';
import { VitalsDashboard } from '../components/vitals-dashboard';

export const VitalsPage = () => {
  const { language } = useLanguage();
  return <VitalsDashboard language={language} />;
};
