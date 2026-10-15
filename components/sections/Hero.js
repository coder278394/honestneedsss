'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FiPlay, FiArrowRight, FiUsers, FiHeart, FiShare2, FiShield, FiZap, FiCheckCircle } from 'react-icons/fi';
import Button from '../ui/Button';
import Container from '../ui/Container';
import { apiClient } from '@/lib/api';

// ─── Background Animations ───────────────────────────────────────────────────

const floatA = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
  50% { transform: translateY(-24px) rotate(8deg); opacity: 1; }
`;

const floatB = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
  50% { transform: translateY(-16px) rotate(-6deg); opacity: 0.8; }
`;

const pulseRing = keyframes`
  0% { transform: scale(1); opacity: 0.3; }
  70% { transform: scale(1.4); opacity: 0; }
  100% { transform: scale(1.4); opacity: 0; }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const countUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Section & Layout ─────────────────────────────────────────────────────────

const HeroSection = styled.section`
  position: relative;
  padding: 72px 0 80px;
  overflow: hidden;
  background: #FDFCFF;

  /* Soft radial brand wash */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 50% at 15% 20%, rgba(255, 200, 0, 0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 85% 10%, rgba(56, 189, 248, 0.08) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 80% 80%, rgba(244, 63, 94, 0.06) 0%, transparent 55%),
      radial-gradient(ellipse 40% 40% at 10% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  /* Subtle dot grid */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(15, 23, 42, 0.06) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  @media (min-width: 1024px) {
    padding: 96px 0 104px;
  }
`;

const HeroContainer = styled(Container)`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 56px;
  align-items: center;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 64px;
  }
`;

// ─── Floating Blobs ───────────────────────────────────────────────────────────

const Blob = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
`;

const BlobYellow = styled(Blob)`
  width: 320px;
  height: 320px;
  background: rgba(253, 224, 71, 0.18);
  top: -80px;
  left: -60px;
  animation: ${floatA} 8s ease-in-out infinite;
`;

const BlobBlue = styled(Blob)`
  width: 260px;
  height: 260px;
  background: rgba(56, 189, 248, 0.14);
  top: 20px;
  right: -40px;
  animation: ${floatB} 10s ease-in-out infinite 2s;
`;

const BlobPink = styled(Blob)`
  width: 200px;
  height: 200px;
  background: rgba(244, 63, 94, 0.1);
  bottom: -40px;
  left: 30%;
  animation: ${floatA} 12s ease-in-out infinite 4s;
`;

// ─── Hero Content ─────────────────────────────────────────────────────────────

const HeroContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const EyebrowBadge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 8px;
  background: linear-gradient(135deg, rgba(255, 200, 0, 0.15) 0%, rgba(255, 160, 0, 0.1) 100%);
  border: 1.5px solid rgba(253, 200, 0, 0.35);
  border-radius: 999px;
  width: fit-content;
  font-size: 13px;
  font-weight: 600;
  color: #92400E;
  letter-spacing: 0.02em;

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #F59E0B;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1.5px solid #F59E0B;
      animation: ${pulseRing} 2s ease-out infinite;
    }
  }
`;

const Headline = styled(motion.h1)`
  font-family: 'Nunito', 'Fredoka One', 'Poppins', sans-serif;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.08;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.02em;

  .line-muted {
    color: #475569;
    font-weight: 700;
  }

  .highlight {
    position: relative;
    display: inline-block;
    background: linear-gradient(135deg, #F59E0B 0%, #EF4444 40%, #EC4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% auto;
    animation: ${shimmer} 4s linear infinite;
  }
`;

const Subhead = styled(motion.p)`
  font-family: 'Nunito', 'Inter', sans-serif;
  font-size: 18px;
  line-height: 1.65;
  color: #475569;
  max-width: 460px;
  font-weight: 500;

  strong {
    color: #0F172A;
    font-weight: 700;
  }
`;

const CTAGroup = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
`;

const PrimaryCTA = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
  color: #fff;
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 800;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(239, 68, 68, 0.35), 0 1px 3px rgba(0,0,0,0.1);
  letter-spacing: 0.01em;
  transition: box-shadow 0.2s ease, transform 0.15s ease;
  white-space: nowrap;

  &:hover {
    box-shadow: 0 8px 32px rgba(239, 68, 68, 0.45), 0 2px 8px rgba(0,0,0,0.12);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  .price-tag {
    font-size: 12px;
    font-weight: 700;
    background: rgba(255,255,255,0.25);
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.02em;
  }

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

const SecondaryCTA = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 22px;
  background: transparent;
  color: #334155;
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 700;
  border-radius: 14px;
  border: 2px solid #CBD5E1;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: #6366F1;
    color: #6366F1;
    background: rgba(99, 102, 241, 0.04);
  }

  svg {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: translateX(3px);
  }
`;

// ─── Stats Row ────────────────────────────────────────────────────────────────

const StatsRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 36px;
  background: #E2E8F0;
  flex-shrink: 0;

  @media (max-width: 400px) {
    display: none;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: ${countUp} 0.6s ease forwards;

  .value {
    font-family: 'Nunito', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #0F172A;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .label {
    font-size: 12px;
    font-weight: 600;
    color: #94A3B8;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;

// ─── Trust Badges ─────────────────────────────────────────────────────────────

const TrustRow = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
`;

const TrustBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748B;
  letter-spacing: 0.01em;

  svg {
    width: 14px;
    height: 14px;
    color: #22C55E;
    flex-shrink: 0;
  }
`;

// ─── Hero Visual ──────────────────────────────────────────────────────────────

const HeroVisual = styled(motion.div)`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const IllustrationContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1;
`;

// ─── PROTECTED: DO NOT MODIFY ─────────────────────────────────────────────────

const CommunityCircle = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CenterIcon = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme?.colors?.primary || '#6366F1'} 0%, ${({ theme }) => theme?.colors?.secondary || '#F43F5E'} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme?.shadows?.elevation3 || '0 18px 50px rgba(15, 23, 42, 0.12)'};

  svg {
    width: 56px;
    height: 56px;
    color: white;
  }
`;

const OrbitingElement = styled(motion.div)`
  position: absolute;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme?.colors?.surface || '#FFFFFF'};
  box-shadow: ${({ theme }) => theme?.shadows?.elevation2 || '0 6px 18px rgba(15, 23, 42, 0.08)'};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 28px;
    height: 28px;
    color: ${({ color }) => color};
  }
`;

const DemoButton = styled(motion.button)`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme?.spacing?.sm || '8px'};
  padding: ${({ theme }) => theme?.spacing?.md || '12px'} ${({ theme }) => theme?.spacing?.xl || '24px'};
  background-color: ${({ theme }) => theme?.colors?.surface || '#FFFFFF'};
  border-radius: ${({ theme }) => theme?.radii?.pill || '9999px'};
  box-shadow: ${({ theme }) => theme?.shadows?.elevation2 || '0 6px 18px rgba(15, 23, 42, 0.08)'};
  font-weight: ${({ theme }) => theme?.typography?.weights?.semibold || '600'};
  color: ${({ theme }) => theme?.colors?.text || '#0F172A'};
  transition: all ${({ theme }) => theme?.transitions?.fast || '140ms cubic-bezier(0.2, 0.9, 0.2, 1)'};
  border: none;
  cursor: pointer;

  &:hover {
    box-shadow: ${({ theme }) => theme?.shadows?.elevation3 || '0 18px 50px rgba(15, 23, 42, 0.12)'};
    transform: translateX(-50%) translateY(-2px);
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme?.colors?.primary || '#6366F1'};
  }
`;

// ─── END PROTECTED ZONE ───────────────────────────────────────────────────────

// ─── Social Proof Strip ───────────────────────────────────────────────────────

const SocialProofStrip = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
`;

const AvatarStack = styled.div`
  display: flex;
  align-items: center;

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2.5px solid #FDFCFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    color: #fff;
    margin-left: -8px;

    &:first-child { margin-left: 0; }
    &:nth-child(1) { background: linear-gradient(135deg, #F59E0B, #EF4444); }
    &:nth-child(2) { background: linear-gradient(135deg, #6366F1, #8B5CF6); }
    &:nth-child(3) { background: linear-gradient(135deg, #10B981, #06B6D4); }
    &:nth-child(4) { background: linear-gradient(135deg, #EC4899, #F43F5E); }
  }
`;

const SocialProofText = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: #64748B;
  line-height: 1.4;

  strong {
    color: #0F172A;
  }
`;

const VideoOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);

  video {
    width: 100%;
    aspect-ratio: 16/9;
    display: block;
  }

  /* Landscape full-screen on mobile: fill the viewport and letterbox the
     16:9 video instead of being constrained to the modal card. */
  &:fullscreen,
  &:-webkit-full-screen {
    width: 100vw;
    height: 100vh;
    max-width: none;
    border-radius: 0;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:fullscreen video,
  &:-webkit-full-screen video {
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
    object-fit: contain;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: background 0.15s;
  z-index: 10;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

// ─── Framer Motion Variants ───────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.2, 0.9, 0.2, 1],
    },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.2, 0.9, 0.2, 1] },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

// Formats a positive integer as a short, human-friendly stat label.
// 1245 → "1.2K", 8412 → "8.4K", 1_200_000 → "1.2M". Values below 1000 are
// shown verbatim; a sentinel of 0 shows as "0".
function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}K`;
  return String(v);
}

function formatMoney(cents) {
  const dollars = (Number(cents) || 0) / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(dollars % 1_000_000 === 0 ? 0 : 1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(dollars % 1_000 === 0 ? 0 : 1)}K`;
  return `$${dollars.toFixed(0)}`;
}

export default function Hero() {
  const router = useRouter();
  const [showVideo, setShowVideo] = useState(false);
  const [stats, setStats] = useState(null);
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);

  // Live platform counters for the hero. Cached server-side for 60s so this
  // never slows the first paint, and swallowed on error so the hero still
  // renders without numbers rather than crashing above the fold.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get('/campaigns/platform-stats');
        if (!cancelled && data && data.data) setStats(data.data);
      } catch {
        if (!cancelled) setStats({ campaigns: 0, supporters: 0, funds_moved_cents: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStartCampaign = () => router.push('/login');
  const handleBrowseNeeds = () => router.push('/sponsorships');

  const isMobileViewport = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 768px)').matches;

  // Demo video started → pause background music and, on mobile, go full screen
  // in landscape for an immersive playback experience.
  const handleVideoPlay = useCallback(() => {
    window.dispatchEvent(new Event('hn:duck-audio'));

    if (!isMobileViewport()) return;

    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video) return;

    // iOS Safari only supports fullscreen on the <video> element itself and
    // automatically rotates to landscape via its native player.
    if (typeof video.webkitEnterFullscreen === 'function') {
      try { video.webkitEnterFullscreen(); } catch {}
      return;
    }

    const target = container || video;
    const request =
      target.requestFullscreen ||
      target.webkitRequestFullscreen ||
      target.webkitRequestFullScreen;

    if (request) {
      Promise.resolve(request.call(target))
        .then(() => {
          if (window.screen?.orientation?.lock) {
            return window.screen.orientation.lock('landscape');
          }
        })
        .catch(() => {});
    }
  }, []);

  // Resume background music when the demo video is paused or finishes.
  const handleVideoStop = useCallback(() => {
    window.dispatchEvent(new Event('hn:unduck-audio'));
  }, []);

  const closeVideo = useCallback(() => {
    if (typeof window !== 'undefined' && window.screen?.orientation?.unlock) {
      try { window.screen.orientation.unlock(); } catch {}
    }
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    handleVideoStop();
    setShowVideo(false);
  }, [handleVideoStop]);

  // Release the landscape orientation lock whenever the user exits fullscreen
  // (e.g. via the system back gesture) so the page returns to portrait.
  useEffect(() => {
    if (!showVideo) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && window.screen?.orientation?.unlock) {
        try { window.screen.orientation.unlock(); } catch {}
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      // Safety: make sure music resumes if the overlay unmounts mid-play.
      window.dispatchEvent(new Event('hn:unduck-audio'));
    };
  }, [showVideo]);

  return (
    <HeroSection>
      <BlobYellow />
      <BlobBlue />
      <BlobPink />

      <HeroContainer>
        {/* ── LEFT: Content ─────────────────────────────────────────── */}
        <HeroContent>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
          >
            {/* Eyebrow */}
            <EyebrowBadge variants={itemVariants}>
              <span className="dot" />
              Community-Powered Support · Est. 2026
            </EyebrowBadge>

            {/* Headline */}
            <Headline variants={itemVariants}>
              <span className="line-muted">Help a Neighbor.</span>
              <br />
              <span className="highlight">Change a Life.</span>
            </Headline>

            {/* Subhead */}
            <Subhead variants={itemVariants}>
              Post your genuine need, share it with your network, and receive{' '}
              <strong>direct person-to-person support</strong> — no middlemen, no hidden fees.
            </Subhead>

            {/* CTAs */}
            <CTAGroup variants={itemVariants}>
              <PrimaryCTA
                onClick={handleStartCampaign}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiHeart />
                Start a Campaign
                <span className="price-tag">$20</span>
              </PrimaryCTA>

              <SecondaryCTA
                onClick={handleBrowseNeeds}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                View Sponsorships
                <FiArrowRight />
              </SecondaryCTA>
            </CTAGroup>

            {/* Social Proof */}
            <SocialProofStrip variants={itemVariants}>
              <AvatarStack>
                <div className="avatar">M</div>
                <div className="avatar">J</div>
                <div className="avatar">A</div>
                <div className="avatar">T</div>
              </AvatarStack>
              {/* Live supporter count. While stats are loading we show a
                  neutral copy so no hardcoded number ever flashes; when the
                  real count is still small, we lean on a mission-forward line
                  instead of a tiny number that undersells the platform. */}
              <SocialProofText>
                {stats && stats.supporters >= 10 ? (
                  <>
                    <strong>{stats.supporters.toLocaleString()}+ supporters</strong>{' '}
                    already helping their communities
                  </>
                ) : (
                  <>
                    <strong>Join a growing community</strong> helping neighbors with real needs
                  </>
                )}
              </SocialProofText>
            </SocialProofStrip>

            {/* Stats — live counters from /campaigns/platform-stats. Dashes
                while loading, so the hero never shows a stale hardcoded number. */}
            <StatsRow variants={itemVariants}>
              <StatItem>
                <span className="value">{stats ? formatCount(stats.campaigns) : '—'}</span>
                <span className="label">Campaigns</span>
              </StatItem>
              <StatDivider />
              <StatItem>
                <span className="value">{stats ? formatCount(stats.supporters) : '—'}</span>
                <span className="label">Supporters</span>
              </StatItem>
              <StatDivider />
              <StatItem>
                <span className="value">{stats ? formatMoney(stats.funds_moved_cents) : '—'}</span>
                <span className="label">Funds Moved</span>
              </StatItem>
            </StatsRow>

            {/* Trust Badges */}
            <TrustRow variants={itemVariants}>
              <TrustBadge>
                <FiShield />
                Verified Platform
              </TrustBadge>
              <TrustBadge>
                <FiCheckCircle />
                Secure Payments
              </TrustBadge>
              <TrustBadge>
                <FiZap />
                Funds Move Directly
              </TrustBadge>
            </TrustRow>
          </motion.div>
        </HeroContent>

        {/* ── RIGHT: Visual (ORBIT ANIMATION — PROTECTED, UNTOUCHED) ── */}
        <HeroVisual
          variants={slideInRight}
          initial="hidden"
          animate="visible"
        >
          <IllustrationContainer>
            {/* ── PROTECTED ORBIT SYSTEM — DO NOT MODIFY ── */}
            <CommunityCircle
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            >
              <CenterIcon>
                <FiHeart />
              </CenterIcon>
            </CommunityCircle>

            <OrbitingElement
              style={{ top: '10%', left: '10%' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <FiUsers color="#E11D48" />
            </OrbitingElement>

            <OrbitingElement
              style={{ top: '10%', right: '10%' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <FiShare2 color="#6366F1" />
            </OrbitingElement>

            <OrbitingElement
              style={{ bottom: '20%', left: '5%' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <FiHeart color="#F59E0B" />
            </OrbitingElement>

            <OrbitingElement
              style={{ bottom: '20%', right: '5%' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <FiHeart color="#10B981" />
            </OrbitingElement>

            <DemoButton
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowVideo(true)}
            >
              <FiPlay />
              Play 60s demo
            </DemoButton>
            {/* ── END PROTECTED ORBIT SYSTEM ── */}
          </IllustrationContainer>
        </HeroVisual>
      </HeroContainer>

      {showVideo && (
        <VideoOverlay onClick={closeVideo}>
          <VideoContainer ref={videoContainerRef} onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeVideo} aria-label="Close video">✕</CloseButton>
            <video
              ref={videoRef}
              src="https://res.cloudinary.com/dctvil2gu/video/upload/v1780898911/Honestneed_fgty7u.mp4"
              controls
              autoPlay
              playsInline
              onPlay={handleVideoPlay}
              onPause={handleVideoStop}
              onEnded={handleVideoStop}
            />
          </VideoContainer>
        </VideoOverlay>
      )}
    </HeroSection>
  );
}