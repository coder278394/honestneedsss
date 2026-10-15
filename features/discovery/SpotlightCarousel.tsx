'use client'

/**
 * Home-page hero rail: a rotating banner that shows one spotlight at a time
 * with next/prev chevrons, auto-advance every 7 seconds, and an X to dismiss.
 * One-element-at-a-time (not a grid) is the "very noticeable" shape — a
 * stat tile row would just add to the noise.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { tk } from '@/styles/dashboardTokens'
import { useFeatureSpotlights } from '@/hooks/useFeatureSpotlights'
import { resolveIcon, resolveAccent } from './spotlightIcons'

const AUTO_MS = 7000

const Shell = styled.section`
  margin: 20px auto;
  max-width: 1200px;
  padding: 0 16px;
`
const slideIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
`
const Card = styled.div<{ $accent: string }>`
  position: relative;
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-left: 4px solid ${({ $accent }) => $accent};
  border-radius: 14px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 18px;
  align-items: center;
  box-shadow: 0 10px 30px -18px rgba(24,23,26,0.25);
  min-height: 112px;
  animation: ${slideIn} 320ms cubic-bezier(.2,.8,.2,1);
  @media (max-width: 640px) {
    grid-template-columns: 44px 1fr;
    padding: 18px 18px 20px;
  }
`
const Pulse = styled.div<{ $accent: string }>`
  width: 56px; height: 56px; border-radius: 12px;
  background: ${({ $accent }) => $accent}22;
  color: ${({ $accent }) => $accent};
  display: grid; place-items: center;
  @media (max-width: 640px) { width: 44px; height: 44px; }
`
const Copy = styled.div`
  min-width: 0;
`
const NewPill = styled.span<{ $accent: string }>`
  display: inline-flex; align-items: center;
  font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 999px;
  background: ${({ $accent }) => $accent}; color: ${tk.white}; font-weight: 700;
  margin-right: 8px; vertical-align: 2px;
`
const Title = styled.h3`
  font-family: 'DM Serif Display', Georgia, serif;
  font-weight: 500; font-size: 20px; line-height: 1.2;
  margin: 0 0 4px; color: ${tk.heading};
  text-wrap: balance;
`
const Sub = styled.p`
  margin: 0; font-size: 14px; color: ${tk.body};
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
`
const Actions = styled.div`
  display: flex; align-items: center; gap: 10px; justify-self: end;
  @media (max-width: 640px) { grid-column: 1 / -1; justify-self: start; margin-top: 6px; }
`
const CTA = styled(Link)<{ $accent: string }>`
  display: inline-block;
  background: ${({ $accent }) => $accent}; color: ${tk.white};
  padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 14px;
  text-decoration: none; white-space: nowrap;
  &:hover { filter: brightness(1.05); }
`
const IconBtn = styled.button`
  background: transparent; border: 1px solid ${tk.border};
  color: ${tk.muted}; padding: 6px; border-radius: 8px;
  cursor: pointer; display: grid; place-items: center;
  &:hover { color: ${tk.heading}; border-color: ${tk.muted}; }
`
const Dismiss = styled(IconBtn)`
  position: absolute; top: 10px; right: 10px;
  border: 0;
`
const Nav = styled.div`
  display: flex; justify-content: center; gap: 10px; align-items: center;
  margin-top: 10px;
`
const Dot = styled.button<{ $active: boolean; $accent: string }>`
  width: 7px; height: 7px; border-radius: 50%;
  border: 0; padding: 0; cursor: pointer;
  background: ${({ $active, $accent }) => ($active ? $accent : tk.border)};
  transition: transform 180ms ease;
  transform: scale(${({ $active }) => ($active ? 1.3 : 1)});
`

export function SpotlightCarousel() {
  const { items, dismiss } = useFeatureSpotlights('hero')
  const visible = useMemo(() => items.filter((s) => !s.dismissed), [items])
  const [i, setI] = useState(0)

  useEffect(() => {
    if (visible.length < 2) return
    const t = setInterval(() => setI((p) => (p + 1) % visible.length), AUTO_MS)
    return () => clearInterval(t)
  }, [visible.length])

  useEffect(() => {
    if (i >= visible.length) setI(0)
  }, [visible.length, i])

  if (!visible.length) return null
  const s = visible[i]
  if (!s) return null

  const accent = resolveAccent(s.accent)
  const Icon = resolveIcon(s.icon)

  return (
    <Shell>
      <Card $accent={accent} key={s.key}>
        <Dismiss aria-label="Dismiss" onClick={() => dismiss(s.key)}>
          <X size={14} />
        </Dismiss>
        <Pulse $accent={accent}>
          <Icon size={24} />
        </Pulse>
        <Copy>
          <Title>
            {s.is_new && <NewPill $accent={accent}>New</NewPill>}
            {s.title}
          </Title>
          <Sub>{s.subtitle}</Sub>
        </Copy>
        <Actions>
          <CTA $accent={accent} href={s.href}>{s.cta_label}</CTA>
          {visible.length > 1 && (
            <>
              <IconBtn aria-label="Previous" onClick={() => setI((p) => (p - 1 + visible.length) % visible.length)}>
                <ChevronLeft size={16} />
              </IconBtn>
              <IconBtn aria-label="Next" onClick={() => setI((p) => (p + 1) % visible.length)}>
                <ChevronRight size={16} />
              </IconBtn>
            </>
          )}
        </Actions>
      </Card>
      {visible.length > 1 && (
        <Nav aria-label="Spotlight pagination">
          {visible.map((v, idx) => (
            <Dot
              key={v.key}
              $active={idx === i}
              $accent={accent}
              aria-label={`Show ${v.title}`}
              aria-current={idx === i}
              onClick={() => setI(idx)}
            />
          ))}
        </Nav>
      )}
    </Shell>
  )
}

export default SpotlightCarousel
