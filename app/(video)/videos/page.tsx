'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import { Sparkles, Film, Clock, Play, Upload, ShieldCheck, Share2, Eye } from 'lucide-react'

import { videoService, type Video } from '@/services/videoService'
import { tk, DashboardGlobalStyle, fadeDown } from '@/styles/dashboardTokens'

// ─── Page shell ───────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${tk.canvas};
  font-family: 'DM Sans', sans-serif;
  color: ${tk.body};
`

// ─── Hero header ──────────────────────────────────────────────────────────────
const Hero = styled.header`
  background: ${tk.canvas};
  border-bottom: 2px solid ${tk.blue};
  padding: 24px 16px 20px;

  @media (min-width: 640px) { padding: 32px 24px 24px; }
  @media (min-width: 1024px) { padding: 40px 32px 28px; }
`

const HeroInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeDown} 400ms ease both;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
  justify-content: space-between;
`

const HeroText = styled.div`
  min-width: 0;
  flex: 1 1 320px;
`

const HeroEyebrow = styled.p`
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

const HeroTitle = styled.h1`
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
  @media (min-width: 1024px) { font-size: 2.4rem; }
`

const HeroSub = styled.p`
  font-size: 0.9rem;
  color: ${tk.muted};
  margin: 0;
  font-weight: 400;
  line-height: 1.5;
  max-width: 56ch;

  @media (min-width: 640px) { font-size: 1rem; }
`

const UploadCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  border-radius: 12px;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.2px;
  transition: all 180ms;
  box-shadow: 0 6px 16px rgba(26, 95, 168, 0.18);

  &:hover {
    background: #0D4A8C;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.24);
  }
`

// ─── Content area ─────────────────────────────────────────────────────────────
const ContentWrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 12px 48px;

  @media (min-width: 640px) { padding: 24px 20px 56px; }
  @media (min-width: 1024px) { padding: 32px 32px 64px; }
`

// ─── Results bar ──────────────────────────────────────────────────────────────
const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;
  flex-wrap: wrap;
`

const ResultsCount = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  color: ${tk.muted};
  margin: 0;
  font-weight: 400;

  strong { color: ${tk.heading}; font-weight: 500; }
`

// ─── Grid ─────────────────────────────────────────────────────────────────────
const Grid = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); gap: 18px; }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); gap: 22px; }
`

const Card = styled.li`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  animation: ${fadeDown} 350ms ease both;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(26, 95, 168, 0.12);
    border-color: ${tk.blue};
  }
`

const CardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  height: 100%;
`

const ThumbWrap = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, ${tk.amberLight} 0%, ${tk.blueLight} 100%);
  overflow: hidden;
`

const Thumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const ThumbFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${tk.blue};
  opacity: 0.4;
`

const PlayOverlay = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%);
  opacity: 0;
  transition: opacity 220ms ease;

  ${Card}:hover & { opacity: 1; }

  svg {
    color: ${tk.white};
    filter: drop-shadow(0 2px 10px rgba(0,0,0,0.4));
  }
`

const DurationBadge = styled.span`
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: rgba(24, 23, 26, 0.78);
  color: ${tk.white};
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  border-radius: 6px;
  backdrop-filter: blur(4px);
`

const VeteranBadge = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-radius: 6px;
`

const CardBody = styled.div`
  padding: 14px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`

const Title = styled.h3`
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Creator = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: ${tk.muted};
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const Description = styled.p`
  font-size: 0.85rem;
  color: ${tk.body};
  margin: 0;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid ${tk.border};
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: ${tk.muted};
`

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

// ─── Empty & loading states ───────────────────────────────────────────────────
const EmptyState = styled.div`
  background: ${tk.white};
  border: 1.5px dashed ${tk.border};
  border-radius: 14px;
  padding: 48px 24px;
  text-align: center;
  color: ${tk.muted};

  svg { color: ${tk.blue}; opacity: 0.6; margin-bottom: 12px; }
  h3 {
    font-family: 'Syne', sans-serif;
    color: ${tk.heading};
    font-size: 1.1rem;
    margin: 0 0 6px;
  }
  p { margin: 0; font-size: 0.9rem; }
`

const SkeletonGrid = styled(Grid)`
  pointer-events: none;
`

const Skeleton = styled.li`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  height: 300px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(26,95,168,0.08), transparent);
    animation: shimmer 1.4s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`

const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
`

const LoadMoreBtn = styled.button`
  min-width: 160px;
  height: 42px;
  padding: 0 22px;
  border-radius: 12px;
  border: 1.5px solid ${tk.blue};
  background: ${tk.white};
  color: ${tk.blue};
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms;

  &:hover:not(:disabled) {
    background: ${tk.blue};
    color: ${tk.white};
    transform: translateY(-1px);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(s: number): string {
  if (!s || !Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function creatorName(v: Video): string {
  if (typeof v.owner_id === 'object' && v.owner_id) {
    return v.owner_id.display_name || v.owner_id.username || 'Creator'
  }
  return 'Creator'
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VideoFeedPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [done, setDone] = useState(false)

  const load = useCallback(async (nextCursor: string | null = null) => {
    setLoading(true)
    try {
      const res = await videoService.list({ cursor: nextCursor || undefined, limit: 20 })
      setVideos((prev) => (nextCursor ? [...prev, ...res.items] : res.items))
      setCursor(res.next_cursor)
      setDone(!res.next_cursor)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load videos'
      toast.error(message)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  useEffect(() => {
    void load(null)
  }, [load])

  return (
    <Page>
      <DashboardGlobalStyle />

      {/* Hero */}
      <Hero>
        <HeroInner>
          <HeroText>
            <HeroEyebrow>
              <Sparkles size={12} />
              Community Stories
            </HeroEyebrow>
            <HeroTitle>Watch stories worth sharing</HeroTitle>
            <HeroSub>
              Real moments from creators, veterans, and the people they&apos;re lifting up.
              Watch, share, and earn rewards for helping these stories travel.
            </HeroSub>
          </HeroText>
          <UploadCta href="/videos/upload">
            <Upload size={16} />
            Upload a video
          </UploadCta>
        </HeroInner>
      </Hero>

      {/* Content */}
      <ContentWrap>
        <ResultsBar>
          <ResultsCount>
            {initialLoad
              ? 'Loading videos…'
              : videos.length > 0
                ? <><strong>{videos.length}</strong> {videos.length === 1 ? 'video' : 'videos'} loaded</>
                : 'No videos yet'}
          </ResultsCount>
        </ResultsBar>

        {initialLoad ? (
          <SkeletonGrid>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </SkeletonGrid>
        ) : videos.length === 0 ? (
          <EmptyState>
            <Film size={40} strokeWidth={1.5} />
            <h3>No videos yet</h3>
            <p>Be the first to share a story with the community.</p>
          </EmptyState>
        ) : (
          <Grid>
            {videos.map((v) => (
              <Card key={v._id}>
                <CardLink href={`/videos/${v._id}`}>
                  <ThumbWrap>
                    {v.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <Thumb src={v.thumbnail_url} alt="" />
                    ) : (
                      <ThumbFallback><Film size={48} strokeWidth={1.3} /></ThumbFallback>
                    )}
                    <PlayOverlay><Play size={44} fill="currentColor" /></PlayOverlay>
                    {v.is_veteran_content && (
                      <VeteranBadge>
                        <ShieldCheck size={10} />
                        Veteran
                      </VeteranBadge>
                    )}
                    <DurationBadge>
                      <Clock size={10} />
                      {formatDuration(v.duration_s)}
                    </DurationBadge>
                  </ThumbWrap>

                  <CardBody>
                    <Creator>{creatorName(v)}</Creator>
                    <Title>{v.title}</Title>
                    {v.description && <Description>{v.description}</Description>}
                    <MetaRow>
                      <MetaItem><Eye size={11} /> {v.view_count.toLocaleString()}</MetaItem>
                      <MetaItem><Share2 size={11} /> {v.share_count.toLocaleString()}</MetaItem>
                    </MetaRow>
                  </CardBody>
                </CardLink>
              </Card>
            ))}
          </Grid>
        )}

        {!done && !initialLoad && videos.length > 0 && (
          <LoadMoreWrap>
            <LoadMoreBtn disabled={loading} onClick={() => load(cursor)}>
              {loading ? 'Loading…' : 'Load more'}
            </LoadMoreBtn>
          </LoadMoreWrap>
        )}
      </ContentWrap>
    </Page>
  )
}
