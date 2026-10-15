'use client'

/**
 * VideoEarnings — landing-page section (Phase 4).
 *
 * Pitches the auto-syndicated video upload feature with the earnings angle.
 * Up to $1.00 per verified share every 12 hours; the clip auto-posts to the
 * HonestNeed channel and syndicates to the user's biggest connected platform.
 *
 * Two CTAs: "Upload a video" (primary, routes to /videos/upload) and
 * "Watch the feed" (secondary, routes to /videos). Both work for signed-in
 * and signed-out viewers — the upload page prompts login.
 */

import Link from 'next/link'
import styled from 'styled-components'
import {
  Film,
  Sparkles,
  Upload,
  Play,
  Share2,
  DollarSign,
  Clock,
  ArrowRight,
} from 'lucide-react'

import { tk } from '@/styles/dashboardTokens'

const Section = styled.section`
  padding: 56px 16px;
  background: ${tk.canvas};

  @media (min-width: 768px) { padding: 72px 24px; }
`

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 36px;
  align-items: center;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }
`

const Copy = styled.div`
  min-width: 0;
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
  margin: 0 0 14px;
`

const Title = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, ${tk.heading} 0%, ${tk.blue} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
  line-height: 1.15;

  @media (min-width: 768px) { font-size: 2.2rem; }
  @media (min-width: 1200px) { font-size: 2.4rem; }
`

const Lead = styled.p`
  font-size: 1rem;
  color: ${tk.body};
  margin: 0 0 20px;
  line-height: 1.55;
  max-width: 56ch;
`

const BulletList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Bullet = styled.li`
  display: flex;
  gap: 10px;
  align-items: flex-start;

  svg {
    color: ${tk.blue};
    flex-shrink: 0;
    margin-top: 2px;
  }

  strong {
    display: block;
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    color: ${tk.heading};
    font-weight: 700;
    letter-spacing: -0.2px;
  }

  span {
    display: block;
    font-size: 0.88rem;
    color: ${tk.muted};
    line-height: 1.5;
    margin-top: 2px;
  }
`

const CTARow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const PrimaryCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 22px;
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

  &:hover {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.26);
  }
`

const SecondaryCTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 46px;
  padding: 0 22px;
  border-radius: 12px;
  border: 1.5px solid ${tk.blue};
  background: ${tk.white};
  color: ${tk.blue};
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.2px;
  transition: all 180ms;

  &:hover {
    background: ${tk.blueLight};
    transform: translateY(-1px);
  }
`

// ─── Right-side visual ──────────────────────────────────────────────────────
const Visual = styled.div`
  position: relative;
  padding: 24px;

  @media (min-width: 900px) { padding: 32px; }
`

// Mock video card — a styled preview with gradient thumb + play button, big
// earnings badge pinned to one corner. Pure CSS, no media needed.
const VideoCard = styled.div`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(26, 95, 168, 0.14);
  position: relative;
  animation: float 6s ease-in-out infinite;

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
`

const Thumb = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, ${tk.amberLight} 0%, ${tk.blueLight} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 30%, rgba(26, 95, 168, 0.12), transparent 60%);
  }
`

const PlayBubble = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${tk.blue};
  color: ${tk.white};
  box-shadow: 0 10px 32px rgba(26, 95, 168, 0.4);
  position: relative;
  z-index: 1;
`

const EarnBadge = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${tk.heading};
  color: ${tk.white};
  border-radius: 999px;
  font-family: 'Syne', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  box-shadow: 0 8px 24px rgba(24, 23, 26, 0.3);

  svg { color: ${tk.amberMid}; }
`

const CardMeta = styled.div`
  padding: 16px 18px;
`

const CardTitle = styled.h3`
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0 0 10px;
  letter-spacing: -0.2px;
`

const Stats = styled.div`
  display: flex;
  gap: 14px;
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
`

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

// Floating stat bubbles around the mock card for extra visual interest
const StatBubble = styled.div<{ $top?: string; $left?: string; $right?: string; $bottom?: string }>`
  position: absolute;
  top: ${(p) => p.$top || 'auto'};
  left: ${(p) => p.$left || 'auto'};
  right: ${(p) => p.$right || 'auto'};
  bottom: ${(p) => p.$bottom || 'auto'};
  padding: 10px 14px;
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(26, 95, 168, 0.12);
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  color: ${tk.heading};
  font-weight: 700;
  animation: bob 5s ease-in-out infinite;

  svg { color: ${tk.blue}; }

  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  @media (max-width: 500px) { display: none; }
`

export default function VideoEarnings() {
  return (
    <Section aria-labelledby="video-earnings-title">
      <Inner>
        <Copy>
          <Eyebrow>
            <Sparkles size={12} />
            Upload a video, we post it everywhere
          </Eyebrow>
          <Title id="video-earnings-title">
            Earn up to $1 per verified share.
          </Title>
          <Lead>
            Record a short clip. We auto-post it to the HonestNeed channel and syndicate it
            to your biggest connected platform. Supporters earn by sharing it — you earn too.
          </Lead>

          <BulletList>
            <Bullet>
              <Upload size={18} />
              <div>
                <strong>Upload once, posted everywhere</strong>
                <span>HonestNeed channel + your biggest connected platform, hands-off.</span>
              </div>
            </Bullet>
            <Bullet>
              <DollarSign size={18} />
              <div>
                <strong>Up to $1.00 per verified share</strong>
                <span>Rewards paid from the promo pool as shares are verified.</span>
              </div>
            </Bullet>
            <Bullet>
              <Clock size={18} />
              <div>
                <strong>12-hour cooldowns, anti-abuse limits</strong>
                <span>Fair for everyone — real shares earn, spam gets filtered.</span>
              </div>
            </Bullet>
          </BulletList>

          <CTARow>
            <PrimaryCTA href="/videos/upload">
              <Upload size={16} />
              Upload a video
            </PrimaryCTA>
            <SecondaryCTA href="/videos">
              <Play size={14} fill="currentColor" />
              Watch the feed
              <ArrowRight size={14} />
            </SecondaryCTA>
          </CTARow>
        </Copy>

        <Visual>
          <VideoCard>
            <Thumb>
              <PlayBubble><Play size={28} fill="currentColor" /></PlayBubble>
              <EarnBadge>
                <DollarSign size={14} />
                $1.00 / share
              </EarnBadge>
            </Thumb>
            <CardMeta>
              <CardTitle>Your campaign, in motion.</CardTitle>
              <Stats>
                <Stat><Film size={11} /> Auto-syndicated</Stat>
                <Stat><Share2 size={11} /> Share-to-earn ready</Stat>
              </Stats>
            </CardMeta>
          </VideoCard>

          <StatBubble $top="12px" $left="-8px">
            <Share2 size={14} />
            +324 shares
          </StatBubble>
          <StatBubble $bottom="24px" $right="-12px">
            <DollarSign size={14} />
            $82 earned
          </StatBubble>
        </Visual>
      </Inner>
    </Section>
  )
}
