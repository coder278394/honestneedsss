'use client'

/**
 * /campaigns/[id]/upgrade — sponsor-side upgrade proposal form.
 *
 * A signed-in non-owner lands here from the "Help upgrade" button on
 * CampaignCard with ?role=sponsor. They can set the share-config (reward
 * budget, per-share amount, channels) and a short note, then submit — the
 * backend creates a pending request that only the campaign owner can approve.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import {
  Sparkles,
  ArrowLeft,
  Send,
  ShieldCheck,
  Users,
  DollarSign,
  Share2,
  Info,
  CheckCircle2,
} from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  campaignUpgradeService,
  newIdempotencyKey,
  type UpgradeEligibility,
} from '@/services/campaignUpgradeService'
import { tk, DashboardGlobalStyle, fadeDown } from '@/styles/dashboardTokens'

// ─── Design-system scaffolding ──────────────────────────────────────────────
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
  max-width: 820px;
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

const Eyebrow = styled.p`
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

const Title = styled.h1`
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
`

const Sub = styled.p`
  font-size: 0.9rem;
  color: ${tk.muted};
  margin: 0;
  line-height: 1.5;
  max-width: 60ch;
`

const ContentWrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 20px 12px 48px;
  @media (min-width: 640px) { padding: 24px 20px 56px; }
  @media (min-width: 1024px) { padding: 32px 32px 64px; }
`

const Card = styled.section`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 18px;
  animation: ${fadeDown} 350ms ease both;
`

const CardLabel = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0 0 10px;
  letter-spacing: -0.2px;
`

const Hint = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
  margin: 0 0 14px;
`

const CampaignRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid ${tk.border};
  &:last-child { border-bottom: none; }
`

const RowKey = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: ${tk.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const RowVal = styled.span`
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  color: ${tk.heading};
  font-weight: 600;
  text-align: right;
  max-width: 60%;
`

// ─── Field styles ────────────────────────────────────────────────────────────
const Field = styled.div`
  margin-bottom: 16px;
  &:last-child { margin-bottom: 0; }
`

const Label = styled.label`
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${tk.heading};
  margin-bottom: 6px;
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${tk.canvas};
  border: 1.5px solid ${tk.border};
  border-radius: 12px;
  padding: 0 14px;
  transition: all 180ms;
  &:focus-within { border-color: ${tk.blue}; background: ${tk.white}; box-shadow: 0 0 0 4px ${tk.blueLight}; }

  svg { color: ${tk.muted}; flex-shrink: 0; }
`

const Input = styled.input`
  flex: 1;
  height: 42px;
  border: none;
  background: transparent;
  color: ${tk.body};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  &:focus { outline: none; }
  &::placeholder { color: ${tk.muted}; }
`

const Textarea = styled.textarea`
  width: 100%;
  min-height: 90px;
  padding: 10px 12px;
  border: 1.5px solid ${tk.border};
  border-radius: 12px;
  background: ${tk.canvas};
  color: ${tk.body};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  resize: vertical;
  transition: all 180ms;
  &:focus { outline: none; border-color: ${tk.blue}; background: ${tk.white}; box-shadow: 0 0 0 4px ${tk.blueLight}; }
  &::placeholder { color: ${tk.muted}; }
`

const CharCount = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
  margin: 6px 0 0;
  text-align: right;
`

// ─── Platform chips ──────────────────────────────────────────────────────────
const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const Chip = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid ${(p) => (p.$on ? tk.blue : tk.border)};
  background: ${(p) => (p.$on ? tk.blueLight : tk.white)};
  color: ${(p) => (p.$on ? tk.blue : tk.body)};
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 180ms;

  &:hover { border-color: ${tk.blue}; }
`

// ─── Soft note (owner payout not ready, etc) ────────────────────────────────
const InfoNote = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: ${tk.amberLight};
  border: 1px solid ${tk.amber};
  border-radius: 10px;
  color: ${tk.amberDark};
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 18px;
  animation: ${fadeDown} 300ms ease both;

  svg { color: ${tk.amberDark}; flex-shrink: 0; margin-top: 2px; }
`

// ─── Actions ────────────────────────────────────────────────────────────────
const Actions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
`

const SubmitBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 46px;
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
  height: 46px;
  padding: 0 22px;
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

// ─── States ────────────────────────────────────────────────────────────────
const StateCard = styled.div`
  background: ${tk.white};
  border: 1.5px dashed ${tk.border};
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  color: ${tk.muted};
  svg { color: ${tk.blue}; opacity: 0.6; margin-bottom: 12px; }
  h3 { font-family: 'Syne', sans-serif; color: ${tk.heading}; font-size: 1.1rem; margin: 0 0 6px; }
  p { margin: 0; font-size: 0.9rem; }
`

const Skeleton = styled.div`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  height: 320px;
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

// ─── Platform options ────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'other', label: 'Other' },
]

// ─── Component ────────────────────────────────────────────────────────────────
function UpgradeInner() {
  const params = useParams()
  const router = useRouter()
  const sp = useSearchParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined)
  const role = sp?.get('role') || 'sponsor'

  const [el, setEl] = useState<UpgradeEligibility | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const [budget, setBudget] = useState('100')
  const [perShare, setPerShare] = useState('1')
  const [channels, setChannels] = useState<string[]>(['twitter', 'facebook'])
  const [reason, setReason] = useState('')
  const [idemKey] = useState(() => newIdempotencyKey())

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await campaignUpgradeService.getEligibility(id)
        if (!cancelled) setEl(data)
      } catch (err: unknown) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Could not load campaign')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const toggleChannel = (ch: string) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]))
  }

  const softNote = useMemo(() => el?.reasons?.find((r) => !r.blocking && r.message), [el])

  const canSubmit = useMemo(() => {
    const b = Number(budget)
    const p = Number(perShare)
    return !working && b > 0 && p > 0 && channels.length > 0 && el?.actor_role === 'sponsor'
  }, [budget, channels.length, el?.actor_role, perShare, working])

  const submit = useCallback(async () => {
    if (!id || !canSubmit) return
    setWorking(true)
    try {
      await campaignUpgradeService.requestUpgradeForOther(id, {
        budget: Number(budget),
        reward_per_share: Number(perShare),
        platforms: channels,
        reason: reason.trim() || undefined,
        idempotency_key: idemKey,
      })
      toast.success(
        'Request sent — the campaign owner will see it in their inbox and decide.',
        { autoClose: 5000 }
      )
      // Return the sponsor to the campaign they just proposed on, not to
      // /upgrade-requests?tab=mine — that tab shows community-pool asks the
      // viewer has posted as an owner, not sponsor-proposals they've sent to
      // other people's campaigns.
      router.push(`/campaigns/${id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not send request')
    } finally {
      setWorking(false)
    }
  }, [budget, canSubmit, channels, id, idemKey, perShare, reason, router])

  return (
    <Page>
      <DashboardGlobalStyle />

      <Hero>
        <HeroInner>
          <BackLink href={`/campaigns/${id || ''}`}>
            <ArrowLeft size={12} />
            Back to campaign
          </BackLink>
          <Eyebrow>
            <Sparkles size={12} />
            {role === 'sponsor' ? 'Sponsor an upgrade' : 'Upgrade this campaign'}
          </Eyebrow>
          <Title>Lift this campaign to Share tier</Title>
          <Sub>
            Propose a share-to-earn setup. The owner has to approve before anything turns on —
            you&apos;re sending them a request, not changing their campaign.
          </Sub>
        </HeroInner>
      </Hero>

      <ContentWrap>
        {loading ? (
          <Skeleton />
        ) : !el || el.campaign.already_share_campaign ? (
          <StateCard>
            <ShieldCheck size={40} strokeWidth={1.5} />
            <h3>Nothing to upgrade</h3>
            <p>
              {el?.campaign.already_share_campaign
                ? 'This campaign is already a Share Campaign.'
                : 'Campaign not found or not eligible for upgrade.'}
            </p>
          </StateCard>
        ) : (
          <>
            {softNote && (
              <InfoNote>
                <Info size={16} />
                <div>{softNote.message}</div>
              </InfoNote>
            )}

            <Card>
              <CardLabel>Campaign</CardLabel>
              <CampaignRow>
                <RowKey>Title</RowKey>
                <RowVal>{el.campaign.title}</RowVal>
              </CampaignRow>
              <CampaignRow>
                <RowKey>Ref</RowKey>
                <RowVal style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8rem' }}>
                  {el.campaign.campaign_id}
                </RowVal>
              </CampaignRow>
              <CampaignRow>
                <RowKey>Current tier</RowKey>
                <RowVal>Free Campaign</RowVal>
              </CampaignRow>
              <CampaignRow>
                <RowKey>Will become</RowKey>
                <RowVal>Share Campaign (pending owner approval)</RowVal>
              </CampaignRow>
            </Card>

            <Card>
              <CardLabel>Share rewards</CardLabel>
              <Hint>Set the budget and per-share reward. The owner can adjust before approving.</Hint>

              <Field>
                <Label htmlFor="budget">Total reward budget (USD)</Label>
                <InputRow>
                  <DollarSign size={16} />
                  <Input
                    id="budget"
                    type="number"
                    min="1"
                    step="1"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="100"
                    disabled={working}
                  />
                </InputRow>
              </Field>

              <Field>
                <Label htmlFor="per-share">Reward per verified share (USD)</Label>
                <InputRow>
                  <Share2 size={16} />
                  <Input
                    id="per-share"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={perShare}
                    onChange={(e) => setPerShare(e.target.value)}
                    placeholder="1"
                    disabled={working}
                  />
                </InputRow>
              </Field>

              <Field>
                <Label>Channels</Label>
                <Hint>Where sharers can earn. Pick at least one.</Hint>
                <Chips>
                  {PLATFORMS.map((p) => {
                    const on = channels.includes(p.id)
                    return (
                      <Chip
                        key={p.id}
                        type="button"
                        $on={on}
                        onClick={() => toggleChannel(p.id)}
                        disabled={working}
                      >
                        {on && <CheckCircle2 size={12} />}
                        {p.label}
                      </Chip>
                    )
                  })}
                </Chips>
              </Field>
            </Card>

            <Card>
              <CardLabel>Note to the owner (optional)</CardLabel>
              <Hint>Tell them why you&apos;re proposing this. Short and personal works best.</Hint>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                placeholder="e.g. Your campaign reached a lot of people this week — I think a share budget would push it further."
                maxLength={500}
                disabled={working}
              />
              <CharCount>{reason.length} / 500</CharCount>
            </Card>

            <Actions>
              <SubmitBtn onClick={submit} disabled={!canSubmit}>
                <Send size={16} />
                {working ? 'Sending…' : 'Send request to owner'}
              </SubmitBtn>
              <CancelBtn href={`/campaigns/${id}`}>Cancel</CancelBtn>
            </Actions>
          </>
        )}
      </ContentWrap>
    </Page>
  )
}

export default function SponsorUpgradePage() {
  return (
    <ProtectedRoute>
      <UpgradeInner />
    </ProtectedRoute>
  )
}
