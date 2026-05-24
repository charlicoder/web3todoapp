"use client";

import { createContext } from "react";

const SettingsContext = createContext({
  theme: "dark",
  language: "en",
  toggleTheme: () => {},
  setLanguage: () => {},
  t: () => "",
  currentLanguageConfig: {}
});

export default SettingsContext;
