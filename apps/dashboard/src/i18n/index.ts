import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import en from './en';
import hi from './hi';
import es from './es';

// ─── Types ──────────────────────────────────────────────────────
export type Locale = 'en' | 'hi' | 'es';
export type Translations = typeof en;

// ─── Translation map ────────────────────────────────────────────
const translations: Record<Locale, Translations> = { en, hi, es };

// ─── Context ────────────────────────────────────────────────────
interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
  availableLocales: { code: Locale; label: string }[];
}

const STORAGE_KEY = 'crowdshield-locale';

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: en,
  setLocale: () => {},
  availableLocales: [],
});

// ─── Provider ───────────────────────────────────────────────────
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'es')) return saved;
    } catch {}
    // Auto-detect from browser
    const lang = navigator.language?.slice(0, 2);
    if (lang === 'hi') return 'hi';
    if (lang === 'es') return 'es';
    return 'en';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try { localStorage.setItem(STORAGE_KEY, newLocale); } catch {}
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    t: translations[locale],
    setLocale,
    availableLocales: [
      { code: 'en', label: 'English' },
      { code: 'hi', label: 'हिन्दी' },
      { code: 'es', label: 'Español' },
    ],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────
export function useI18n() {
  return useContext(I18nContext);
}

// ─── Language Selector Component ────────────────────────────────
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, availableLocales } = useI18n();

  if (compact) {
    return (
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        style={{
          background: 'rgba(18,18,26,0.85)',
          color: '#B5AC8A',
          border: '1px solid rgba(181,172,138,0.2)',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {availableLocales.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {availableLocales.map((l) => (
        <button
          key={l.code}
          onClick={() => setLocale(l.code)}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: `1px solid ${locale === l.code ? '#C50022' : 'rgba(181,172,138,0.15)'}`,
            background: locale === l.code ? 'rgba(197,0,34,0.15)' : 'transparent',
            color: locale === l.code ? '#C50022' : '#8a8580',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
