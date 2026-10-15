'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import styled, { keyframes, css } from 'styled-components';
import { motion, useInView } from 'framer-motion';
import { FiEdit3, FiShare2, FiHeart, FiArrowRight } from 'react-icons/fi';
import Container, { Section } from '../ui/Container';
import Button from '../ui/Button';

// ─── Keyframe Animations ──────────────────────────────────────────────────────

const floatY = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%       { transform: translateY(-18px) rotate(2deg); }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%       { opacity: 0.85; transform: scale(1.08); }
`;

const dashDraw = keyframes`
  from { stroke-dashoffset: 900; }
  to   { stroke-dashoffset: 0; }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const orbDrift = keyframes`
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.06); }
  66%       { transform: translate(-20px, 15px) scale(0.96); }
`;

// ─── Section Wrapper ──────────────────────────────────────────────────────────

const JourneySection = styled(Section)`
  position: relative;
  overflow: hidden;
  background: #FFFFFF;
  padding-top: 100px;
  padding-bottom: 120px;
`;

// Ambient background orbs
const Orb = styled.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  ${() => css`
    animation: ${orbDrift} ${({ dur }) => dur || '12s'} ease-in-out infinite;
    animation-delay: ${({ delay }) => delay || '0s'};
  `}

  ${({ variant }) => variant === 'pink' && css`
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%);
    top: -80px; left: -100px;
  `}
  ${({ variant }) => variant === 'violet' && css`
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
    top: 30%; right: -150px;
  `}
  ${({ variant }) => variant === 'amber' && css`
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
    bottom: -60px; left: 40%;
  `}
`;

// Noise texture overlay for depth
const NoiseOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 200px 200px;
`;

// ─── Header ───────────────────────────────────────────────────────────────────

const HeaderWrap = styled.div`
  text-align: center;
  margin-bottom: 72px;
  position: relative;
  z-index: 2;
`;

const EyebrowTag = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  border-radius: 100px;
  background: rgba(244,63,94,0.1);
  border: 1px solid rgba(244,63,94,0.2);
  margin-bottom: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #DC2626;
  font-family: 'DM Sans', system-ui, sans-serif;

  &::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #F43F5E;
    ${css`animation: ${pulseGlow} 2s ease-in-out infinite;`}
  }
`;

const SectionTitle = styled(motion.h2)`
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: clamp(34px, 5vw, 56px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #111827;
  margin-bottom: 16px;

  span {
    background: linear-gradient(135deg, #F43F5E 0%, #C084FC 50%, #F59E0B 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    ${css`animation: ${shimmer} 4s linear infinite;`}
  }
`;

const SectionSubtitle = styled(motion.p)`
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 17px;
  color: #6B7280;
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.65;
`;

// ─── Journey Layout ───────────────────────────────────────────────────────────

const JourneyWrap = styled.div`
  position: relative;
  z-index: 2;
`;

// SVG connector between cards (desktop only)
const ConnectorSVG = styled.svg`
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 160px;
  transform: translateY(-50%);
  pointer-events: none;
  display: none;

  @media (min-width: 1024px) {
    display: block;
  }
`;

const ConnectorPath = styled(motion.path)`
  fill: none;
  stroke: url(#pathGrad);
  stroke-width: 1.5;
  stroke-dasharray: 6 8;
  stroke-dashoffset: 900;
  stroke-linecap: round;
`;

const AnimatedConnectorPath = styled(motion.path)`
  fill: none;
  stroke: url(#glowGrad);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 900;
`;

const StepsGrid = styled(motion.div)`
  display: grid;
  gap: 28px;
  position: relative;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    align-items: start;
  }
`;

// ─── Step Card ────────────────────────────────────────────────────────────────

const CardOuter = styled(motion.div)`
  perspective: 1200px;
  /* Stagger vertical position on desktop for an arc feel */
  @media (min-width: 1024px) {
    margin-top: ${({ offset }) => offset || '0px'};
  }
`;

const CardGradientBorder = styled.div`
  border-radius: 24px;
  padding: 1.5px;
  background: ${({ gradient }) => gradient};
  box-shadow: ${({ glow }) => glow};
  transition: box-shadow 0.4s ease;
`;

const CardInner = styled.div`
  background: rgba(249, 250, 251, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 23px;
  padding: 40px 32px 36px;
  position: relative;
  overflow: hidden;
  text-align: center;
  transition: background 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 0%, ${({ topGlow }) => topGlow || 'rgba(244,63,94,0.02)'} 0%, transparent 65%);
    pointer-events: none;
  }
`;

// Giant ghost step number
const GhostNumber = styled.div`
  position: absolute;
  bottom: -20px;
  right: -8px;
  font-size: 130px;
  font-weight: 900;
  font-family: 'DM Sans', system-ui, sans-serif;
  line-height: 1;
  letter-spacing: -0.05em;
  color: ${({ color }) => color || 'rgba(244,63,94,0.02)'};
  pointer-events: none;
  user-select: none;
  transition: color 0.3s ease;

  ${CardGradientBorder}:hover & {
    color: ${({ colorHover }) => colorHover || 'rgba(244,63,94,0.05)'};
  }
`;

const StepBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${({ bg }) => bg};
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  font-family: 'DM Sans', system-ui, sans-serif;
  letter-spacing: 0.05em;
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
`;

const IconRing = styled.div`
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: ${({ bg }) => bg};
  border: 1px solid ${({ border }) => border || 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  ${({ dur, delay }) => css`
    animation: ${floatY} ${dur || '5s'} ease-in-out infinite;
    animation-delay: ${delay || '0s'};
  `}

  ${CardGradientBorder}:hover & {
    transform: scale(1.1) translateY(-4px);
    box-shadow: ${({ glow }) => glow || 'none'};
  }

  svg {
    width: 32px;
    height: 32px;
    color: ${({ iconColor }) => iconColor};
    stroke-width: 1.75;
  }
`;

const StepTitle = styled.h3`
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 19px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  letter-spacing: -0.02em;
`;

const StepDescription = styled.p`
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 15px;
  color: #6B7280;
  line-height: 1.65;
  margin: 0;
  position: relative;
  z-index: 1;
`;

// ─── CTA ─────────────────────────────────────────────────────────────────────

const CTAWrap = styled(motion.div)`
  text-align: center;
  margin-top: 72px;
  position: relative;
  z-index: 2;
`;

const CTAGlowRing = styled.div`
  display: inline-block;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -12px;
    border-radius: 100px;
    background: radial-gradient(ellipse, rgba(244,63,94,0.3) 0%, transparent 70%);
    filter: blur(16px);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const CTANote = styled.p`
  margin-top: 16px;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 13px;
  color: #9CA3AF;
  letter-spacing: 0.02em;
`;

// ─── Step Data ────────────────────────────────────────────────────────────────

const steps = [
  {
    number: 1,
    icon: FiEdit3,
    offset: '0px',
    title: 'Create a Campaign',
    description: 'Tell your story, set your need, and add your preferred payment methods. It takes just 5 minutes.',
    gradient: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(236,72,153,0.08) 50%, rgba(244,63,94,0.03) 100%)',
    cardGlow: '0 0 20px rgba(244,63,94,0.08), 0 10px 30px rgba(0,0,0,0.05)',
    topGlow: 'rgba(244,63,94,0.04)',
    iconBg: 'linear-gradient(135deg, rgba(244,63,94,0.12) 0%, rgba(244,63,94,0.06) 100%)',
    iconBorder: 'rgba(244,63,94,0.2)',
    iconGlow: '0 0 20px rgba(244,63,94,0.25)',
    iconColor: '#F43F5E',
    badgeBg: 'linear-gradient(135deg, #F43F5E, #E11D48)',
    ghostColor: 'rgba(244,63,94,0.03)',
    ghostHover: 'rgba(244,63,94,0.05)',
    floatDur: '5.5s',
    floatDelay: '0s',
  },
  {
    number: 2,
    icon: FiShare2,
    offset: '0px',
    title: 'Share & Get Support',
    description: 'Share on social media or by message. People who care will send support directly to you.',
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, rgba(99,102,241,0.03) 100%)',
    cardGlow: '0 0 20px rgba(99,102,241,0.08), 0 10px 30px rgba(0,0,0,0.05)',
    topGlow: 'rgba(99,102,241,0.04)',
    iconBg: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.06) 100%)',
    iconBorder: 'rgba(99,102,241,0.2)',
    iconGlow: '0 0 20px rgba(99,102,241,0.25)',
    iconColor: '#6366F1',
    badgeBg: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    ghostColor: 'rgba(99,102,241,0.03)',
    ghostHover: 'rgba(99,102,241,0.05)',
    floatDur: '6s',
    floatDelay: '0.8s',
  },
  {
    number: 3,
    icon: FiHeart,
    offset: '0px',
    title: 'Reward & Thank',
    description: 'Offer thank-you rewards or paid shares to top supporters who help spread the word.',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.08) 50%, rgba(245,158,11,0.03) 100%)',
    cardGlow: '0 0 20px rgba(245,158,11,0.08), 0 10px 30px rgba(0,0,0,0.05)',
    topGlow: 'rgba(245,158,11,0.04)',
    iconBg: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.06) 100%)',
    iconBorder: 'rgba(245,158,11,0.2)',
    iconGlow: '0 0 20px rgba(245,158,11,0.25)',
    iconColor: '#F59E0B',
    badgeBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
    ghostColor: 'rgba(245,158,11,0.03)',
    ghostHover: 'rgba(245,158,11,0.05)',
    floatDur: '5s',
    floatDelay: '1.5s',
  },
];

// ─── Animation Variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 48, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const ctaVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function HowItWorks() {
  const router = useRouter();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  const handleStartCampaign = () => {
    router.push('/login');
  };

  return (
    <JourneySection id="how-it-works" ref={sectionRef}>
      {/* Ambient background orbs */}
      <Orb variant="pink"  dur="14s" delay="0s" />
      <Orb variant="violet" dur="18s" delay="3s" />
      <Orb variant="amber"  dur="16s" delay="6s" />
      <NoiseOverlay />

      <Container>
        {/* ── Section Header ── */}
        <HeaderWrap>
          <EyebrowTag
            custom={0}
            variants={headerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            Simple Process
          </EyebrowTag>

          <SectionTitle
            custom={1}
            variants={headerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            How <span>HonestNeed</span> Works
          </SectionTitle>

          <SectionSubtitle
            custom={2}
            variants={headerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            Three simple steps to get the help you need from your community
          </SectionSubtitle>
        </HeaderWrap>

        {/* ── Journey Cards ── */}
        <JourneyWrap>
          {/* Animated SVG connector line (desktop only) */}
          <ConnectorSVG viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="rgba(244,63,94,0.4)" />
                <stop offset="50%"  stopColor="rgba(139,92,246,0.4)" />
                <stop offset="100%" stopColor="rgba(245,158,11,0.4)" />
              </linearGradient>
              <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="rgba(244,63,94,0.8)" />
                <stop offset="50%"  stopColor="rgba(139,92,246,0.8)" />
                <stop offset="100%" stopColor="rgba(245,158,11,0.8)" />
              </linearGradient>
            </defs>
            {/* Faint base path */}
            <ConnectorPath
              d="M 150 100 C 300 20, 450 20, 600 80 C 750 140, 900 140, 1050 60"
              initial={{ strokeDashoffset: 900, opacity: 0 }}
              animate={inView ? { strokeDashoffset: 0, opacity: 1 } : { strokeDashoffset: 900, opacity: 0 }}
              transition={{ duration: 1.8, delay: 0.4, ease: 'easeOut' }}
            />
            {/* Bright animated glow path */}
            <AnimatedConnectorPath
              d="M 150 100 C 300 20, 450 20, 600 80 C 750 140, 900 140, 1050 60"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={{ duration: 2.2, delay: 0.3, ease: 'easeInOut' }}
              style={{ strokeDasharray: '1', filter: 'blur(1.5px)' }}
            />
          </ConnectorSVG>

          <StepsGrid
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            {steps.map((step) => (
              <CardOuter
                key={step.number}
                offset={step.offset}
                variants={cardVariants}
                whileHover={{
                  y: -12,
                  rotateY: 3,
                  rotateX: -2,
                  scale: 1.02,
                  transition: { duration: 0.35, ease: 'easeOut' },
                }}
                style={{ transformStyle: 'preserve-3d', cursor: 'default' }}
              >
                <CardGradientBorder gradient={step.gradient} glow={step.cardGlow}>
                  <CardInner topGlow={step.topGlow}>
                    {/* Giant ghost number */}
                    <GhostNumber color={step.ghostColor} colorHover={step.ghostHover}>
                      {step.number}
                    </GhostNumber>

                    {/* Step badge */}
                    <StepBadge bg={step.badgeBg}>STEP {step.number}</StepBadge>

                    {/* Icon */}
                    <IconRing
                      bg={step.iconBg}
                      border={step.iconBorder}
                      glow={step.iconGlow}
                      iconColor={step.iconColor}
                      dur={step.floatDur}
                      delay={step.floatDelay}
                    >
                      <step.icon />
                    </IconRing>

                    <StepTitle>{step.title}</StepTitle>
                    <StepDescription>{step.description}</StepDescription>
                  </CardInner>
                </CardGradientBorder>
              </CardOuter>
            ))}
          </StepsGrid>
        </JourneyWrap>

        {/* ── CTA ── */}
        <CTAWrap
          variants={ctaVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <CTAGlowRing>
            <Button size="large" icon={FiArrowRight} onClick={handleStartCampaign}>
              Start Your Campaign
            </Button>
          </CTAGlowRing>
          <CTANote>Free to start · No platform fees on first campaign</CTANote>
        </CTAWrap>
      </Container>
    </JourneySection>
  );
}
