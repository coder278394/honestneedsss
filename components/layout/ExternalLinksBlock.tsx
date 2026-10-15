'use client'

/**
 * ExternalLinksBlock — config-driven social + program links.
 *
 * Reads from `GET /api/public-config/external-links` which returns the
 * `external_links` PlatformSettings value. Shape:
 *   {
 *     social:   [{ platform: 'facebook'|'instagram'|'twitter'|'x'|'linkedin'|'tiktok'|'youtube', url }],
 *     programs: [{ label: 'Justice Lifts', url, kind?: 'justice_lifts'|'battle_buddies'|'other' }]
 *   }
 *
 * External links render with rel="nofollow noopener noreferrer" + target=_blank.
 * The copy is editable without a redeploy — just update the PlatformSettings
 * row in the admin config UI.
 */

import { useEffect, useState } from 'react'

import { apiClient } from '@/lib/api'

// Brand icons as inline SVG. The installed `lucide-react` (v1.8.0 — pre-rename)
// does not export Facebook/Instagram/Twitter/Linkedin/Youtube/Twitch, and more
// recent lucide releases dropped them for trademark reasons. Keeping these
// inline sidesteps both problems and never breaks on a lucide upgrade.
type IconProps = { size?: number }
const Facebook = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" /></svg>
)
const Instagram = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
)
const Twitter = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21l-6.52 7.45L22 22h-6.75l-5.29-6.92L3.9 22H1.14l6.98-7.98L2 2h6.91l4.79 6.32L18.244 2zm-2.37 18h1.86L7.21 4h-2L15.874 20z" /></svg>
)
const Linkedin = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
)
const Youtube = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
)
const Twitch = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" /></svg>
)

interface SocialEntry {
  platform:
    | 'facebook'
    | 'instagram'
    | 'twitter'
    | 'x'
    | 'linkedin'
    | 'tiktok'
    | 'youtube'
    | 'twitch'
    | 'threads'
  url: string
}
interface ProgramEntry {
  label: string
  url: string
  kind?: string
}
interface ExternalLinks {
  social: SocialEntry[]
  programs: ProgramEntry[]
}

const DEFAULT_LINKS: ExternalLinks = { social: [], programs: [] }

function iconFor(platform: SocialEntry['platform']) {
  switch (platform) {
    case 'facebook':
      return <Facebook size={18} />
    case 'instagram':
      return <Instagram size={18} />
    case 'twitter':
    case 'x':
      return <Twitter size={18} />
    case 'linkedin':
      return <Linkedin size={18} />
    case 'youtube':
      return <Youtube size={18} />
    case 'twitch':
      return <Twitch size={18} />
    default:
      return <span aria-hidden style={{ fontWeight: 700 }}>{platform.slice(0, 1).toUpperCase()}</span>
  }
}

export default function ExternalLinksBlock() {
  const [data, setData] = useState<ExternalLinks>(DEFAULT_LINKS)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        // apiClient's baseURL already ends with /api — the path here is relative to that.
        const res = await apiClient.get<{ data: ExternalLinks }>('/public-config/external-links')
        if (active && res.data?.data) {
          setData({
            social: Array.isArray(res.data.data.social) ? res.data.data.social : [],
            programs: Array.isArray(res.data.data.programs) ? res.data.data.programs : [],
          })
        }
      } catch {
        // Public endpoint; silent fallback to empty default.
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (!data.social.length && !data.programs.length) return null

  return (
    <nav
      aria-label="External links and social media"
      style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '12px 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {data.social.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 12 }}>
          {data.social.map((s) => (
            <li key={`${s.platform}-${s.url}`}>
              <a
                href={s.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label={`${s.platform} (opens in a new tab)`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  textDecoration: 'none',
                }}
              >
                {iconFor(s.platform)}
              </a>
            </li>
          ))}
        </ul>
      )}

      {data.programs.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {data.programs.map((p) => (
            <li key={`${p.label}-${p.url}`}>
              <a
                href={p.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                style={{ color: '#fff', textDecoration: 'underline', opacity: 0.9 }}
              >
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
