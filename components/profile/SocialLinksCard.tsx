'use client'

/**
 * SocialLinksCard — fetches the current user's social/other links and renders
 * them in SocialLinksEditor pre-filled. Used inside the profile Settings tab.
 *
 * Without this wrapper the editor starts empty and the first save would
 * destructively overwrite whatever is already stored on the profile.
 */

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import SocialLinksEditor from './SocialLinksEditor'

type SocialPlatform =
  | 'facebook' | 'instagram' | 'twitter' | 'x' | 'linkedin'
  | 'tiktok' | 'youtube' | 'twitch' | 'threads'

interface SocialLink { platform: SocialPlatform; url: string }
interface OtherLink { label: string; url: string }

export default function SocialLinksCard() {
  const [loading, setLoading] = useState(true)
  const [initialSocial, setInitialSocial] = useState<SocialLink[]>([])
  const [initialOther, setInitialOther] = useState<OtherLink[]>([])
  const [initialPrimary, setInitialPrimary] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await apiClient.get<{ data?: { social_links?: SocialLink[]; other_links?: OtherLink[]; primary_social_platform?: string | null } }>(
          '/users/me/profile'
        )
        if (cancelled) return
        const p = (data && (data.data || data as unknown)) as Record<string, unknown>
        setInitialSocial(Array.isArray(p?.social_links) ? (p.social_links as SocialLink[]) : [])
        setInitialOther(Array.isArray(p?.other_links) ? (p.other_links as OtherLink[]) : [])
        setInitialPrimary(typeof p?.primary_social_platform === 'string' ? (p.primary_social_platform as string) : null)
      } catch {
        // Fall back to empty — editor still works, user can add links fresh.
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <p style={{ color: '#8C8790', fontSize: 14, margin: 0 }}>Loading your links…</p>
  }

  return (
    <SocialLinksEditor
      initialSocial={initialSocial}
      initialOther={initialOther}
      initialPrimary={initialPrimary}
    />
  )
}
