'use client'

/**
 * Payout method gate.
 *
 * The blocked state a creator sees when they try to turn their campaign into a
 * Share Campaign without a usable payout method.
 *
 * The copy matters here as much as the code. A Share Campaign is a promise to
 * pay sharers directly, so this is not bureaucratic friction — explaining WHY
 * we need the method is what stops the gate reading as an arbitrary blocker.
 *
 * The "Add a payout method" action carries a `returnTo` so the user lands back
 * in the upgrade flow afterwards, and the caller re-fetches eligibility on
 * mount rather than trusting anything cached across that navigation.
 */

import Link from 'next/link'
import styled from 'styled-components'
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react'
import type { PayoutReadinessLevel, PayoutMethodSummary } from '@/services/campaignUpgradeService'

// Mirrors the campaign-detail page palette so the gate reads as the same
// surface rather than a stock warning box.
const t = {
  cream:       '#F3EFE8',
  clay:        '#E8E0D4',
  slate:       '#2C2B28',
  charcoal:    '#4A4845',
  muted:       '#8A857D',
  border:      '#DDD8CF',
  accent:      '#C4622D',
  accentLight: '#FAEAE1',
  accentDark:  '#9E4A1E',
  warnBg:      '#FDF6E3',
  warnBorder:  '#E6D4A3',
  warnText:    '#7A5C13',
  infoBg:      '#EEF2FF',
  infoBorder:  '#C7D2FE',
  infoText:    '#2537B2',
  white:       '#FFFFFF',
}

/**
 * Where a creator adds a payout method.
 *
 * `/settings` IS the payout-method screen — the whole page is devoted to
 * payment methods. There is no `/settings/payment-methods` route, and linking
 * to one sends creators to a 404 at exactly the moment they were trying to
 * unblock themselves.
 */
export const PAYOUT_METHOD_SETTINGS_PATH = '/settings'

const Panel = styled.div<{ $tone: 'warning' | 'info' }>`
  display: flex;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  font-family: 'DM Sans', sans-serif;
  border: 1px solid
    ${({ $tone }) => ($tone === 'warning' ? t.warnBorder : t.infoBorder)};
  background: ${({ $tone }) => ($tone === 'warning' ? t.warnBg : t.infoBg)};
`

const IconWrap = styled.span<{ $tone: 'warning' | 'info' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  background: ${({ $tone }) => ($tone === 'warning' ? '#F2E4B6' : '#DBE2FE')};
  color: ${({ $tone }) => ($tone === 'warning' ? t.warnText : t.infoText)};
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

const Title = styled.p`
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: -0.005em;
  color: ${t.slate};
`

const Text = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: ${t.charcoal};
`

const Action = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  min-height: 40px;
  padding: 9px 18px;
  margin-top: 4px;
  border-radius: 100px;
  background: ${t.accent};
  color: ${t.white};
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.3px;
  text-decoration: none;
  transition: background 180ms ease, transform 120ms ease, box-shadow 180ms ease;

  &:hover {
    background: ${t.accentDark};
    transform: translateY(-1px);
    box-shadow: 0 8px 18px -12px ${t.accent};
  }

  &:focus-visible {
    outline: 2px solid ${t.accentDark};
    outline-offset: 2px;
  }

  svg { transition: transform 180ms ease; }
  &:hover svg { transform: translateX(2px); }
`

export interface PayoutMethodGateProps {
  level: PayoutReadinessLevel
  method?: PayoutMethodSummary | null
  /** Where to send the user back to once they've saved a method. */
  returnTo: string
  /** Shown instead of the default copy when the server supplied a reason. */
  message?: string | null
  /** The blocker is the campaign owner's method, not the viewer's. */
  isOwnerBlocked?: boolean
}

export function PayoutMethodGate({
  level,
  method,
  returnTo,
  message,
  isOwnerBlocked,
}: PayoutMethodGateProps) {
  // Provisional is a WARNING, not a blocker: the live payout path accepts a
  // method that is still verifying, so blocking here would leave a user unable
  // to upgrade while being perfectly payable.
  if (level === 'provisional') {
    return (
      <Panel $tone="info" role="status">
        <IconWrap $tone="info"><Clock size={16} aria-hidden="true" /></IconWrap>
        <Body>
          <Title>Your payout method is still being verified</Title>
          <Text>
            You can go ahead and upgrade now
            {method?.last_four ? ` using your account ending ${method.last_four}` : ''}. We&apos;ll
            let you know if anything needs your attention.
          </Text>
        </Body>
      </Panel>
    )
  }

  if (isOwnerBlocked) {
    return (
      <Panel $tone="warning" role="alert">
        <IconWrap $tone="warning"><AlertTriangle size={16} aria-hidden="true" /></IconWrap>
        <Body>
          <Title>This campaign isn&apos;t ready for Share-to-Earn yet</Title>
          <Text>
            {message ||
              'The campaign owner needs to add a payout method before supporters can earn rewards for sharing.'}
          </Text>
        </Body>
      </Panel>
    )
  }

  return (
    <Panel $tone="warning" role="alert">
      <IconWrap $tone="warning"><AlertTriangle size={16} aria-hidden="true" /></IconWrap>
      <Body>
        <Title>Add a payout method first</Title>
        <Text>
          {message ||
            'Share Campaigns reward the people who share your story — and you pay those rewards directly. We need to know where your money moves before you can promise anyone a reward.'}
        </Text>
        <Action href={`${PAYOUT_METHOD_SETTINGS_PATH}?returnTo=${encodeURIComponent(returnTo)}`}>
          Add a payout method
          <ArrowRight size={16} aria-hidden="true" />
        </Action>
      </Body>
    </Panel>
  )
}

export default PayoutMethodGate
