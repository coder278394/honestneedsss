'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { toast } from 'react-toastify'
import {
  Sparkles,
  Send,
  MessageSquare,
  Heart,
  MessageCircle,
  Clock,
  BadgeCheck,
  Trash2,
} from 'lucide-react'

import {
  communityService,
  type CommunityPost,
  type CommunityComment,
  type CommunityAuthor,
} from '@/services/videoService'
import { useIsAuthenticated, useAuthUserId } from '@/store/authStore'
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
  padding: 24px 16px 20px;

  @media (min-width: 640px) { padding: 32px 24px 24px; }
  @media (min-width: 1024px) { padding: 40px 32px 28px; }
`

const HeroInner = styled.div`
  max-width: 820px;
  margin: 0 auto;
  animation: ${fadeDown} 400ms ease both;
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
  max-width: 60ch;

  @media (min-width: 640px) { font-size: 1rem; }
`

const ContentWrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 20px 12px 48px;

  @media (min-width: 640px) { padding: 24px 20px 56px; }
  @media (min-width: 1024px) { padding: 32px 32px 64px; }
`

// ─── Composer ─────────────────────────────────────────────────────────────────
const Composer = styled.div`
  background: ${tk.white};
  border: 1.5px solid ${tk.border};
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
  transition: border-color 180ms;
  animation: ${fadeDown} 350ms ease both;

  &:focus-within { border-color: ${tk.blue}; box-shadow: 0 0 0 4px ${tk.blueLight}; }
`

const ComposerLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${tk.heading};
  margin-bottom: 8px;
`

const Textarea = styled.textarea`
  width: 100%;
  min-height: 90px;
  padding: 10px 12px;
  border: 1px solid ${tk.border};
  border-radius: 10px;
  background: ${tk.canvas};
  color: ${tk.body};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 180ms;

  &::placeholder { color: ${tk.muted}; }
  &:focus { outline: none; border-color: ${tk.blue}; background: ${tk.white}; }
`

const ComposerFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
`

const CharCount = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
`

const PostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 18px;
  border-radius: 10px;
  border: none;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(26, 95, 168, 0.18);
  transition: all 180ms;

  &:hover:not(:disabled) {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(26, 95, 168, 0.24);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`

const SignInNudge = styled.div`
  background: ${tk.blueLight};
  border: 1.5px dashed ${tk.blue};
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${tk.body};
  font-size: 0.9rem;

  svg { color: ${tk.blue}; flex-shrink: 0; }
  strong { color: ${tk.heading}; font-family: 'Syne', sans-serif; }
`

const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
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

// ─── Post ─────────────────────────────────────────────────────────────────────
const Feed = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 14px;
`

const PostCard = styled.li`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  padding: 16px 18px;
  transition: border-color 220ms ease, box-shadow 220ms ease;
  animation: ${fadeDown} 350ms ease both;

  &:hover {
    box-shadow: 0 12px 32px rgba(26, 95, 168, 0.08);
    border-color: ${tk.blue};
  }
`

const PostHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`

const Avatar = styled.div<{ $small?: boolean }>`
  width: ${(p) => (p.$small ? 28 : 36)}px;
  height: ${(p) => (p.$small ? 28 : 36)}px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${tk.amberLight} 0%, ${tk.blueLight} 100%);
  color: ${tk.blue};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Syne', sans-serif;
  font-size: ${(p) => (p.$small ? 0.75 : 0.9)}rem;
  font-weight: 800;
  flex-shrink: 0;
  overflow: hidden;

  img { width: 100%; height: 100%; object-fit: cover; }
`

const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`

const Author = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${tk.heading};
  line-height: 1.2;

  svg { color: ${tk.blue}; }
`

const Handle = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
  font-weight: 400;
`

const PostTime = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
  margin-top: 2px;
`

const PostBody = styled.p`
  margin: 0;
  color: ${tk.body};
  font-size: 0.95rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-wrap: break-word;
`

const Actions = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid ${tk.border};
`

const ActionBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: ${(p) => (p.$active ? tk.blue : tk.muted)};
  font-family: 'DM Mono', monospace;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms;

  svg {
    transition: transform 150ms, fill 150ms;
    ${(p) => p.$active && css`fill: currentColor;`}
  }

  &:hover:not(:disabled) {
    background: ${tk.blueLight};
    color: ${tk.blue};
    svg { transform: scale(1.12); }
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const LikedBtn = styled(ActionBtn)<{ $liked: boolean }>`
  color: ${(p) => (p.$liked ? '#D4387C' : tk.muted)};
  svg {
    ${(p) => p.$liked && css`fill: currentColor;`}
  }
  &:hover:not(:disabled) {
    background: ${(p) => (p.$liked ? '#FCE4EC' : tk.blueLight)};
    color: ${(p) => (p.$liked ? '#D4387C' : tk.blue)};
  }
`

// ─── Comments section ───────────────────────────────────────────────────────
const CommentsSection = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${tk.border};
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CommentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const CommentItem = styled.li`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`

const CommentBubble = styled.div`
  background: ${tk.canvas};
  border: 1px solid ${tk.border};
  border-radius: 12px;
  padding: 8px 12px;
  flex: 1;
  min-width: 0;
`

const CommentAuthor = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
`

const CommentName = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: 'Syne', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${tk.heading};
  svg { color: ${tk.blue}; }
`

const CommentTime = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  color: ${tk.muted};
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

const CommentBody = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${tk.body};
  line-height: 1.45;
  white-space: pre-wrap;
  word-wrap: break-word;
`

const CommentDeleteBtn = styled.button`
  background: transparent;
  border: none;
  color: ${tk.muted};
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;

  &:hover { color: #B5341E; background: #FBE8DC; }
`

const CommentComposer = styled.form`
  display: flex;
  gap: 8px;
  align-items: center;
`

const CommentInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  border: 1px solid ${tk.border};
  border-radius: 999px;
  background: ${tk.canvas};
  color: ${tk.body};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  transition: border-color 180ms;

  &:focus { outline: none; border-color: ${tk.blue}; background: ${tk.white}; }
  &::placeholder { color: ${tk.muted}; }
`

const CommentSendBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${tk.blue};
  color: ${tk.white};
  cursor: pointer;
  flex-shrink: 0;
  transition: all 150ms;

  &:hover:not(:disabled) { background: #0d4a8c; transform: scale(1.05); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const CommentsEmpty = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
  text-align: center;
  margin: 0;
  padding: 4px 0;
`

const CommentsLoading = styled(CommentsEmpty)``

// ─── Empty / skeleton / load more ─────────────────────────────────────────────
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

const SkeletonFeed = styled(Feed)`
  pointer-events: none;
`

const SkeletonPost = styled.li`
  background: ${tk.white};
  border: 1px solid ${tk.border};
  border-radius: 14px;
  height: 120px;
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

const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
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

  &:hover:not(:disabled) { background: ${tk.blue}; color: ${tk.white}; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const MAX_BODY = 5000
const MAX_COMMENT = 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────
function authorInfo(authorIdRef: unknown): {
  id: string | null
  name: string
  initial: string
  avatar: string | null
  username: string | null
  verified: boolean
} {
  if (authorIdRef && typeof authorIdRef === 'object') {
    const a = authorIdRef as CommunityAuthor
    const name = a.display_name || a.username || 'Anonymous'
    return {
      id: a._id || null,
      name,
      initial: name.trim().charAt(0).toUpperCase() || '?',
      avatar: a.avatar_url || null,
      username: a.username || null,
      verified: !!a.verified,
    }
  }
  return { id: null, name: 'Anonymous', initial: '?', avatar: null, username: null, verified: false }
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

// ─── Comment thread (one per post, lazy-loaded on expand) ─────────────────────
interface CommentThreadProps {
  postId: string
  authed: boolean
  viewerId: string | null
  onCountChange: (delta: number) => void
}

function CommentThread({ postId, authed, viewerId, onCountChange }: CommentThreadProps) {
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await communityService.listComments(postId, { limit: 30 })
        if (!cancelled) setComments(res.items)
      } catch (err: unknown) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Could not load comments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [postId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || posting) return
    setPosting(true)
    try {
      const created = await communityService.createComment(postId, body.trim())
      setComments((prev) => [...prev, created])
      setBody('')
      onCountChange(+1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not post comment')
    } finally {
      setPosting(false)
    }
  }

  const del = async (c: CommunityComment) => {
    if (!confirm('Delete this comment?')) return
    try {
      await communityService.deleteComment(c._id)
      setComments((prev) => prev.filter((x) => x._id !== c._id))
      onCountChange(-1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not delete comment')
    }
  }

  return (
    <CommentsSection>
      {loading ? (
        <CommentsLoading>Loading comments…</CommentsLoading>
      ) : comments.length === 0 ? (
        <CommentsEmpty>No comments yet. Be the first to reply.</CommentsEmpty>
      ) : (
        <CommentList>
          {comments.map((c) => {
            const a = authorInfo(c.author_id)
            const isMine = !!(viewerId && a.id && a.id === viewerId)
            return (
              <CommentItem key={c._id}>
                <Avatar $small>
                  {a.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.avatar} alt="" />
                  ) : a.initial}
                </Avatar>
                <CommentBubble>
                  <CommentAuthor>
                    <CommentName>
                      {a.name}
                      {a.verified && <BadgeCheck size={11} />}
                    </CommentName>
                    <CommentTime>
                      <Clock size={9} />
                      {timeAgo(c.created_at)}
                      {isMine && (
                        <CommentDeleteBtn
                          type="button"
                          onClick={() => del(c)}
                          aria-label="Delete comment"
                        >
                          <Trash2 size={11} />
                        </CommentDeleteBtn>
                      )}
                    </CommentTime>
                  </CommentAuthor>
                  <CommentBody>{c.body}</CommentBody>
                </CommentBubble>
              </CommentItem>
            )
          })}
        </CommentList>
      )}

      {authed ? (
        <CommentComposer onSubmit={submit}>
          <CommentInput
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_COMMENT))}
            placeholder="Write a reply…"
            disabled={posting}
            maxLength={MAX_COMMENT}
          />
          <CommentSendBtn type="submit" disabled={!body.trim() || posting} aria-label="Send reply">
            <Send size={14} />
          </CommentSendBtn>
        </CommentComposer>
      ) : (
        <CommentsEmpty>Sign in to reply.</CommentsEmpty>
      )}
    </CommentsSection>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CommunityFeedPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [done, setDone] = useState(false)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [likePending, setLikePending] = useState<Set<string>>(new Set())
  const authed = useIsAuthenticated()
  const viewerId = useAuthUserId()

  const load = useCallback(async (nextCursor: string | null = null) => {
    setLoading(true)
    try {
      const res = await communityService.listFeed({ cursor: nextCursor || undefined, limit: 20 })
      setPosts((prev) => (nextCursor ? [...prev, ...res.items] : res.items))
      setCursor(res.next_cursor)
      setDone(!res.next_cursor)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not load feed')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  useEffect(() => { void load(null) }, [load])

  const onPost = async () => {
    if (!body.trim()) return
    setPosting(true)
    try {
      const post = await communityService.createPost(body.trim())
      setPosts((p) => [post, ...p])
      setBody('')
      toast.success('Posted.')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not post')
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (p: CommunityPost) => {
    if (!authed) { toast.info('Sign in to like posts.'); return }
    if (likePending.has(p._id)) return

    // Optimistic update
    const wasLiked = !!p.liked_by_viewer
    setPosts((prev) =>
      prev.map((x) =>
        x._id === p._id
          ? { ...x, liked_by_viewer: !wasLiked, like_count: Math.max(0, x.like_count + (wasLiked ? -1 : 1)) }
          : x
      )
    )
    setLikePending((s) => new Set(s).add(p._id))

    try {
      const res = await communityService.toggleLike(p._id)
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p._id ? { ...x, liked_by_viewer: res.liked, like_count: res.like_count } : x
        )
      )
    } catch (err: unknown) {
      // Rollback
      setPosts((prev) =>
        prev.map((x) =>
          x._id === p._id
            ? { ...x, liked_by_viewer: wasLiked, like_count: Math.max(0, x.like_count + (wasLiked ? 1 : -1)) }
            : x
        )
      )
      toast.error(err instanceof Error ? err.message : 'Could not update like')
    } finally {
      setLikePending((s) => {
        const n = new Set(s)
        n.delete(p._id)
        return n
      })
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const canPost = useMemo(() => authed && body.trim().length > 0 && !posting, [authed, body, posting])

  return (
    <Page>
      <DashboardGlobalStyle />

      <Hero>
        <HeroInner>
          <HeroEyebrow>
            <Sparkles size={12} />
            Community Feed
          </HeroEyebrow>
          <HeroTitle>Short updates. Real voices.</HeroTitle>
          <HeroSub>
            Posts, moments, and progress from the HonestNeed community. Share what&apos;s
            happening, cheer each other on, keep the loop honest.
          </HeroSub>
        </HeroInner>
      </Hero>

      <ContentWrap>
        {authed ? (
          <Composer>
            <ComposerLabel htmlFor="community-composer">
              <Send size={14} />
              Share an update
            </ComposerLabel>
            <Textarea
              id="community-composer"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
              maxLength={MAX_BODY}
              rows={3}
              placeholder="What's happening? Share progress, a win, or a thank-you."
            />
            <ComposerFoot>
              <CharCount>{body.length} / {MAX_BODY}</CharCount>
              <PostBtn onClick={onPost} disabled={!canPost}>
                <Send size={14} />
                {posting ? 'Posting…' : 'Post'}
              </PostBtn>
            </ComposerFoot>
          </Composer>
        ) : (
          <SignInNudge>
            <MessageSquare size={22} />
            <div>
              <strong>Sign in to post, like, and reply.</strong> You can still read the feed as a guest.
            </div>
          </SignInNudge>
        )}

        <ResultsBar>
          <ResultsCount>
            {initialLoad
              ? 'Loading posts…'
              : posts.length > 0
                ? <><strong>{posts.length}</strong> {posts.length === 1 ? 'post' : 'posts'} loaded</>
                : 'No posts yet'}
          </ResultsCount>
        </ResultsBar>

        {initialLoad ? (
          <SkeletonFeed>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonPost key={i} />)}
          </SkeletonFeed>
        ) : posts.length === 0 ? (
          <EmptyState>
            <MessageSquare size={40} strokeWidth={1.5} />
            <h3>The feed is quiet</h3>
            <p>Be the first to post. A sentence is enough.</p>
          </EmptyState>
        ) : (
          <Feed>
            {posts.map((p) => {
              const a = authorInfo(p.author_id)
              const isExpanded = expanded.has(p._id)
              return (
                <PostCard key={p._id}>
                  <PostHeader>
                    <Avatar>
                      {a.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.avatar} alt="" />
                      ) : a.initial}
                    </Avatar>
                    <AuthorMeta>
                      <Author>
                        {a.name}
                        {a.verified && <BadgeCheck size={14} aria-label="Verified" />}
                        {a.username && <Handle>@{a.username}</Handle>}
                      </Author>
                      <PostTime>
                        <Clock size={10} />
                        {timeAgo(p.created_at)}
                      </PostTime>
                    </AuthorMeta>
                  </PostHeader>

                  <PostBody>{p.body}</PostBody>

                  <Actions>
                    <LikedBtn
                      $liked={!!p.liked_by_viewer}
                      onClick={() => toggleLike(p)}
                      disabled={likePending.has(p._id)}
                      aria-pressed={!!p.liked_by_viewer}
                      aria-label={p.liked_by_viewer ? 'Unlike' : 'Like'}
                    >
                      <Heart size={14} />
                      {p.like_count.toLocaleString()}
                    </LikedBtn>
                    <ActionBtn
                      $active={isExpanded}
                      onClick={() => toggleExpand(p._id)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Hide comments' : 'Show comments'}
                    >
                      <MessageCircle size={14} />
                      {p.comment_count.toLocaleString()}
                    </ActionBtn>
                  </Actions>

                  {isExpanded && (
                    <CommentThread
                      postId={p._id}
                      authed={authed}
                      viewerId={viewerId || null}
                      onCountChange={(delta) =>
                        setPosts((prev) =>
                          prev.map((x) =>
                            x._id === p._id
                              ? { ...x, comment_count: Math.max(0, x.comment_count + delta) }
                              : x
                          )
                        )
                      }
                    />
                  )}
                </PostCard>
              )
            })}
          </Feed>
        )}

        {!done && !initialLoad && posts.length > 0 && (
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
