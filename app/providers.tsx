'use client'

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthHydrator } from './auth-hydrator'
import ChunkErrorReloader from '@/components/ChunkErrorReloader'
import { I18nProvider } from '@/lib/i18n/I18nProvider'
import type { Locale } from '@/lib/i18n/config'

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChunkErrorReloader />
      <I18nProvider initialLocale={initialLocale}>
        <AuthHydrator>{children}</AuthHydrator>
      </I18nProvider>
    </QueryClientProvider>
  )
}
