import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from './../i18n/translations';

export type Language = 'gu' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('gu'); // Default/initial language is Gujarati ('gu')

  const t = (key: string, params?: Record<string, string>): string => {
    const langDict = translations[language] || translations.gu;
    
    // Find matching key, or fallback to the key itself (which is the English phrase)
    let text = key in langDict ? (langDict as any)[key] : key;

    // Handle template parameter replacement (e.g. {serviceName})
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        text = text.replace(`{${paramKey}}`, params[paramKey]);
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
