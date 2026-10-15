'use client'

/**
 * Mid-page "What's new on HonestNeed" tile grid. Different shape from the
 * carousel so it registers as a separate signal — a scanner who tuned out
 * the carousel will still see this. Links to /whats-new for the full list.
 *
 * Shows at most 6 tiles so the section stays scannable; "See everything →"
 * footer link hands off to the directory page for the remainder.
 */

import Link from 'next/link'
import styled from 'styled-components'
import { ArrowRight } from 'lucide-react'
import { tk } from '@/styles/dashboardTokens'
import { useFeatureSpotlights } from '@/hooks/useFeatureSpotlights'
import { resolveAccent, resolveIcon } from './spotlightIcons'

const MAX_TILES = 6

const Section = styled.section`
  padding: 56px 16px 48px;
  background: ${tk.canvas};
`
const Inner = styled.div`
  max-width: 1200px; margin: 0 auto;
`
const Head = styled.header`
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
  h2 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-weight: 500; font-size: clamp(26px, 3.5vw, 34px); line-height: 1.1;
    letter-spacing: -0.02em; margin: 0; color: ${tk.heading};
    text-wrap: balance;
    em { font-style: italic; color: ${tk.red}; }
  }
  p { margin: 4px 0 0; color: ${tk.body}; font-size: 15px; max-width: 56ch; }
`
const SeeAll = styled(Link)`
  color: ${tk.red}; font-weight: 600; text-decoration: none; font-size: 14px;
  display: inline-flex; align-items: center; gap: 4px;
  &:hover { text-decoration: underline; }
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
`
const Tile = styled(Link)<{ $accent: string }>`
  position: relative;
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 12px;
  padding: 18px 18px 16px;
  display: flex; flex-direction: column; gap: 8px;
  text-decoration: none; color: inherit;
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  min-height: 150px;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px -18px rgba(24,23,26,0.3);
    border-color: ${({ $accent }) => $accent};
  }
`
const IconBox = styled.div<{ $accent: string }>`
  width: 36px; height: 36px; border-radius: 9px;
  background: ${({ $accent }) => $accent}1a;
  color: ${({ $accent }) => $accent};
  display: grid; place-items: center;
`
const Title = styled.div`
  font-weight: 600; font-size: 15px; line-height: 1.3; color: ${tk.heading};
`
const Body = styled.div`
  font-size: 13px; color: ${tk.body}; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
`
const Arrow = styled.div<{ $accent: string }>`
  margin-top: auto;
  color: ${({ $accent }) => $accent};
  font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 4px;
`
const NewPill = styled.span<{ $accent: string }>`
  position: absolute; top: 10px; right: 10px;
  display: inline-flex; align-items: center;
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 999px;
  background: ${({ $accent }) => $accent}; color: ${tk.white}; font-weight: 700;
`

export function WhatsNewTiles() {
  const { items, loading } = useFeatureSpotlights('hero')
  // Prioritise is_new; fall back to any active items so the section always
  // renders something once a few features ship. Empty state hides entirely.
  const sorted = [...items]
    .filter((s) => !s.dismissed)
    .sort((a, b) => Number(b.is_new) - Number(a.is_new) || a.priority - b.priority)
    .slice(0, MAX_TILES)

  if (loading || sorted.length === 0) return null

  return (
    <Section aria-label="What's new on HonestNeed">
      <Inner>
        <Head>
          <div>
            <h2>What's new on <em>HonestNeed</em></h2>
            <p>Every feature we've shipped recently, in one place. Tap one to try it.</p>
          </div>
          <SeeAll href="/whats-new">See everything <ArrowRight size={14} /></SeeAll>
        </Head>
        <Grid>
          {sorted.map((s) => {
            const accent = resolveAccent(s.accent)
            const Icon = resolveIcon(s.icon)
            return (
              <Tile key={s.key} href={s.href} $accent={accent}>
                {s.is_new && <NewPill $accent={accent}>New</NewPill>}
                <IconBox $accent={accent}><Icon size={18} /></IconBox>
                <Title>{s.title}</Title>
                <Body>{s.subtitle}</Body>
                <Arrow $accent={accent}>{s.cta_label} <ArrowRight size={13} /></Arrow>
              </Tile>
            )
          })}
        </Grid>
      </Inner>
    </Section>
  )
}

export default WhatsNewTiles
