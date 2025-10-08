import { createContext, useContext, useState, useEffect } from "react";
import { translations, detectBrowserLanguage } from "../utils/translations";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Initialize language from localStorage or browser detection
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem("sigale-language");
    return savedLang || detectBrowserLanguage();
  });

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem("sigale-language", language);
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  // Get translation function
  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  // Toggle between languages
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "es" ? "en" : "es"));
  };

  // Set specific language
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  const value = {
    language,
    t,
    toggleLanguage,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
