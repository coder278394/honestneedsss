'use client'

/**
 * CommunityHighlights — landing-page section (Phase 4).
 *
 * Shows the three most recent published community posts with real author
 * avatars/names and a CTA into /community. Signed-out visitors see this too;
 * the target page gates posting / liking behind sign-in but is readable
 * publicly.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { ArrowRight, Clock, Heart, MessageCircle, MessageSquare, Sparkles, BadgeCheck } from 'lucide-react'

import { communityService, type CommunityPost, type CommunityAuthor } from '@/services/videoService'
import { tk } from '@/styles/dashboardTokens'

const Section = styled.section`
  padding: 56px 16px;
  background: ${tk.canvas};

  @media (min-width: 768px) { padding: 72px 24px; }
`

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`

const HeadText = styled.div`
  min-width: 0;
  flex: 1 1 320px;
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
  margin: 0 0 12px;
`

const Title = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, ${tk.heading} 0%, ${tk.blue} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
  line-height: 1.2;

  @media (min-width: 768px) { font-size: 2.2rem; }
`

const Sub = styled.p`
  font-size: 0.95rem;
  color: ${tk.muted};
  margin: 0;
  max-width: 60ch;
  line-height: 1.5;
`

const CTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 20px;
  border-radius: 12px;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.2px;
  transition: all 180ms;
  box-shadow: 0 6px 16px rgba(26, 95, 168, 0.18);
  white-space: nowrap;

  &:hover {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.24);
  }
`

const Grid = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 720px) { grid-template-columns: repeat(2, 1fr); }
  @media (min-width: 1024px) { grid-template-columns: repeat(3, 1fr); }
`

const Card = styled(Link)`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  padding: 18px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 220ms;

  &:hover {
    transform: translateY(-3px);
    border-color: ${tk.blue};
    box-shadow: 0 12px 32px rgba(26, 95, 168, 0.1);
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${tk.amberLight} 0%, ${tk.blueLight} 100%);
  color: ${tk.blue};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 800;
  flex-shrink: 0;
  overflow: hidden;

  img { width: 100%; height: 100%; object-fit: cover; }
`

const Who = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`

const Name = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Syne', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  color: ${tk.heading};
  line-height: 1.2;
  svg { color: ${tk.blue}; }
`

const When = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
  margin-top: 2px;
`

const Body = styled.p`
  margin: 0;
  color: ${tk.body};
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Stats = styled.div`
  display: flex;
  gap: 14px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid ${tk.border};
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: ${tk.muted};
`

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

const SkeletonCard = styled.li`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  height: 180px;
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

const EmptyCard = styled.div`
  background: ${tk.white};
  border: 1.5px dashed ${tk.border};
  border-radius: 14px;
  padding: 36px 24px;
  text-align: center;
  color: ${tk.muted};

  svg { color: ${tk.blue}; opacity: 0.6; margin-bottom: 8px; }
  h3 { font-family: 'Syne', sans-serif; color: ${tk.heading}; font-size: 1rem; margin: 0 0 4px; }
  p { margin: 0; font-size: 0.88rem; }
`

function authorInfo(authorIdRef: unknown): {
  name: string
  initial: string
  avatar: string | null
  verified: boolean
} {
  if (authorIdRef && typeof authorIdRef === 'object') {
    const a = authorIdRef as CommunityAuthor
    const name = a.display_name || a.username || 'Anonymous'
    return {
      name,
      initial: name.trim().charAt(0).toUpperCase() || '?',
      avatar: a.avatar_url || null,
      verified: !!a.verified,
    }
  }
  return { name: 'Anonymous', initial: '?', avatar: null, verified: false }
}

function timeAgo(iso: string): string {
  const d = new Date(iso)
  const diffMin = (Date.now() - d.getTime()) / 60000
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${Math.floor(diffMin)}m ago`
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h ago`
  if (diffMin < 60 * 24 * 7) return `${Math.floor(diffMin / (60 * 24))}d ago`
  return d.toLocaleDateString()
}

export default function CommunityHighlights() {
  const [posts, setPosts] = useState<CommunityPost[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await communityService.listFeed({ limit: 3 })
        if (!cancelled) setPosts(res.items)
      } catch {
        if (!cancelled) setPosts([])
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <Section aria-labelledby="community-highlights-title">
      <Inner>
        <Head>
          <HeadText>
            <Eyebrow>
              <Sparkles size={12} />
              Community Feed
            </Eyebrow>
            <Title id="community-highlights-title">Real voices. Real moments.</Title>
            <Sub>
              Updates, wins, and thank-yous from the people building things on HonestNeed.
              Jump into the feed, cheer someone on, or share what&apos;s happening with you.
            </Sub>
          </HeadText>
          <CTA href="/community">
            Open the feed
            <ArrowRight size={16} />
          </CTA>
        </Head>

        {posts === null ? (
          <Grid>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </Grid>
        ) : posts.length === 0 ? (
          <EmptyCard>
            <MessageSquare size={32} strokeWidth={1.5} />
            <h3>The feed is quiet right now</h3>
            <p>Be the first to share something — a sentence is enough.</p>
          </EmptyCard>
        ) : (
          <Grid>
            {posts.map((p) => {
              const a = authorInfo(p.author_id)
              return (
                <li key={p._id}>
                  <Card href="/community">
                    <Header>
                      <Avatar>
                        {a.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.avatar} alt="" />
                        ) : a.initial}
                      </Avatar>
                      <Who>
                        <Name>
                          {a.name}
                          {a.verified && <BadgeCheck size={13} />}
                        </Name>
                        <When>
                          <Clock size={10} />
                          {timeAgo(p.created_at)}
                        </When>
                      </Who>
                    </Header>
                    <Body>{p.body}</Body>
                    <Stats>
                      <Stat><Heart size={11} /> {p.like_count.toLocaleString()}</Stat>
                      <Stat><MessageCircle size={11} /> {p.comment_count.toLocaleString()}</Stat>
                    </Stats>
                  </Card>
                </li>
              )
            })}
          </Grid>
        )}
      </Inner>
    </Section>
  )
}
