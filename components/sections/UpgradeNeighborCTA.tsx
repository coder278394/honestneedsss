'use client'

/**
 * UpgradeNeighborCTA — home-page section (Phase 3 nav/home CTAs).
 *
 * Prominent card prompting viewers to pick up an open community upgrade
 * request. Visible to signed-in AND signed-out users; the target page
 * (`/upgrade-requests`) prompts login before any action, so no gating is
 * required here.
 */

import Link from 'next/link'
import { ArrowUpCircle, HeartHandshake } from 'lucide-react'
import styled from 'styled-components'

const Section = styled.section`
  padding: 48px 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%);
  @media (min-width: 768px) {
    padding: 64px 24px;
  }
`

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

const Card = styled(Link)`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.04);
  transition: transform 160ms ease, box-shadow 160ms ease;
  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  }
  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
`

const IconWrap = styled.div`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #dbeafe;
  color: #1e40af;
  display: flex;
  align-items: center;
  justify-content: center;
`

const CardTitle = styled.h3`
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
`

const CardBody = styled.p`
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
`

export default function UpgradeNeighborCTA() {
  return (
    <Section aria-labelledby="upgrade-neighbor-heading">
      <Inner>
        <div style={{ maxWidth: 560 }}>
          <h2 id="upgrade-neighbor-heading" style={{ marginTop: 0, color: '#111827' }}>
            Give someone else a boost
          </h2>
          <p style={{ color: '#4b5563', margin: 0 }}>
            Lift a neighbor&apos;s campaign. Help upgrade a Free Campaign so they can reach more
            people and reward sharers who help them succeed.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Card href="/upgrade-requests" aria-label="Help upgrade a neighbor's campaign">
            <IconWrap>
              <ArrowUpCircle size={24} />
            </IconWrap>
            <div>
              <CardTitle>Upgrade a Neighbor&apos;s Campaign</CardTitle>
              <CardBody>
                Browse open requests from creators asking the community for help. Pick one you believe
                in and sponsor the upgrade.
              </CardBody>
            </div>
          </Card>

          <Card href="/shares" aria-label="Share and earn">
            <IconWrap style={{ background: '#dcfce7', color: '#166534' }}>
              <HeartHandshake size={24} />
            </IconWrap>
            <div>
              <CardTitle>Share &amp; Earn</CardTitle>
              <CardBody>
                Share campaigns you care about with your biggest platform. Verified shares can earn
                rewards from the creator&apos;s share budget.
              </CardBody>
            </div>
          </Card>
        </div>
      </Inner>
    </Section>
  )
}
