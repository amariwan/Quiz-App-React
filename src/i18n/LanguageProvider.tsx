'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import de from './locales/de.json';
import en from './locales/en.json';

type Locale = 'en' | 'de';
type Translations = Record<string, string>;

const locales: Record<Locale, Translations> = { en, de };

type I18nContextShape = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextShape>({
  locale: 'de',
  setLocale: () => {},
  t: (k: string) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const saved =
        typeof window !== 'undefined' ? (localStorage.getItem('locale') as Locale | null) : null;
      if (saved && (saved === 'en' || saved === 'de')) return saved;
      if (typeof navigator !== 'undefined') {
        const nav = navigator.language?.split('-')[0] as Locale | undefined;
        if (nav && (nav === 'en' || nav === 'de')) return nav;
      }
    } catch (e) {
      // ignore
    }
    return 'de';
  });

  useEffect(() => {
    try {
      localStorage.setItem('locale', locale);
      if (typeof document !== 'undefined') document.documentElement.lang = locale;
    } catch (e) {
      // ignore
    }
  }, [locale]);

  const t = (key: string, vars?: Record<string, string | number>) => {
    const str = (locales[locale] && locales[locale][key]) || key;
    if (!vars) return str;
    return Object.keys(vars).reduce(
      (s, k) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k])),
      str,
    );
  };

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
