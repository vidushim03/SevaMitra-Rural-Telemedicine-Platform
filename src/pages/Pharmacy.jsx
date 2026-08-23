import { useLanguage } from "../contexts/LanguageContext";
import { PharmacyTracker } from "../components/pharmacy-tracker";

export const PharmacyPage = () => {
  const { language } = useLanguage();
  return <PharmacyTracker language={language} />;
};
