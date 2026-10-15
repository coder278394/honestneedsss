'use client'

/**
 * The thin strip at the very top of the landing page. Picks the single
 * highest-priority spotlight whose `is_new: true` is still live, shows it
 * once per viewer, and gets dismissed either explicitly (×) or implicitly
 * (viewer clicks through to the feature).
 *
 * Scope choice: ONE message, not a rotator. A rotator at this slot reads as
 * a cookie banner and gets ignored. One sentence + one CTA is what a user
 * will actually process in the first second on the page.
 *
 * Session memory lives in sessionStorage so dismissals don't bleed between
 * browsers but a reload doesn't re-nag either. Server-side dismissal
 * (persistent across devices) uses the registry's own /dismiss endpoint —
 * clicking × calls both so the choice sticks everywhere.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import { X, Sparkles, ArrowRight } from 'lucide-react'
import { tk } from '@/styles/dashboardTokens'
import { useFeatureSpotlights } from '@/hooks/useFeatureSpotlights'
import { resolveAccent, resolveIcon } from './spotlightIcons'

const SESSION_KEY = 'hn:announcement_dismissed_v1'

const Bar = styled.div<{ $accent: string }>`
  position: relative;
  background: linear-gradient(90deg, ${({ $accent }) => $accent}, ${({ $accent }) => $accent}dd);
  color: ${tk.white};
  font-size: 14px;
  line-height: 1.4;
  padding: 10px 44px 10px 16px;
  text-align: center;
  overflow: hidden;
  z-index: 50;
  @media (max-width: 640px) {
    text-align: left;
    padding: 10px 40px 10px 14px;
    font-size: 13px;
  }
`
const Inner = styled.div`
  max-width: 1200px; margin: 0 auto;
  display: inline-flex; align-items: center; gap: 10px;
  flex-wrap: wrap; justify-content: center;
  @media (max-width: 640px) { justify-content: flex-start; }
`
const Pill = styled.span`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 999px;
  background: rgba(255,255,255,0.22); color: ${tk.white};
  font-weight: 700;
`
const Message = styled.span`
  font-weight: 500;
`
const CTA = styled(Link)`
  color: ${tk.white};
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
  display: inline-flex; align-items: center; gap: 4px;
  &:hover { text-decoration-thickness: 2px; }
`
const Close = styled.button`
  position: absolute; top: 50%; right: 8px; transform: translateY(-50%);
  background: transparent; border: 0; padding: 6px;
  color: ${tk.white}; opacity: 0.75; cursor: pointer; border-radius: 6px;
  display: grid; place-items: center;
  &:hover { opacity: 1; background: rgba(255,255,255,0.14); }
`

function readSession(): Record<string, boolean> {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}') } catch { return {} }
}
function writeSession(v: Record<string, boolean>) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(v)) } catch { /* noop */ }
}

export function AnnouncementBar() {
  const { items, dismiss } = useFeatureSpotlights('hero')
  const [sessionDismissed, setSessionDismissed] = useState<Record<string, boolean>>({})

  useEffect(() => { setSessionDismissed(readSession()) }, [])

  // Highest-priority new, undismissed item. Priority is lower-is-earlier so
  // the registry's own ordering wins — operators tune "what's the headline"
  // from the admin UI, not from this file.
  const headline = useMemo(() => {
    return items.find((s) => s.is_new && !s.dismissed && !sessionDismissed[s.key])
  }, [items, sessionDismissed])

  if (!headline) return null

  const accent = resolveAccent(headline.accent)
  const Icon = resolveIcon(headline.icon)

  const close = () => {
    const next = { ...sessionDismissed, [headline.key]: true }
    setSessionDismissed(next)
    writeSession(next)
    // Fire-and-forget: persist to the server too so other devices don't re-nag.
    dismiss(headline.key)
  }

  return (
    <Bar $accent={accent} role="status">
      <Inner>
        <Pill><Sparkles size={11} /> New</Pill>
        <Icon size={16} aria-hidden style={{ opacity: 0.9 }} />
        <Message>{headline.title}</Message>
        <CTA href={headline.href} onClick={() => {
          // Clicking through counts as acknowledgement — no need to re-show.
          const next = { ...sessionDismissed, [headline.key]: true }
          writeSession(next)
        }}>
          {headline.cta_label} <ArrowRight size={14} />
        </CTA>
      </Inner>
      <Close aria-label="Dismiss announcement" onClick={close}>
        <X size={14} />
      </Close>
    </Bar>
  )
}

export default AnnouncementBar
