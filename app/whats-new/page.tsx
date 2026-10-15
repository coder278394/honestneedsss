'use client'

/**
 * The one page that answers "what can I do here?". Every feature in the
 * registry renders as a card with its CTA — grouped by accent so related
 * features visually cluster without the backend needing a `group` field.
 */

import Link from 'next/link'
import styled from 'styled-components'
import { X } from 'lucide-react'
import { tk } from '@/styles/dashboardTokens'
import { useFeatureSpotlights } from '@/hooks/useFeatureSpotlights'
import { resolveIcon, resolveAccent } from '@/features/discovery/spotlightIcons'

const Page = styled.div`
  min-height: 100vh;
  background: ${tk.canvas};
  padding: 32px 16px 72px;
`
const Inner = styled.div`
  max-width: 1200px; margin: 0 auto;
`
const Head = styled.header`
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid ${tk.border};
  h1 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-weight: 400; font-size: clamp(28px, 5vw, 44px); line-height: 1.1;
    letter-spacing: -0.02em; margin: 0 0 10px; color: ${tk.heading};
    text-wrap: balance;
    em { font-style: italic; color: ${tk.red}; }
  }
  p { max-width: 60ch; color: ${tk.body}; font-size: 16px; margin: 0; }
`
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`
const Card = styled.div<{ $accent: string; $dismissed: boolean }>`
  position: relative;
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-top: 3px solid ${({ $accent }) => $accent};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 190px;
  opacity: ${({ $dismissed }) => ($dismissed ? 0.55 : 1)};
  transition: transform 160ms ease, box-shadow 160ms ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 24px -14px rgba(24,23,26,0.3); }
`
const IconWrap = styled.div<{ $accent: string }>`
  width: 40px; height: 40px; border-radius: 10px;
  background: ${({ $accent }) => $accent}22;
  color: ${({ $accent }) => $accent};
  display: grid; place-items: center;
`
const Title = styled.h3`
  font-family: 'DM Serif Display', serif;
  font-weight: 500; font-size: 18px; margin: 0; color: ${tk.heading};
  text-wrap: balance;
`
const NewPill = styled.span<{ $accent: string }>`
  display: inline-flex; align-items: center;
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 7px; border-radius: 999px;
  background: ${({ $accent }) => $accent}; color: ${tk.white}; font-weight: 700;
  margin-right: 6px; vertical-align: 2px;
`
const Body = styled.p`
  margin: 0; font-size: 14px; color: ${tk.body};
`
const CTA = styled(Link)<{ $accent: string }>`
  margin-top: auto;
  display: inline-block; align-self: flex-start;
  color: ${({ $accent }) => $accent};
  font-weight: 600; font-size: 14px;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`
const Dismiss = styled.button`
  position: absolute; top: 10px; right: 10px;
  background: transparent; border: 0; padding: 4px;
  color: ${tk.muted}; cursor: pointer; border-radius: 6px;
  &:hover { color: ${tk.heading}; background: ${tk.border}44; }
`

export default function WhatsNewPage() {
  const { items, loading, err, dismiss } = useFeatureSpotlights('directory')

  if (err) {
    return (
      <Page><Inner><Head><h1>Couldn't load features</h1><p>{err}</p></Head></Inner></Page>
    )
  }

  return (
    <Page>
      <Inner>
        <Head>
          <h1>Everything you can do on <em>HonestNeed</em></h1>
          <p>
            One page, every feature. If you were wondering whether we have something — look here first.
            New features are marked with a <strong>New</strong> pill.
          </p>
        </Head>

        {loading && !items.length ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} $accent={tk.border} $dismissed={false} />
            ))}
          </Grid>
        ) : (
          <Grid>
            {items.map((s) => {
              const accent = resolveAccent(s.accent)
              const Icon = resolveIcon(s.icon)
              return (
                <Card key={s.key} $accent={accent} $dismissed={s.dismissed}>
                  {!s.dismissed && (
                    <Dismiss aria-label="Dismiss" onClick={() => dismiss(s.key)}>
                      <X size={14} />
                    </Dismiss>
                  )}
                  <IconWrap $accent={accent}>
                    <Icon size={20} />
                  </IconWrap>
                  <Title>
                    {s.is_new && <NewPill $accent={accent}>New</NewPill>}
                    {s.title}
                  </Title>
                  <Body>{s.body || s.subtitle}</Body>
                  <CTA $accent={accent} href={s.href}>{s.cta_label} →</CTA>
                </Card>
              )
            })}
          </Grid>
        )}
      </Inner>
    </Page>
  )
}
