import { createContext, useContext, useEffect } from "react";
import { translations, detectBrowserLanguage } from "../utils/translations";
import { useLocalStorageValue } from "../hooks/useLocalStorageValue";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Persist language preference under "sigale-language"; lazy init falls
  // back to browser locale detection on first run. The hook handles the
  // try/catch so private mode / quota errors don't crash the provider.
  const [language, setLanguage] = useLocalStorageValue("sigale-language", detectBrowserLanguage);

  // Mirror the active language onto <html lang="…"> for accessibility tools.
  useEffect(() => {
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
