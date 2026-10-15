'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

export type SpotlightSurface = 'hero' | 'directory' | 'nav_badge'

export interface Spotlight {
  key: string
  title: string
  subtitle: string
  body: string | null
  href: string
  cta_label: string
  icon: string
  accent: string
  audience: string
  is_new: boolean
  dismissed: boolean
  priority: number
}

interface Resp {
  success: boolean
  data: { items: Spotlight[] }
}

/**
 * Fetches feature spotlights for the current viewer.
 *
 * The backend filters by audience (role, veteran, new_user, dismissed), so the
 * frontend never has to decide what a given person is allowed to see — it just
 * renders the list it gets back.
 */
export function useFeatureSpotlights(surface?: SpotlightSurface) {
  const [items, setItems] = useState<Spotlight[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const q = surface ? `?surface=${encodeURIComponent(surface)}` : ''
      const { data } = await apiClient.get<Resp>(`/feature-spotlights${q}`, {
        silentStatuses: [401, 403],
      })
      setItems(data.data.items || [])
      setErr(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [surface])

  useEffect(() => {
    load()
  }, [load])

  const dismiss = useCallback(
    async (key: string) => {
      // Optimistic — the user sees the card leave immediately. If the POST fails
      // we restore it on next load.
      setItems((prev) =>
        surface === 'nav_badge' ? prev.filter((s) => s.key !== key) : prev.map((s) => (s.key === key ? { ...s, dismissed: true } : s))
      )
      try {
        await apiClient.post(`/feature-spotlights/${encodeURIComponent(key)}/dismiss`)
      } catch {
        load()
      }
    },
    [load, surface]
  )

  return { items, loading, err, dismiss, reload: load }
}
