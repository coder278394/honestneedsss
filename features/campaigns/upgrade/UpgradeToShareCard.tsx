'use client'

/**
 * "Upgrade to Share Campaign" card.
 *
 * Drops onto the owner's view of a campaign. Renders every eligibility state:
 * eligible · blocked on a payout method · already upgraded · ineligible status ·
 * under review · loading · success.
 *
 * The CTA is deliberately understated — a bordered card with a single primary
 * button, not a banner. Creators here are often asking for help with something
 * hard; an aggressive upsell would read badly.
 *
 * Eligibility is re-fetched on mount (staleTime 0 in the hook) so a user who
 * just added a payout method in another tab, or who is returning via the
 * gate's `returnTo` link, is not shown a stale blocked state.
 */

import { useState } from 'react'
import styled from 'styled-components'
import { Sparkles, CheckCircle2, Info } from 'lucide-react'
import { useUpgradeEligibility, useUpgradeCampaign } from '@/hooks/useCampaignUpgrade'
import PayoutMethodGate from './PayoutMethodGate'
import UpgradeModal from './UpgradeModal'

// Local palette mirrors the campaign-detail page tokens so the card reads as a
// native section of that page, not a transplanted widget. See
// app/(campaigns)/campaigns/[id]/CampaignDetailClient.tsx for the source.
const t = {
  sand:        '#FAF8F4',
  cream:       '#F3EFE8',
  clay:        '#E8E0D4',
  slate:       '#2C2B28',
  charcoal:    '#4A4845',
  muted:       '#8A857D',
  border:      '#DDD8CF',
  accent:      '#C4622D',
  accentLight: '#FAEAE1',
  accentDark:  '#9E4A1E',
  success:     '#166534',
  successLight:'#F0FDF4',
  white:       '#FFFFFF',
}

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border: 1px solid ${t.border};
  border-radius: 18px;
  background: ${t.white};
  font-family: 'DM Sans', sans-serif;
  color: ${t.slate};
  box-shadow: 0 1px 0 rgba(44,43,40,0.02), 0 20px 40px -28px rgba(44,43,40,0.18);
`

const IconBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${t.accentLight};
  color: ${t.accent};
  flex-shrink: 0;
`

const HeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Heading = styled.h3`
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${t.slate};
  text-wrap: balance;
`

const Text = styled.p`
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: ${t.charcoal};
`

const Cta = styled.button`
  align-self: flex-start;
  min-height: 44px;
  padding: 10px 22px;
  border: none;
  border-radius: 100px;
  background: ${t.accent};
  color: ${t.white};
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: background 180ms ease, transform 120ms ease, box-shadow 180ms ease;

  &:hover:not(:disabled) {
    background: ${t.accentDark};
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -12px ${t.accent};
  }
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: ${t.muted};
  }
  &:focus-visible {
    outline: 2px solid ${t.accentDark};
    outline-offset: 2px;
  }

  @media (max-width: 640px) {
    align-self: stretch;
  }
`

const Chip = styled.span<{ $tone: 'success' | 'muted' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 100px;
  font-family: 'Syne', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  background: ${({ $tone }) => ($tone === 'success' ? t.successLight : t.cream)};
  color: ${({ $tone }) => ($tone === 'success' ? t.success : t.charcoal)};
`

const Skeleton = styled.div`
  height: 112px;
  border-radius: 18px;
  background: ${t.cream};

  @media (prefers-reduced-motion: no-preference) {
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

/** Reason codes that mean "nothing the creator can do right now". */
const HARD_BLOCKERS = ['CAMPAIGN_STATUS_INELIGIBLE', 'CAMPAIGN_NOT_ELIGIBLE']

export interface UpgradeToShareCardProps {
  campaignId: string
  /** Where the payout-method flow should return the user to. */
  returnTo?: string
}

export function UpgradeToShareCard({ campaignId, returnTo }: UpgradeToShareCardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading, isError } = useUpgradeEligibility(campaignId)
  const upgrade = useUpgradeCampaign(campaignId)

  if (isLoading) return <Skeleton aria-hidden="true" />

  // Never let a failed eligibility lookup break the campaign page.
  if (isError || !data) return null

  // Only the owner gets this card. Supporters see the boost affordance instead.
  if (data.actor_role !== 'creator') return null

  const resolvedReturnTo = returnTo || `/campaigns/${data.campaign.campaign_id}`

  // Already a Share Campaign — acknowledge it and stop.
  if (data.campaign.already_share_campaign) {
    return (
      <Card aria-label="Share Campaign status">
        <Chip $tone="success">
          <CheckCircle2 size={13} aria-hidden="true" /> Share Campaign
        </Chip>
        <Text>
          Supporters can earn rewards for sharing this campaign
          {data.campaign.original_campaign_type
            ? ' — upgraded from a free campaign.'
            : '.'}
        </Text>
      </Card>
    )
  }

  const hardBlocker = data.reasons.find((r) => HARD_BLOCKERS.includes(r.code))
  const payoutBlocker = data.reasons.find(
    (r) => r.code === 'NO_PAYOUT_METHOD' || r.code === 'PAYOUT_READINESS_CHECK_FAILED'
  )

  // Paused for review, completed, ended: explain, offer nothing.
  if (hardBlocker) {
    return (
      <Card aria-label="Upgrade to Share Campaign">
        <HeadRow>
          <IconBadge><Info size={18} aria-hidden="true" /></IconBadge>
          <Heading>Upgrade to a Share Campaign</Heading>
        </HeadRow>
        <Text>{hardBlocker.message}</Text>
        <Cta type="button" disabled aria-disabled="true">
          Upgrade to Share Campaign
        </Cta>
      </Card>
    )
  }

  return (
    <>
      <Card aria-label="Upgrade to Share Campaign">
        <HeadRow>
          <IconBadge><Sparkles size={18} aria-hidden="true" /></IconBadge>
          <Heading>Turn this into a Share Campaign</Heading>
        </HeadRow>
        <Text>
          Reward the people who share your story. Everything on this page stays exactly as it is —
          you just add a reward for supporters whose shares bring someone in.
        </Text>

        {payoutBlocker && (
          <PayoutMethodGate
            level="none"
            returnTo={resolvedReturnTo}
            message={payoutBlocker.message}
          />
        )}

        {!payoutBlocker && data.payout_readiness.level === 'provisional' && (
          <PayoutMethodGate
            level="provisional"
            method={data.payout_readiness.method}
            returnTo={resolvedReturnTo}
          />
        )}

        <Cta
          type="button"
          disabled={!!payoutBlocker || upgrade.isPending}
          onClick={() => setModalOpen(true)}
        >
          {upgrade.isPending ? 'Upgrading…' : 'Upgrade to Share Campaign'}
        </Cta>
      </Card>

      {modalOpen && (
        <UpgradeModal
          eligibility={data}
          returnTo={resolvedReturnTo}
          isSubmitting={upgrade.isPending}
          errorMessage={(upgrade.error as any)?.response?.data?.message ?? null}
          onClose={() => setModalOpen(false)}
          onConfirm={(payload) =>
            upgrade.mutate(payload, {
              onSuccess: () => setModalOpen(false),
              // Deliberately stays open on failure: the same idempotency key is
              // reused for the retry, so re-submitting cannot double-upgrade.
            })
          }
        />
      )}
    </>
  )
}

export default UpgradeToShareCard
