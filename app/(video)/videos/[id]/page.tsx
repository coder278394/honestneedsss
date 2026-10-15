'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import {
  ArrowLeft,
  Sparkles,
  Clock,
  Eye,
  Share2,
  ShieldCheck,
  BadgeCheck,
  Film,
  Calendar,
} from 'lucide-react'

import VideoPlayer from '@/components/videos/VideoPlayer'
import { videoService, type Video } from '@/services/videoService'
import { tk, DashboardGlobalStyle, fadeDown } from '@/styles/dashboardTokens'

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
  padding: 20px 16px 16px;
  @media (min-width: 640px) { padding: 24px 24px 20px; }
  @media (min-width: 1024px) { padding: 28px 32px 24px; }
`

const HeroInner = styled.div`
  max-width: 1200px;
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
  transition: color 180ms;
  &:hover { color: ${tk.blue}; }
`

const ContentWrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 12px 48px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 640px) { padding: 24px 20px 56px; }
  @media (min-width: 1024px) {
    padding: 28px 32px 64px;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 28px;
    align-items: start;
  }
`

const PlayerCol = styled.main`
  min-width: 0;
`

const PlayerCard = styled.div`
  background: ${tk.heading};
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid ${tk.border};
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;

  video, > * {
    width: 100%;
    height: 100%;
  }
`

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: ${tk.heading};
  margin: 20px 0 10px;
  line-height: 1.25;
  letter-spacing: -0.3px;

  @media (min-width: 640px) { font-size: 1.75rem; }
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
`

const Pill = styled.span<{ $tone?: 'blue' | 'amber' | 'veteran' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
  ${(p) => {
    if (p.$tone === 'veteran') return `background: ${tk.blue}; color: ${tk.white}; letter-spacing: 0.5px; text-transform: uppercase;`
    if (p.$tone === 'amber') return `background: ${tk.amberLight}; color: ${tk.amberDark};`
    return `background: ${tk.blueLight}; color: ${tk.blue};`
  }}
`

const DescriptionBlock = styled.section`
  margin-top: 24px;
  padding: 18px 20px;
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  animation: ${fadeDown} 350ms ease both;
`

const DescriptionLabel = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0 0 8px;
  letter-spacing: 0.2px;
`

const Description = styled.p`
  margin: 0;
  color: ${tk.body};
  font-size: 0.95rem;
  line-height: 1.65;
  white-space: pre-wrap;
  word-wrap: break-word;
`

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const Card = styled.div`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  padding: 18px;
  animation: ${fadeDown} 350ms ease both;
`

const CardLabel = styled.h3`
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  font-weight: 500;
  color: ${tk.muted};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px;
`

const CreatorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${tk.amberLight} 0%, ${tk.blueLight} 100%);
  color: ${tk.blue};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 800;
  flex-shrink: 0;
  overflow: hidden;

  img { width: 100%; height: 100%; object-fit: cover; }
`

const CreatorMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`

const CreatorName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Syne', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${tk.heading};
  line-height: 1.2;
  svg { color: ${tk.blue}; }
`

const CreatorHandle = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: ${tk.muted};
  margin-top: 2px;
`

const StatList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const StatRow = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'DM Mono', monospace;
  font-size: 0.78rem;
  color: ${tk.body};

  svg { color: ${tk.muted}; margin-right: 6px; vertical-align: middle; }

  strong { font-weight: 500; color: ${tk.heading}; }
`

const ShareBtn = styled.button`
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  margin-top: 14px;
  border-radius: 12px;
  border: 1.5px solid ${tk.blue};
  background: ${tk.white};
  color: ${tk.blue};
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms;

  &:hover { background: ${tk.blue}; color: ${tk.white}; transform: translateY(-1px); }
`

// ─── Empty / loading ──────────────────────────────────────────────────────────
const StateCard = styled.div`
  background: ${tk.white};
  border: 1.5px dashed ${tk.border};
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  color: ${tk.muted};
  max-width: 600px;
  margin: 32px auto;

  svg { color: ${tk.blue}; opacity: 0.6; margin-bottom: 12px; }
  h3 {
    font-family: 'Syne', sans-serif;
    color: ${tk.heading};
    font-size: 1.1rem;
    margin: 0 0 6px;
  }
  p { margin: 0; font-size: 0.9rem; }
`

const Skeleton = styled.div`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  height: 420px;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function creatorInfo(ownerRef: unknown): {
  name: string
  initial: string
  avatar: string | null
  username: string | null
  verified: boolean
} {
  if (ownerRef && typeof ownerRef === 'object') {
    const o = ownerRef as { display_name?: string; username?: string; avatar_url?: string | null; verified?: boolean }
    const name = o.display_name || o.username || 'Creator'
    return {
      name,
      initial: name.trim().charAt(0).toUpperCase() || '?',
      avatar: o.avatar_url || null,
      username: o.username || null,
      verified: !!o.verified,
    }
  }
  return { name: 'Creator', initial: '?', avatar: null, username: null, verified: false }
}

function formatDuration(s: number): string {
  if (!s || !Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VideoDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined)
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    ;(async () => {
      try {
        const v = await videoService.get(id)
        if (active) setVideo(v)
      } catch (err: unknown) {
        if (active) toast.error(err instanceof Error ? err.message : 'Could not load video')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  const handleShare = async () => {
    if (!video) return
    const url = `${window.location.origin}/videos/${video._id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <Page>
      <DashboardGlobalStyle />

      <Hero>
        <HeroInner>
          <BackLink href="/videos">
            <ArrowLeft size={12} />
            Back to videos
          </BackLink>
        </HeroInner>
      </Hero>

      <ContentWrap>
        {loading ? (
          <>
            <PlayerCol><Skeleton /></PlayerCol>
            <Sidebar><Skeleton style={{ height: 200 }} /></Sidebar>
          </>
        ) : !video ? (
          <StateCard style={{ gridColumn: '1 / -1' }}>
            <Film size={40} strokeWidth={1.5} />
            <h3>Video not found</h3>
            <p>It may have been removed, or the link is wrong.</p>
          </StateCard>
        ) : (
          <>
            <PlayerCol>
              <PlayerCard>
                <VideoPlayer
                  hlsUrl={video.hls_url}
                  mp4Url={video.mp4_url}
                  thumbnailUrl={video.thumbnail_url}
                  title={video.title}
                />
              </PlayerCard>

              <Title>{video.title}</Title>

              <Row>
                {video.is_veteran_content && (
                  <Pill $tone="veteran">
                    <ShieldCheck size={11} />
                    Veteran
                  </Pill>
                )}
                <Pill $tone="amber">
                  <Sparkles size={11} />
                  Community
                </Pill>
                <Pill>
                  <Clock size={11} />
                  {formatDuration(video.duration_s)}
                </Pill>
                <Pill>
                  <Eye size={11} />
                  {video.view_count.toLocaleString()} views
                </Pill>
                <Pill>
                  <Share2 size={11} />
                  {video.share_count.toLocaleString()} shares
                </Pill>
              </Row>

              {video.description && (
                <DescriptionBlock>
                  <DescriptionLabel>About this video</DescriptionLabel>
                  <Description>{video.description}</Description>
                </DescriptionBlock>
              )}
            </PlayerCol>

            <Sidebar>
              <Card>
                <CardLabel>Creator</CardLabel>
                {(() => {
                  const c = creatorInfo(video.owner_id)
                  return (
                    <CreatorRow>
                      <Avatar>
                        {c.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar} alt="" />
                        ) : c.initial}
                      </Avatar>
                      <CreatorMeta>
                        <CreatorName>
                          {c.name}
                          {c.verified && <BadgeCheck size={14} />}
                        </CreatorName>
                        {c.username && <CreatorHandle>@{c.username}</CreatorHandle>}
                      </CreatorMeta>
                    </CreatorRow>
                  )
                })()}
                <ShareBtn onClick={handleShare}>
                  <Share2 size={14} />
                  Share this video
                </ShareBtn>
              </Card>

              <Card>
                <CardLabel>Details</CardLabel>
                <StatList>
                  <StatRow>
                    <span><Calendar size={13} /> Published</span>
                    <strong>
                      {video.published_at
                        ? new Date(video.published_at).toLocaleDateString()
                        : new Date(video.created_at).toLocaleDateString()}
                    </strong>
                  </StatRow>
                  <StatRow>
                    <span><Clock size={13} /> Duration</span>
                    <strong>{formatDuration(video.duration_s)}</strong>
                  </StatRow>
                  <StatRow>
                    <span><Eye size={13} /> Views</span>
                    <strong>{video.view_count.toLocaleString()}</strong>
                  </StatRow>
                  <StatRow>
                    <span><Share2 size={13} /> Shares</span>
                    <strong>{video.share_count.toLocaleString()}</strong>
                  </StatRow>
                </StatList>
              </Card>
            </Sidebar>
          </>
        )}
      </ContentWrap>
    </Page>
  )
}
