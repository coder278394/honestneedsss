/**
 * Compiled message bundles, one per supported locale.
 * Imports are static so Next.js tree-shakes unused locales appropriately and
 * the bundle has every key available for SSR.
 *
 * When the team adopts next-intl, swap this file for the next-intl loader —
 * the message key shape here is intentionally compatible.
 */

import { flattenMessages, formatMessage, type Vars } from './format';
import type { Locale } from './config';
import { DEFAULT_LOCALE } from './config';

import en from '@/messages/en.json';
import es from '@/messages/es.json';

type Bundle = Record<string, string>;

const BUNDLES: Record<Locale, Bundle> = {
  en: flattenMessages(en as Record<string, unknown>),
  es: flattenMessages(es as Record<string, unknown>),
};

export function resolveMessage(locale: Locale, key: string): string {
  const primary = BUNDLES[locale];
  if (primary && key in primary) return primary[key];
  if (locale !== DEFAULT_LOCALE) {
    const fallback = BUNDLES[DEFAULT_LOCALE];
    if (fallback && key in fallback) return fallback[key];
  }
  return key;
}

export function translate(locale: Locale, key: string, vars: Vars = {}): string {
  return formatMessage(resolveMessage(locale, key), vars, locale);
}

export function hasKey(locale: Locale, key: string): boolean {
  return (BUNDLES[locale] && key in BUNDLES[locale]) || key in BUNDLES[DEFAULT_LOCALE];
}
