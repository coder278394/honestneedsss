/**
 * Frontend i18n config — mirrors backend `src/config/i18n.js`.
 *
 * Keep the locale allowlist, default, and cookie name identical on both sides,
 * or server-rendered pages will disagree with the client about which locale to
 * render in. The cookie name `nf_locale` is the single source of persistence
 * for signed-out users.
 */

export const SUPPORTED_LOCALES = ['en', 'es'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_COOKIE = 'nf_locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export function isLocale(x: unknown): x is Locale {
  return typeof x === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(x);
}

export function normalizeLocale(input: unknown): Locale | null {
  if (typeof input !== 'string') return null;
  const cleaned = input.trim().toLowerCase().replace('_', '-');
  if (!cleaned) return null;
  if (isLocale(cleaned)) return cleaned as Locale;
  const primary = cleaned.split('-')[0];
  if (isLocale(primary)) return primary as Locale;
  return null;
}
