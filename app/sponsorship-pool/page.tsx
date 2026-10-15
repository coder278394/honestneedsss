'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styled, { keyframes } from 'styled-components'
import { apiClient } from '@/lib/api'
import { tk } from '@/styles/dashboardTokens'

// ─────────────────────────────────────────────────────────────────────────────
// Types mirror UpgradePortalService.getPortalSnapshot() in the backend.
// Keep in sync with src/services/UpgradePortalService.js.
// ─────────────────────────────────────────────────────────────────────────────

type PortalState =
  | 'waiting_for_sponsorships'
  | 'funds_low'
  | 'ready_to_grant'
  | 'funded_but_queue_empty'
  | 'awaiting_funds_and_queue'

interface QueueItem {
  request_id: string
  campaign_ref: string
  campaign_title: string
  message: string | null
  is_veteran: boolean
  created_at: string
}

interface Snapshot {
  state: PortalState
  pool: {
    balance_cents: number
    reserved_cents: number
    available_cents: number
    default_grant_cents: number
    campaigns_fundable_now: number
  }
  queue: {
    total_open: number
    already_pool_funded: number
    items: QueueItem[]
  }
}

const STATE_COPY: Record<PortalState, { title: string; body: string; tone: 'waiting' | 'low' | 'ready' | 'empty' }> = {
  waiting_for_sponsorships: {
    title: 'Waiting for sponsorships.',
    body: "The pool is at zero right now. New campaigns are gathering in the queue below and will be funded as soon as a sponsor or the founder adds to the pool.",
    tone: 'waiting',
  },
  funds_low: {
    title: 'Funds are running low.',
    body: "The pool has some balance but less than one default grant. Next top-up unlocks the next upgrade.",
    tone: 'low',
  },
  ready_to_grant: {
    title: 'Pool is live. Upgrades going out this week.',
    body: "The queue is being drained oldest-first, veterans first. If your campaign is in the list, you don't need to do anything.",
    tone: 'ready',
  },
  funded_but_queue_empty: {
    title: 'Pool is funded and the queue is empty.',
    body: "If you're running a Free Campaign, this is the moment to request an upgrade — your request will be the first one picked up.",
    tone: 'ready',
  },
  awaiting_funds_and_queue: {
    title: 'The portal is quiet right now.',
    body: "No funds in the pool and no open requests. Running a Free Campaign? Be the first in line.",
    tone: 'empty',
  },
}

// ─── Styled bits ─────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  background: ${tk.canvas};
  color: ${tk.body};
  font-family: 'DM Sans', -apple-system, sans-serif;
  padding: 24px 16px 72px;
`
const Inner = styled.div`
  max-width: 920px;
  margin: 0 auto;
`
const Masthead = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${tk.border};
  margin-bottom: 28px;
  flex-wrap: wrap;
`
const Brand = styled.div`
  display: flex; align-items: baseline; gap: 10px;
  color: ${tk.heading};
  .dot { width: 10px; height: 10px; border-radius: 50%; background: ${tk.red}; display: inline-block; }
  .name { font-weight: 700; font-size: 17px; }
  .sep { color: ${tk.muted}; }
  .section { color: ${tk.muted}; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; }
`
const ping = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(26,122,74,0.6); }
  80%, 100% { box-shadow: 0 0 0 10px rgba(26,122,74,0); }
`
const Pulse = styled.span`
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${tk.muted};
  .dot {
    width: 7px; height: 7px; border-radius: 50%; background: ${tk.green};
    animation: ${ping} 2.2s ease-out infinite;
  }
  @media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
`
const Hero = styled.section`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  padding: 32px 28px;
  box-shadow: 0 10px 30px -18px rgba(24,23,26,0.25);
`
const Eyebrow = styled.div`
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${tk.muted};
  margin-bottom: 10px;
`
const H1 = styled.h1`
  font-family: 'DM Serif Display', Georgia, serif;
  font-weight: 400;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 14px;
  color: ${tk.heading};
  text-wrap: balance;
  em { font-style: italic; color: ${tk.red}; font-weight: 500; }
`
const Lede = styled.p`
  max-width: 54ch; color: ${tk.body}; font-size: 16px; margin: 0 0 22px;
`
const MeterRow = styled.div`
  display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: end;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`
const Amount = styled.div`
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(44px, 9vw, 72px);
  line-height: 1; letter-spacing: -0.03em;
  color: ${tk.heading};
  display: flex; align-items: baseline; gap: 6px;
  font-variant-numeric: tabular-nums;
  .cur { font-size: 0.42em; color: ${tk.muted}; font-weight: 400; transform: translateY(-0.6em); }
  .cents { font-size: 0.42em; color: ${tk.muted}; }
`
const MeterMeta = styled.div`
  text-align: right; color: ${tk.muted}; font-size: 13px;
  @media (max-width: 560px) { text-align: left; }
  strong { color: ${tk.heading}; font-weight: 600; }
`
const Progress = styled.div`
  margin-top: 20px; height: 6px;
  background: ${tk.border}; border-radius: 999px; overflow: hidden;
  div { height: 100%; background: linear-gradient(90deg, ${tk.red}, ${tk.amber}); border-radius: 999px; transition: width 600ms cubic-bezier(.2,.8,.2,1); }
`
const Banner = styled.div<{ $tone: 'waiting' | 'low' | 'ready' | 'empty' }>`
  margin-top: 24px; padding: 14px 16px; border-radius: 10px;
  display: flex; align-items: flex-start; gap: 12px; font-size: 14px;
  border: 1px solid;
  background: ${({ $tone }) => (
    $tone === 'waiting' ? 'rgba(192,57,43,0.08)' :
    $tone === 'low' ? 'rgba(212,135,10,0.10)' :
    $tone === 'ready' ? 'rgba(26,122,74,0.10)' :
    tk.canvas
  )};
  border-color: ${({ $tone }) => (
    $tone === 'waiting' ? 'rgba(192,57,43,0.35)' :
    $tone === 'low' ? 'rgba(212,135,10,0.40)' :
    $tone === 'ready' ? 'rgba(26,122,74,0.35)' :
    tk.border
  )};
  color: ${tk.heading};
  .icon {
    width: 24px; height: 24px; border-radius: 50%;
    display: grid; place-items: center; font-weight: 700; font-size: 13px;
    color: ${tk.white}; flex-shrink: 0;
    background: ${({ $tone }) => (
      $tone === 'waiting' ? tk.red :
      $tone === 'low' ? tk.amber :
      $tone === 'ready' ? tk.green :
      tk.muted
    )};
  }
`
const SectionHead = styled.div`
  display: flex; align-items: baseline; justify-content: space-between; gap: 12px;
  margin: 44px 0 16px; padding-bottom: 10px;
  border-bottom: 1px solid ${tk.border};
  h2 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-weight: 500; font-size: 22px; letter-spacing: -0.01em; margin: 0;
    color: ${tk.heading};
  }
  .meta { color: ${tk.muted}; font-size: 13px; }
`
const Queue = styled.div`
  display: flex; flex-direction: column; gap: 10px;
`
const QItem = styled.div<{ $vet?: boolean }>`
  background: ${tk.white};
  border: 1px solid ${({ $vet }) => $vet ? 'rgba(192,57,43,0.35)' : tk.border};
  border-radius: 12px;
  padding: 16px 18px;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 14px; align-items: center; min-width: 0;
  .pos {
    font-family: 'DM Serif Display', serif;
    font-size: 22px; color: ${tk.muted}; text-align: center; font-variant-numeric: tabular-nums;
  }
  .title { font-weight: 600; font-size: 15px; color: ${tk.heading}; display: flex; align-items: center; gap: 8px; min-width: 0; }
  .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .msg { color: ${tk.muted}; font-size: 13px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .age { color: ${tk.muted}; font-size: 12px; white-space: nowrap; }
`
const Chip = styled.span`
  display: inline-flex; align-items: center;
  font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 999px;
  background: rgba(192,57,43,0.10); color: ${tk.red};
  border: 1px solid rgba(192,57,43,0.30); font-weight: 700;
`
const Empty = styled.div`
  text-align: center; padding: 40px 20px; color: ${tk.muted};
  border: 1px dashed ${tk.border}; border-radius: 12px; background: ${tk.white};
  h3 { font-family: 'DM Serif Display', serif; font-weight: 500; font-size: 20px; color: ${tk.heading}; margin: 0 0 8px; }
`
const Founder = styled.div`
  margin-top: 36px; padding: 20px 22px;
  border-left: 3px solid ${tk.red};
  background: ${tk.white};
  border-radius: 0 10px 10px 0;
  .who { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${tk.muted}; margin-bottom: 6px; }
  blockquote { margin: 0; font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 17px; line-height: 1.5; font-style: italic; color: ${tk.heading}; text-wrap: balance; }
`
const CTA = styled.div`
  margin-top: 36px;
  display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;
  background: ${tk.ink}; color: ${tk.white};
  border-radius: 14px; padding: 28px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
  h3 { font-family: 'DM Serif Display', serif; font-weight: 500; font-size: 22px; margin: 0 0 6px; }
  p { margin: 0; opacity: 0.76; font-size: 14px; max-width: 48ch; }
`
const Button = styled(Link)`
  display: inline-block; background: ${tk.red}; color: ${tk.white};
  padding: 12px 20px; border-radius: 10px; font-weight: 600; font-size: 14px;
  text-decoration: none; white-space: nowrap;
  transition: transform 120ms ease, box-shadow 120ms ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -12px ${tk.red}; }
`
const Skeleton = styled.div`
  background: linear-gradient(90deg, ${tk.border} 0%, ${tk.canvas} 50%, ${tk.border} 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  border-radius: 8px;
`

function fmtMoney(cents: number) {
  const whole = Math.floor(cents / 100).toLocaleString('en-US')
  const c = String(Math.abs(cents) % 100).padStart(2, '0')
  return { whole, cents: '.' + c }
}
function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const h = Math.floor(diff / 36e5)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SponsorshipPoolPage() {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data } = await apiClient.get<{ success: boolean; data: Snapshot }>(
          '/upgrade-portal'
        )
        if (!cancelled) setSnap(data.data)
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load')
      }
    }
    load()
    const t = setInterval(load, 30_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (err) {
    return (
      <Page><Inner>
        <Empty><h3>Portal unavailable</h3><p>{err}</p></Empty>
      </Inner></Page>
    )
  }

  if (!snap) {
    return (
      <Page><Inner>
        <Masthead>
          <Brand>
            <span className="dot" /><span className="name">HonestNeed</span>
            <span className="sep">·</span><span className="section">Sponsorship Pool</span>
          </Brand>
        </Masthead>
        <Skeleton style={{ height: 320, marginBottom: 44 }} />
        <Skeleton style={{ height: 60, marginBottom: 10 }} />
        <Skeleton style={{ height: 60, marginBottom: 10 }} />
        <Skeleton style={{ height: 60 }} />
      </Inner></Page>
    )
  }

  const money = fmtMoney(snap.pool.available_cents)
  const copy = STATE_COPY[snap.state]
  const progressPct = Math.min(
    100,
    (snap.pool.available_cents / (snap.pool.default_grant_cents * 10)) * 100
  )
  const bannerIcon = copy.tone === 'ready' ? '✓' : copy.tone === 'low' ? '…' : copy.tone === 'waiting' ? '!' : '·'

  return (
    <Page>
      <Inner>
        <Masthead>
          <Brand>
            <span className="dot" />
            <span className="name">HonestNeed</span>
            <span className="sep">·</span>
            <span className="section">Sponsorship Pool</span>
          </Brand>
          <Pulse><span className="dot" /> Live</Pulse>
        </Masthead>

        <Hero aria-live="polite">
          <Eyebrow>Platform sponsorship pool</Eyebrow>
          <H1>
            A shared fund that <em>pays to upgrade</em> campaigns from Free to Share-to-Earn.
          </H1>
          <Lede>
            Sponsors and the HonestNeed team top up this pool. When a campaign owner asks to be upgraded,
            we draw from the pool to activate their sharing budget — no money leaves the owner's own pocket to get started.
          </Lede>

          <MeterRow>
            <Amount>
              <span className="cur">$</span>
              <span>{money.whole}</span>
              <span className="cents">{money.cents}</span>
            </Amount>
            <MeterMeta>
              <div>Available to grant now</div>
              <div>
                <strong>{snap.pool.campaigns_fundable_now}</strong> campaigns at{' '}
                ${Math.floor(snap.pool.default_grant_cents / 100)} each
              </div>
            </MeterMeta>
          </MeterRow>

          <Progress aria-hidden><div style={{ width: `${progressPct}%` }} /></Progress>

          <Banner $tone={copy.tone}>
            <span className="icon">{bannerIcon}</span>
            <div><strong>{copy.title}</strong> {copy.body}</div>
          </Banner>
        </Hero>

        <SectionHead>
          <h2>In the queue</h2>
          <div className="meta">
            {snap.queue.total_open} campaigns waiting · sorted veterans-first, then oldest first
          </div>
        </SectionHead>

        {snap.queue.items.length === 0 ? (
          <Empty>
            <h3>No campaigns waiting.</h3>
            <p>When owners request an upgrade, their campaigns show up here in order.</p>
          </Empty>
        ) : (
          <Queue>
            {snap.queue.items.map((item, i) => (
              <QItem key={item.request_id} $vet={item.is_veteran}>
                <div className="pos">{i + 1}</div>
                <div>
                  <div className="title">
                    <span className="label">{item.campaign_title}</span>
                    {item.is_veteran && <Chip>Veteran</Chip>}
                  </div>
                  <div className="msg">
                    {item.message ? `"${item.message}"` : item.campaign_ref}
                  </div>
                </div>
                <div className="age" style={{ color: tk.muted, fontSize: 12 }}>
                  {timeAgo(item.created_at)}
                </div>
              </QItem>
            ))}
          </Queue>
        )}

        <Founder>
          <div className="who">A note from the founder</div>
          <blockquote>
            "If you're reading 'waiting for sponsorships', that's not a bug — it's the honest status.
            The pool is empty today, and I'll add to it myself when I can. Every campaign below gets
            upgraded as the pool refills, oldest first, veterans first."
          </blockquote>
        </Founder>

        <CTA>
          <div>
            <h3>Running a Free Campaign?</h3>
            <p>Ask the community to upgrade yours. You keep ownership, you set the share rules, and the pool funds the launch.</p>
          </div>
          <Button href="/upgrade-requests/new">Request an upgrade</Button>
        </CTA>
      </Inner>
    </Page>
  )
}
