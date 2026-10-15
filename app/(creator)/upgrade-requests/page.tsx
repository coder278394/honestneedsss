'use client'

/**
 * /upgrade-requests — community sponsor inbox.
 *
 * Lists open owner-initiated upgrade requests from the community so eligible
 * sponsors can accept one. Also shows the signed-in owner's own requests
 * (my-requests tab) so a creator can track and cancel their asks.
 */

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import styled, { css } from 'styled-components'
import { toast } from 'react-toastify'
import {
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Inbox,
  Hash,
  MessageSquareQuote,
  PlusCircle,
  Megaphone,
  Handshake,
} from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { campaignUpgradeService } from '@/services/campaignUpgradeService'
import { tk, DashboardGlobalStyle, fadeDown } from '@/styles/dashboardTokens'
import UpgradeRequestInbox from '@/features/campaigns/upgrade/UpgradeRequestInbox'

interface CommunityRequest {
  _id: string
  campaign_id: string
  campaign_ref: string
  campaign_title: string
  owner_id: string
  message: string | null
  status: 'open' | 'fulfilled' | 'cancelled' | 'expired'
  is_veteran: boolean
  created_at: string
  expires_at: string
}

type Tab = 'community' | 'mine' | 'proposals'

// ─── Page shell ───────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${tk.canvas};
  font-family: 'DM Sans', sans-serif;
  color: ${tk.body};
`

// ─── Hero header ──────────────────────────────────────────────────────────────
const Hero = styled.header`
  background: ${tk.canvas};
  border-bottom: 2px solid ${tk.blue};
  padding: 24px 16px 20px;

  @media (min-width: 640px) { padding: 32px 24px 24px; }
  @media (min-width: 1024px) { padding: 40px 32px 28px; }
`

const HeroInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeDown} 400ms ease both;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
  justify-content: space-between;
`

const HeroText = styled.div`
  min-width: 0;
  flex: 1 1 320px;
`

// Primary CTA for owners — the whole point of this page beyond browsing other
// people's asks. We keep it in the hero so it's visible on every tab (both
// "Community" and "My requests") without needing to scroll.
const HeroCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.2px;
  transition: all 180ms;
  box-shadow: 0 6px 16px rgba(26, 95, 168, 0.2);
  white-space: nowrap;

  &:hover {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.26);
  }
`

// CTA used inside the "My requests" empty state so an owner lands on the
// create-request flow directly rather than hunting for a second entry point.
const EmptyCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 20px;
  margin-top: 14px;
  border-radius: 12px;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 180ms;
  box-shadow: 0 6px 16px rgba(26, 95, 168, 0.18);

  &:hover {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.24);
  }
`

const HeroEyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${tk.amberDark};
  background: ${tk.amberLight};
  padding: 4px 12px;
  border-radius: 999px;
  margin: 0 0 12px;
`

const HeroTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, ${tk.heading} 0%, ${tk.blue} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
  line-height: 1.2;

  @media (min-width: 640px) { font-size: 2rem; }
  @media (min-width: 1024px) { font-size: 2.4rem; }
`

const HeroSub = styled.p`
  font-size: 0.9rem;
  color: ${tk.muted};
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
  max-width: 64ch;

  @media (min-width: 640px) { font-size: 1rem; }
`

// ─── Content ──────────────────────────────────────────────────────────────────
const ContentWrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 12px 48px;

  @media (min-width: 640px) { padding: 24px 20px 56px; }
  @media (min-width: 1024px) { padding: 32px 32px 64px; }
`

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const Tabs = styled.div`
  display: inline-flex;
  background: ${tk.white};
  border: 1.5px solid ${tk.border};
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  gap: 2px;
`

const TabBtn = styled.button<{ $active: boolean }>`
  padding: 8px 18px;
  border: none;
  background: ${(p) => (p.$active ? tk.blue : 'transparent')};
  color: ${(p) => (p.$active ? tk.white : tk.body)};
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.2px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 180ms;

  &:hover {
    ${(p) =>
      !p.$active &&
      css`
        background: ${tk.blueLight};
        color: ${tk.blue};
      `}
  }
`

// ─── Results bar ──────────────────────────────────────────────────────────────
const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;
  flex-wrap: wrap;
`

const ResultsCount = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  color: ${tk.muted};
  margin: 0;
  font-weight: 400;

  strong { color: ${tk.heading}; font-weight: 500; }
`

// ─── Request card ─────────────────────────────────────────────────────────────
const Grid = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 900px) { grid-template-columns: repeat(2, 1fr); gap: 18px; }
`

const Card = styled.li<{ $veteran: boolean }>`
  position: relative;
  background: ${(p) => (p.$veteran ? tk.blueLight : tk.white)};
  border: 1px solid ${(p) => (p.$veteran ? tk.blue : tk.border)};
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  animation: ${fadeDown} 350ms ease both;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(26, 95, 168, 0.12);
    border-color: ${tk.blue};
  }
`

const CardHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`

const CardTitle = styled.h3`
  font-family: 'Syne', sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.2px;
`

const Timestamp = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
  white-space: nowrap;
  flex-shrink: 0;
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`

const RefChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: ${tk.body};
  background: ${tk.canvas};
  border: 1px solid ${tk.border};
  padding: 3px 8px;
  border-radius: 6px;
`

const VeteranBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: ${tk.white};
  background: ${tk.blue};
  padding: 3px 8px;
  border-radius: 6px;
`

const ExpiresChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
`

const Message = styled.blockquote`
  margin: 0;
  padding: 12px 14px;
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-left: 3px solid ${tk.amber};
  border-radius: 8px;
  font-size: 0.88rem;
  color: ${tk.body};
  line-height: 1.5;
  position: relative;

  svg {
    position: absolute;
    top: 10px;
    left: -10px;
    background: ${tk.amberLight};
    color: ${tk.amberDark};
    padding: 2px;
    border-radius: 50%;
  }
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
  flex-wrap: wrap;
`

const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms;
  box-shadow: 0 4px 12px rgba(26, 95, 168, 0.18);

  &:hover:not(:disabled) {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(26, 95, 168, 0.24);
  }

  &:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
`

const SecondaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1.5px solid ${tk.border};
  background: ${tk.white};
  color: ${tk.body};
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms;

  &:hover:not(:disabled) {
    border-color: ${tk.blue};
    color: ${tk.blue};
    background: ${tk.blueLight};
  }

  &:disabled { opacity: 0.55; cursor: not-allowed; }
`

const StatusPill = styled.span<{ $status: CommunityRequest['status'] }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  ${(p) => {
    switch (p.$status) {
      case 'fulfilled':
        return css`color: #0F5F3A; background: #E6F4EC;`
      case 'cancelled':
        return css`color: ${tk.muted}; background: ${tk.canvas}; border: 1px solid ${tk.border};`
      case 'expired':
        return css`color: #8A3A1E; background: #FBE8DC;`
      default:
        return css`color: ${tk.blue}; background: ${tk.blueLight};`
    }
  }}
`

// ─── Empty & skeleton ─────────────────────────────────────────────────────────
const EmptyState = styled.div`
  background: ${tk.white};
  border: 1.5px dashed ${tk.border};
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  color: ${tk.muted};

  svg { color: ${tk.blue}; opacity: 0.6; margin-bottom: 12px; }
  h3 {
    font-family: 'Syne', sans-serif;
    color: ${tk.heading};
    font-size: 1.1rem;
    margin: 0 0 6px;
  }
  p { margin: 0; font-size: 0.9rem; }
`

const SkeletonGrid = styled(Grid)`
  pointer-events: none;
`

const Skeleton = styled.li`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  height: 220px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(26, 95, 168, 0.08), transparent);
    animation: shimmer 1.4s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diffH = (now - d.getTime()) / 36e5
  if (diffH < 1) return 'just now'
  if (diffH < 24) return `${Math.floor(diffH)}h ago`
  if (diffH < 24 * 7) return `${Math.floor(diffH / 24)}d ago`
  return d.toLocaleDateString()
}

// ─── Component ────────────────────────────────────────────────────────────────
function UpgradeRequestsInner() {
  // Allow deep-links from notifications: ?tab=proposals lands directly on the
  // owner-inbox of sponsor-proposed upgrades waiting for a decision.
  const sp = useSearchParams()
  const initial = (sp?.get('tab') as Tab) || 'community'
  const [tab, setTab] = useState<Tab>(['community', 'mine', 'proposals'].includes(initial) ? initial : 'community')
  const [communityItems, setCommunityItems] = useState<CommunityRequest[]>([])
  const [mineItems, setMineItems] = useState<CommunityRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  const load = useCallback(async () => {
    // The proposals tab is a separate owner inbox served by its own hook via
    // UpgradeRequestInbox — this effect only hydrates the two community-pool
    // feeds backed by this page's local state.
    if (tab === 'proposals') {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (tab === 'community') {
        const res = (await campaignUpgradeService.listCommunityUpgradeRequests({ limit: 50 })) as {
          items: CommunityRequest[]
        }
        setCommunityItems(res.items || [])
      } else {
        const res = (await campaignUpgradeService.listMyCommunityUpgradeRequests({ limit: 50 })) as {
          items: CommunityRequest[]
        }
        setMineItems(res.items || [])
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load requests'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    void load()
  }, [load])

  const fulfil = async (r: CommunityRequest) => {
    setWorking(r._id)
    try {
      await campaignUpgradeService.fulfilCommunityUpgradeRequest(r._id)
      toast.success('Upgrade sent — the campaign owner has been notified.')
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not fulfil request'
      toast.error(message)
    } finally {
      setWorking(null)
    }
  }

  const cancelMine = async (r: CommunityRequest) => {
    const reason = window.prompt('Cancel this request? Optional note:')
    if (reason === null) return
    setWorking(r._id)
    try {
      await campaignUpgradeService.cancelMyCommunityUpgradeRequest(r._id, reason || undefined)
      toast.success('Request cancelled')
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not cancel request'
      toast.error(message)
    } finally {
      setWorking(null)
    }
  }

  const activeItems = tab === 'community' ? communityItems : mineItems

  return (
    <Page>
      <DashboardGlobalStyle />

      {/* Hero */}
      <Hero>
        <HeroInner>
          <HeroText>
            <HeroEyebrow>
              <Sparkles size={12} />
              Community Upgrades
            </HeroEyebrow>
            <HeroTitle>Help lift a campaign to Share tier</HeroTitle>
            <HeroSub>
              Campaign owners are asking the community to upgrade their campaigns to Share Campaigns.
              Sponsor one you believe in, or ask the community to upgrade yours.
            </HeroSub>
          </HeroText>
          <HeroCTA href="/upgrade-requests/new">
            <PlusCircle size={16} />
            Request an upgrade
          </HeroCTA>
        </HeroInner>
      </Hero>

      {/* Content */}
      <ContentWrap>
        <Tabs role="tablist" aria-label="Upgrade request lists">
          <TabBtn
            type="button"
            role="tab"
            aria-selected={tab === 'community'}
            $active={tab === 'community'}
            onClick={() => setTab('community')}
          >
            Community
          </TabBtn>
          <TabBtn
            type="button"
            role="tab"
            aria-selected={tab === 'mine'}
            $active={tab === 'mine'}
            onClick={() => setTab('mine')}
          >
            My requests
          </TabBtn>
          {/* Owner inbox for sponsor-initiated upgrade proposals waiting on
              the owner's approve/decline. This is where notifications of type
              `campaign_upgrade_requested` deep-link into. */}
          <TabBtn
            type="button"
            role="tab"
            aria-selected={tab === 'proposals'}
            $active={tab === 'proposals'}
            onClick={() => setTab('proposals')}
          >
            Proposals to me
          </TabBtn>
        </Tabs>

        {tab === 'proposals' ? (
          // Owner inbox — rendered by its own component with its own fetch.
          <UpgradeRequestInbox />
        ) : (
        <>
        <ResultsBar>
          <ResultsCount>
            {loading
              ? 'Loading requests…'
              : activeItems.length > 0
                ? <><strong>{activeItems.length}</strong> {activeItems.length === 1 ? 'request' : 'requests'}</>
                : tab === 'community' ? 'No open requests' : 'No requests yet'}
          </ResultsCount>
        </ResultsBar>

        {loading ? (
          <SkeletonGrid>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
          </SkeletonGrid>
        ) : activeItems.length === 0 ? (
          <EmptyState>
            <Inbox size={40} strokeWidth={1.5} />
            <h3>{tab === 'community' ? 'No open requests right now' : 'Nothing to track yet'}</h3>
            <p>
              {tab === 'community'
                ? 'Check back soon — new asks appear here as owners post them.'
                : "You haven't asked the community for an upgrade yet. Posting one takes a minute."}
            </p>
            {tab === 'mine' && (
              <EmptyCTA href="/upgrade-requests/new">
                <Megaphone size={14} />
                Post your first upgrade request
              </EmptyCTA>
            )}
          </EmptyState>
        ) : (
          <Grid>
            {activeItems.map((r) => (
              <Card key={r._id} $veteran={r.is_veteran}>
                <CardHeader>
                  <CardTitle>{r.campaign_title}</CardTitle>
                  <Timestamp>{formatWhen(r.created_at)}</Timestamp>
                </CardHeader>

                <MetaRow>
                  <RefChip>
                    <Hash size={10} />
                    {r.campaign_ref}
                  </RefChip>
                  {r.is_veteran && (
                    <VeteranBadge>
                      <ShieldCheck size={10} />
                      Veteran
                    </VeteranBadge>
                  )}
                  <ExpiresChip>
                    <Clock size={11} />
                    expires {new Date(r.expires_at).toLocaleDateString()}
                  </ExpiresChip>
                </MetaRow>

                {r.message && (
                  <Message>
                    <MessageSquareQuote size={14} />
                    {r.message}
                  </Message>
                )}

                <Actions>
                  {tab === 'community' ? (
                    <PrimaryBtn onClick={() => fulfil(r)} disabled={working === r._id}>
                      <ArrowUpRight size={14} />
                      {working === r._id ? 'Upgrading…' : 'Upgrade this campaign'}
                    </PrimaryBtn>
                  ) : r.status === 'open' ? (
                    <SecondaryBtn onClick={() => cancelMine(r)} disabled={working === r._id}>
                      {working === r._id ? 'Cancelling…' : 'Cancel request'}
                    </SecondaryBtn>
                  ) : (
                    <StatusPill $status={r.status}>{r.status}</StatusPill>
                  )}
                </Actions>
              </Card>
            ))}
          </Grid>
        )}
        </>
        )}
      </ContentWrap>
    </Page>
  )
}

export default function UpgradeRequestsPage() {
  // UpgradeRequestsInner calls useSearchParams() (for the ?tab= deep-link);
  // Next.js >=15 requires a Suspense boundary around any component that does,
  // or `next build` fails with a prerender error on this route.
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <UpgradeRequestsInner />
      </Suspense>
    </ProtectedRoute>
  )
}
