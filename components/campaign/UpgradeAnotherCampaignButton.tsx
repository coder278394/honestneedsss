'use client'

/**
 * UpgradeAnotherCampaignButton
 * -------------------------------------------------------------------------
 * Rendered on CampaignCard. Visible to any signed-in viewer; signed-out
 * viewers see a disabled button that routes to login.
 *
 * Visibility rules (purely rendering — server re-checks on mutation):
 *   - Not shown at all on sharing (already-upgraded) campaigns.
 *   - Disabled with a reason when the viewer is not a qualified sponsor,
 *     or when the campaign is in a non-upgradeable state.
 *
 * Eligibility is fetched lazily on hover/click to keep the card list cheap.
 */

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import { ArrowUpCircle } from 'lucide-react'
import { toast } from 'react-toastify'

import { tk } from '@/styles/dashboardTokens'
import { campaignUpgradeService, type UpgradeEligibility } from '@/services/campaignUpgradeService'

// Twin of ViewDetailsBtn in CampaignCard.tsx so the two buttons share edges,
// baselines, radius, type scale, and flex sizing. Outlined-red treatment keeps
// the "View Details" primary action primary; this one reads as the paired
// secondary action in the same button pair, not a third-party widget.
// Sizing (flex-basis, min-width, flex-grow) is set by the parent `Actions`
// rule in CampaignCard.tsx so the whole row stays consistent and this button
// participates in the share-or-stack layout automatically.
const UpgradeBtn = styled.button`
  height: 40px;
  border-radius: 10px;
  background: transparent;
  color: ${tk.red};
  border: 1.5px solid ${tk.red};
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  letter-spacing: 0.2px;
  padding: 0 12px;
  white-space: nowrap;
  transition: background 180ms ease, color 180ms ease, transform 120ms ease, box-shadow 180ms ease;

  svg { flex-shrink: 0; }

  &:hover:not(:disabled) {
    background: ${tk.red};
    color: ${tk.white};
    transform: scale(1.01);
    box-shadow: 0 6px 14px -8px ${tk.red};
  }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

interface Campaign {
  campaign_id: string
  _id?: string
  campaign_type?: 'fundraising' | 'sharing'
  creator_id?: string
}

interface Props {
  campaign: Campaign
  viewerId?: string | null
  isAuthenticated: boolean
  // Kept for backwards compatibility; the card-matched style is now the only
  // treatment used in production.
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

export default function UpgradeAnotherCampaignButton({ campaign, viewerId, isAuthenticated, variant: _variant = 'secondary' }: Props) {
  const router = useRouter()
  const [working, setWorking] = useState(false)

  const isOwnCampaign = !!(viewerId && campaign.creator_id && String(viewerId) === String(campaign.creator_id))
  const isAlreadyUpgraded = campaign.campaign_type === 'sharing'

  // The whole affordance is suppressed when the campaign is irrelevant for
  // sponsor-upgrade; render nothing rather than a disabled button nobody can
  // ever use.
  if (isAlreadyUpgraded || isOwnCampaign) return null

  const handleClick = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/login?return_to=/campaigns/${encodeURIComponent(campaign.campaign_id)}`)
      return
    }
    setWorking(true)
    try {
      // getEligibility already unwraps `data.data` into a flat UpgradeEligibility.
      // The sponsor path is allowed when the campaign itself is upgradeable AND
      // the viewer qualifies as a sponsor (actor_role === 'sponsor'). A viewer
      // with no donate/share history on this campaign comes back as 'viewer'
      // with no blocking reason listed — that case needs its own message.
      const el: UpgradeEligibility = await campaignUpgradeService.getEligibility(
        campaign.campaign_id
      )

      if (el.actor_role === 'sponsor' && el.eligible) {
        router.push(`/campaigns/${encodeURIComponent(campaign.campaign_id)}/upgrade?role=sponsor`)
        return
      }

      if (el.actor_role === 'viewer') {
        toast.info(
          'Only supporters who have donated to or shared this campaign can request an upgrade for it. Donate or share first, then try again.'
        )
        return
      }

      const firstBlock = el.reasons?.find((r) => r.blocking)
      toast.info(firstBlock?.message || 'You cannot upgrade this campaign right now.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not check eligibility'
      toast.error(message)
    } finally {
      setWorking(false)
    }
  }, [campaign.campaign_id, isAuthenticated, router])

  return (
    <UpgradeBtn
      type="button"
      onClick={handleClick}
      disabled={working}
      aria-label={`Help upgrade ${campaign.campaign_id}`}
    >
      <ArrowUpCircle size={14} />
      {working ? 'Checking…' : 'Help upgrade'}
    </UpgradeBtn>
  )
}
