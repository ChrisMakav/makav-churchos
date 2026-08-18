"use client";

import { createContext, useContext, type ReactNode } from "react";
import { dictionaries, type DictionaryKey, type Locale } from "./dictionaries";

interface LocaleContextValue {
  locale: Locale;
  t: (key: DictionaryKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = dictionaries[locale];
  const t = (key: DictionaryKey) => dict[key] ?? key;
  return <LocaleContext.Provider value={{ locale, t }}>{children}</LocaleContext.Provider>;
}

export function useTranslations() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useTranslations doit être utilisé sous LocaleProvider");
  return context;
}
