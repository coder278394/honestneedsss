'use client'

/**
 * /upgrade-requests/new — owner asks the community to upgrade one of their
 * Free campaigns to Share tier. Shows only Free campaigns the signed-in user
 * owns; already-sharing campaigns are filtered out.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import {
  Sparkles,
  ArrowLeft,
  Megaphone,
  Target,
  ShieldCheck,
  CheckCircle2,
  Send,
} from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { apiClient } from '@/lib/api'
import { campaignUpgradeService } from '@/services/campaignUpgradeService'
import { tk, DashboardGlobalStyle, fadeDown } from '@/styles/dashboardTokens'

interface MyCampaign {
  _id: string
  id?: string
  campaign_ref?: string
  title: string
  campaign_type?: 'fundraising' | 'sharing'
  is_veteran?: boolean
  raised_amount?: number
  goal_amount?: number
  status?: string
}

// ─── Page shell ───────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${tk.canvas};
  font-family: 'DM Sans', sans-serif;
  color: ${tk.body};
`

const Hero = styled.header`
  background: ${tk.canvas};
  border-bottom: 2px solid ${tk.blue};
  padding: 24px 16px 20px;

  @media (min-width: 640px) { padding: 32px 24px 24px; }
  @media (min-width: 1024px) { padding: 40px 32px 28px; }
`

const HeroInner = styled.div`
  max-width: 920px;
  margin: 0 auto;
  animation: ${fadeDown} 400ms ease both;
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
  text-decoration: none;
  margin-bottom: 12px;
  transition: color 180ms;

  &:hover { color: ${tk.blue}; }
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

const ContentWrap = styled.div`
  max-width: 920px;
  margin: 0 auto;
  padding: 20px 12px 48px;

  @media (min-width: 640px) { padding: 24px 20px 56px; }
  @media (min-width: 1024px) { padding: 32px 32px 64px; }
`

const SectionLabel = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0 0 12px;
  letter-spacing: -0.2px;
`

const Hint = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
  margin: 0 0 14px;
`

// ─── Campaign picker ──────────────────────────────────────────────────────────
const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 720px) { grid-template-columns: repeat(2, 1fr); }
`

const CampaignCard = styled.li<{ $selected: boolean }>`
  background: ${(p) => (p.$selected ? tk.blueLight : tk.white)};
  border: 1.5px solid ${(p) => (p.$selected ? tk.blue : tk.border)};
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  position: relative;
  transition: all 180ms;
  animation: ${fadeDown} 300ms ease both;

  &:hover {
    border-color: ${tk.blue};
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(26, 95, 168, 0.1);
  }
`

const CheckDot = styled.span<{ $selected: boolean }>`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${(p) => (p.$selected ? tk.blue : tk.border)};
  background: ${(p) => (p.$selected ? tk.blue : 'transparent')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${tk.white};
  transition: all 180ms;
`

const CampaignTitle = styled.h3`
  font-family: 'Syne', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0 0 8px;
  padding-right: 28px;
  line-height: 1.3;
  letter-spacing: -0.2px;
`

const CampaignMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.body};
  background: ${tk.canvas};
  border: 1px solid ${tk.border};
  padding: 3px 8px;
  border-radius: 6px;
`

const VetChip = styled(MetaChip)`
  background: ${tk.blue};
  color: ${tk.white};
  border-color: ${tk.blue};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

// ─── Message box ──────────────────────────────────────────────────────────────
const Field = styled.div`
  margin-bottom: 24px;
`

const Label = styled.label`
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${tk.heading};
  margin-bottom: 6px;
`

const Textarea = styled.textarea`
  width: 100%;
  min-height: 110px;
  padding: 12px 14px;
  border: 1.5px solid ${tk.border};
  border-radius: 12px;
  background: ${tk.white};
  color: ${tk.body};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  resize: vertical;
  transition: border-color 180ms;

  &::placeholder { color: ${tk.muted}; }

  &:focus {
    outline: none;
    border-color: ${tk.blue};
    box-shadow: 0 0 0 4px ${tk.blueLight};
  }
`

const CharCount = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
  margin: 6px 0 0;
  text-align: right;
`

// ─── Actions ──────────────────────────────────────────────────────────────────
const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`

const SubmitBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 22px;
  border-radius: 12px;
  border: none;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(26, 95, 168, 0.2);
  transition: all 180ms;

  &:hover:not(:disabled) {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.26);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`

const CancelBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  border: 1.5px solid ${tk.border};
  background: ${tk.white};
  color: ${tk.body};
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 180ms;

  &:hover { border-color: ${tk.blue}; color: ${tk.blue}; background: ${tk.blueLight}; }
`

// ─── Empty + skeleton ─────────────────────────────────────────────────────────
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
  p { margin: 0 0 16px; font-size: 0.9rem; }
`

const SkeletonCard = styled.li`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  height: 120px;
  position: relative;
  overflow: hidden;

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

const MAX_MESSAGE = 280

// ─── Component ────────────────────────────────────────────────────────────────
function RequestUpgradeInner() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<MyCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiClient.get<{ campaigns: MyCampaign[] }>('/campaigns/my-campaigns', {
          params: { limit: 100 },
        })
        if (!cancelled) {
          const all = res.data.campaigns || []
          // Only Free (fundraising) campaigns can be upgraded
          const free = all.filter((c) => (c.campaign_type ?? 'fundraising') !== 'sharing')
          setCampaigns(free)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Could not load your campaigns')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => (c._id || c.id) === selected) || null,
    [campaigns, selected]
  )

  const submit = useCallback(async () => {
    if (!selected) {
      toast.info('Pick a campaign first.')
      return
    }
    setSubmitting(true)
    try {
      await campaignUpgradeService.createCommunityUpgradeRequest(
        selected,
        message.trim() || undefined
      )
      toast.success('Request posted — it will appear in the community inbox.')
      router.push('/upgrade-requests?tab=mine')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not post your request'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }, [selected, message, router])

  return (
    <Page>
      <DashboardGlobalStyle />

      <Hero>
        <HeroInner>
          <BackLink href="/sponsorship-pool">
            <ArrowLeft size={12} />
            Back to Sponsorship Pool
          </BackLink>
          <HeroEyebrow>
            <Sparkles size={12} />
            Request an upgrade
          </HeroEyebrow>
          <HeroTitle>Ask the community to lift your campaign</HeroTitle>
          <HeroSub>
            Pick one of your Free campaigns and let the community know why it&apos;s ready for
            Share tier. Sponsors browsing the inbox can fulfil your request from the pool.
          </HeroSub>
        </HeroInner>
      </Hero>

      <ContentWrap>
        <SectionLabel>1. Pick a campaign</SectionLabel>
        <Hint>Only Free campaigns you own are eligible. Already-Share campaigns are hidden.</Hint>

        {loading ? (
          <List>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </List>
        ) : campaigns.length === 0 ? (
          <EmptyState>
            <Megaphone size={40} strokeWidth={1.5} />
            <h3>No eligible campaigns</h3>
            <p>Create a Free campaign first, then come back to request its upgrade.</p>
            <CancelBtn href="/campaigns/new">Create a campaign</CancelBtn>
          </EmptyState>
        ) : (
          <List>
            {campaigns.map((c) => {
              const id = c._id || c.id || ''
              const isSelected = selected === id
              const raised = typeof c.raised_amount === 'number' ? c.raised_amount : 0
              const goal = typeof c.goal_amount === 'number' ? c.goal_amount : 0
              return (
                <CampaignCard
                  key={id}
                  $selected={isSelected}
                  onClick={() => setSelected(id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected(id)
                    }
                  }}
                >
                  <CheckDot $selected={isSelected}>
                    {isSelected && <CheckCircle2 size={14} />}
                  </CheckDot>
                  <CampaignTitle>{c.title || 'Untitled campaign'}</CampaignTitle>
                  <CampaignMeta>
                    {c.is_veteran && (
                      <VetChip>
                        <ShieldCheck size={10} />
                        Veteran
                      </VetChip>
                    )}
                    {goal > 0 && (
                      <MetaChip>
                        <Target size={10} />
                        ${Math.floor(raised / 100).toLocaleString()} / ${Math.floor(goal / 100).toLocaleString()}
                      </MetaChip>
                    )}
                    {c.status && <MetaChip>{c.status}</MetaChip>}
                  </CampaignMeta>
                </CampaignCard>
              )
            })}
          </List>
        )}

        <SectionLabel>2. Add a note (optional)</SectionLabel>
        <Hint>Tell sponsors why this upgrade matters right now. Keep it short.</Hint>

        <Field>
          <Label htmlFor="upgrade-message">Message to the community</Label>
          <Textarea
            id="upgrade-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
            placeholder="e.g. We're 80% of the way to goal and need wider reach to close the gap this month."
            disabled={!selectedCampaign || submitting}
          />
          <CharCount>{message.length} / {MAX_MESSAGE}</CharCount>
        </Field>

        <Actions>
          <SubmitBtn onClick={submit} disabled={!selectedCampaign || submitting}>
            <Send size={16} />
            {submitting ? 'Posting…' : 'Post upgrade request'}
          </SubmitBtn>
          <CancelBtn href="/upgrade-requests">Cancel</CancelBtn>
        </Actions>
      </ContentWrap>
    </Page>
  )
}

export default function RequestUpgradePage() {
  return (
    <ProtectedRoute>
      <RequestUpgradeInner />
    </ProtectedRoute>
  )
}
