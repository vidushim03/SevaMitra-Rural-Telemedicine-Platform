import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { SymptomChecker } from "../components/symptom-checker";

export const SymptomsPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <SymptomChecker
      language={language}
      onPageChange={(page) => {
        if (page === "consultation") navigate("/consultations");
      }}
    />
  );
};
