import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Languages } from "lucide-react";

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
  ];

  return (
    <div className="flex items-center gap-2">
      <Languages className="w-5 h-5" />
      <Select value={currentLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-32 bg-white border-2 border-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="py-3">
              <span className="block">{lang.native}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}