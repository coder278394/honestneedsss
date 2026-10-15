'use client';

/**
 * Locale selector — accessible, keyboard-navigable native <select> for v1.
 * Mounted in the layout header; also persists the choice to the backend when
 * the user is signed in (so emails and future API-emitted copy follow).
 */

import { useCallback, useId } from 'react';
import { toast } from 'react-toastify';

import { useT } from '@/lib/i18n/I18nProvider';
import { LOCALE_LABELS, type Locale, SUPPORTED_LOCALES } from '@/lib/i18n/config';
import { apiClient } from '@/lib/api';

export default function LocaleSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useT();
  const id = useId();

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as Locale;
      if (!SUPPORTED_LOCALES.includes(next)) return;
      setLocale(next);

      // Fire-and-forget persist for signed-in users. Errors are logged, not
      // surfaced loudly — the cookie carries the preference anyway.
      try {
        await apiClient.put('/api/users/me/locale', { locale: next });
      } catch (err: unknown) {
        // 401 is expected when signed out; swallow it.
        const status = (err as { response?: { status?: number } } | undefined)?.response?.status;
        if (status && status !== 401) {
          const message = err instanceof Error ? err.message : 'Could not save language preference.';
          toast.error(message);
        }
      }
    },
    [setLocale]
  );

  return (
    <label htmlFor={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
      <span style={compact ? { position: 'absolute', left: -9999 } : undefined}>{t('nav.language')}</span>
      <select
        id={id}
        value={locale}
        onChange={onChange}
        aria-label={t('nav.language')}
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          background: '#fff',
          cursor: 'pointer',
          minHeight: 36, // 44px tap target when combined with surrounding padding
        }}
      >
        {SUPPORTED_LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_LABELS[loc]}
          </option>
        ))}
      </select>
    </label>
  );
}
