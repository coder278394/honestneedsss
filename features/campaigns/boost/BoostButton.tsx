'use client'

/**
 * Community Boost button.
 *
 * One user amplifying ANOTHER user's campaign — free, and capped at one
 * ranking-effective boost per campaign per day (the same rule sharers already
 * know from the daily share quota).
 *
 * ⚠️ This is not the creator's paid "Promote" purchase. Keep the copy distinct:
 * "Boost" here, "Promote" there.
 *
 * States rendered: available · already boosted today (with countdown) ·
 * unauthenticated · ineligible · self (renders nothing).
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styled from 'styled-components'
import { Zap } from 'lucide-react'
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, TRANSITIONS } from '@/styles/tokens'
import { useBoostEligibility, useBoostCampaign } from '@/hooks/useCampaignBoost'
import type { BoostSource } from '@/services/campaignBoostService'

const Wrap = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: ${SPACING[1]};

  /* On narrow screens the wrap stretches so the Button inside can also go
     full-width and show the complete label. */
  @media (max-width: 560px) {
    display: flex;
    width: 100%;
  }
`

const Button = styled.button<{ $boosted?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING[2]};
  /* 44px minimum touch target. */
  min-height: 44px;
  padding: ${SPACING[2]} ${SPACING[4]};
  border-radius: ${BORDER_RADIUS.FULL};
  font-weight: ${TYPOGRAPHY.WEIGHT_BOLD};
  font-size: 0.9375rem;
  cursor: pointer;
  transition: ${TRANSITIONS.BASE};
  border: 1px solid ${({ $boosted }) => ($boosted ? COLORS.SUCCESS : COLORS.PRIMARY)};
  background: ${({ $boosted }) => ($boosted ? COLORS.SUCCESS_BG : COLORS.SURFACE)};
  color: ${({ $boosted }) => ($boosted ? COLORS.SUCCESS_DARK : COLORS.PRIMARY)};

  &:hover:not(:disabled) {
    background: ${COLORS.PRIMARY};
    color: ${COLORS.SURFACE};
  }

  &:focus-visible {
    outline: 2px solid ${COLORS.PRIMARY_DARK};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.9;
  }

  /* Full-width on narrow screens so the label never collapses to a lone icon
     — "Boost this campaign (free)" is the whole point of the control, hiding
     the words leaves a mystery lightning bolt. */
  @media (max-width: 560px) {
    width: 100%;
    padding: ${SPACING[2]} ${SPACING[3]};
  }

  .boost-label {
    white-space: normal;
    text-align: center;
    line-height: 1.25;
  }
`

const Count = styled.span`
  font-variant-numeric: tabular-nums;
`

const Hint = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.MUTED_TEXT};
  line-height: 1.4;
`

/** Human countdown to the next boost window. */
function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [target])

  return useMemo(() => {
    if (!target) return null
    const ms = new Date(target).getTime() - now
    if (ms <= 0) return null
    const hours = Math.floor(ms / 3_600_000)
    const minutes = Math.floor((ms % 3_600_000) / 60_000)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }, [target, now])
}

export interface BoostButtonProps {
  campaignId: string
  source?: BoostSource
  /** Hide the running boost count (e.g. on dense list cards). */
  hideCount?: boolean
}

export function BoostButton({ campaignId, source = 'campaign_page', hideCount }: BoostButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data, isLoading, isError } = useBoostEligibility(campaignId)
  const boost = useBoostCampaign(campaignId)
  const countdown = useCountdown(data?.next_boost_available_at)

  if (isLoading) {
    return (
      <Button type="button" disabled aria-busy="true">
        <Zap size={16} aria-hidden="true" />
        <span className="boost-label">Loading…</span>
      </Button>
    )
  }

  // A failed eligibility check should never block the rest of the page.
  if (isError || !data) return null

  // The owner's own campaign: no affordance at all rather than a disabled one.
  if (data.state === 'self_boost') return null

  if (data.state === 'unauthenticated') {
    return (
      <Button
        type="button"
        onClick={() => router.push(`/login?returnTo=${encodeURIComponent(pathname || '/')}`)}
      >
        <Zap size={16} aria-hidden="true" />
        <span className="boost-label">Sign in to boost this campaign</span>
      </Button>
    )
  }

  if (data.state === 'ineligible_campaign') {
    return (
      <Wrap>
        <Button type="button" disabled aria-describedby={`boost-hint-${campaignId}`}>
          <Zap size={16} aria-hidden="true" />
          <span className="boost-label">Can&apos;t boost right now</span>
        </Button>
        <Hint id={`boost-hint-${campaignId}`}>
          {data.reason || 'This campaign cannot be boosted right now.'}
        </Hint>
      </Wrap>
    )
  }

  const boosted = data.state === 'already_boosted_today'
  const pending = boost.isPending

  // Copy choice: "Boost" alone is jargon — new users don't know whether they're
  // paying, signing something, or just clicking a like. "Boost this campaign
  // (free)" names the target and the price. The success state thanks the
  // viewer so the next tap doesn't feel like a failure.
  const label = pending
    ? 'Boosting…'
    : boosted
      ? 'Boosted today — thanks!'
      : 'Boost this campaign (free)'

  return (
    <Wrap>
      <Button
        type="button"
        $boosted={boosted}
        disabled={boosted || pending}
        aria-pressed={boosted}
        aria-describedby={boosted && countdown ? `boost-hint-${campaignId}` : undefined}
        onClick={() => boost.mutate({ source })}
        title="Push this campaign higher in the trending list. Free; one boost per day."
      >
        <Zap size={16} aria-hidden="true" fill={boosted ? 'currentColor' : 'none'} />
        <span className="boost-label">{label}</span>
        {!hideCount && data.community_boost_count > 0 && (
          <Count aria-label={`${data.community_boost_count} boosts`}>
            {data.community_boost_count}
          </Count>
        )}
      </Button>

      {/* Count changes are announced without stealing focus. */}
      <span aria-live="polite" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
        {data.community_boost_count} boosts
      </span>

      {!boosted && !pending && (
        <Hint id={`boost-hint-${campaignId}`}>
          Pushes this campaign higher in the trending list. Free — one boost per day.
        </Hint>
      )}

      {boosted && countdown && (
        <Hint id={`boost-hint-${campaignId}`}>You can boost again in {countdown}</Hint>
      )}
    </Wrap>
  )
}

export default BoostButton
