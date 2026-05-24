"use client";

import { useState, useEffect } from "react";
import SettingsContext from "./SettingsContext";
import { translations, languages } from "./translations";

export default function SettingsProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguageState] = useState("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const savedTheme = localStorage.getItem("web3todo-theme") || "dark";
    const savedLanguage = localStorage.getItem("web3todo-lang") || "en";
    
    setTheme(savedTheme);
    setLanguageState(savedLanguage);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Apply theme class to document element
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("web3todo-theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;

    // Apply text direction and lang attribute to html tag
    const root = document.documentElement;
    const langConfig = languages.find(l => l.code === language) || languages[0];
    root.setAttribute("lang", language);
    root.setAttribute("dir", langConfig.dir);
    
    localStorage.setItem("web3todo-lang", language);
  }, [language, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
    }
  };

  // Translation helper function
  const t = (key) => {
    if (!translations[language]) return translations["en"][key] || key;
    return translations[language][key] || translations["en"][key] || key;
  };

  const currentLanguageConfig = languages.find(l => l.code === language) || languages[0];

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setLanguage,
        t,
        currentLanguageConfig,
        languages
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
