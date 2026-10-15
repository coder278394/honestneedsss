'use client';

/**
 * React context + hook for i18n. Mounted inside Providers.
 *
 * Reads the cookie once on mount; falls back to defaultLocale from server
 * (passed in via props) to avoid hydration mismatch. Changing the locale
 * writes the cookie AND calls PUT /api/users/me/locale for signed-in users
 * (handled by LocaleSelector, not here — this provider just holds state).
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, SUPPORTED_LOCALES, type Locale } from './config';
import { translate } from './messages';
import type { Vars } from './format';

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, vars?: Vars) => string;
  supportedLocales: readonly Locale[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  return m ? normalizeLocale(decodeURIComponent(m[1])) : null;
}

function writeCookieLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  const oneYear = 365 * 24 * 60 * 60;
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; max-age=${oneYear}; path=/; samesite=lax`;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // After mount, upgrade from cookie if present (handles signed-out users who
  // used the selector in a previous session). Running in useEffect keeps SSR
  // deterministic and avoids hydration mismatch.
  useEffect(() => {
    const fromCookie = readCookieLocale();
    if (fromCookie && fromCookie !== locale) setLocaleState(fromCookie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeCookieLocale(next);
  }, []);

  const t = useCallback((key: string, vars?: Vars) => translate(locale, key, vars), [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, supportedLocales: SUPPORTED_LOCALES }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Falls back silently to default so a stray component outside the provider
    // doesn't crash the whole page.
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: (key: string, vars?: Vars) => translate(DEFAULT_LOCALE, key, vars),
      supportedLocales: SUPPORTED_LOCALES,
    } as I18nContextValue;
  }
  return ctx;
}
