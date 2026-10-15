'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PageContainer } from '@/components/PageContainer'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import VideoPlayer from '@/components/videos/VideoPlayer'
import { videoService, type Video } from '@/services/videoService'

function Inner() {
  const [items, setItems] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await videoService.listPending()
      setItems(res.items || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load queue'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (v: Video, decision: 'approve' | 'reject') => {
    let reason: string | null = null
    if (decision === 'reject') {
      reason = window.prompt('Rejection reason (shown to creator):')
      if (reason === null) return
    }
    setWorking(v._id)
    try {
      await videoService.moderate(v._id, decision, reason || undefined)
      toast.success(decision === 'approve' ? 'Published' : 'Rejected')
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed'
      toast.error(message)
    } finally {
      setWorking(null)
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Video moderation" description="Pending videos awaiting review." />
      {loading && <LoadingSpinner />}
      {!loading && items.length === 0 && (
        <p style={{ color: '#6b7280' }}>Nothing in the queue.</p>
      )}
      {!loading &&
        items.map((v) => (
          <article
            key={v._id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              background: '#fff',
            }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>{v.title}</strong>
              <span style={{ color: '#6b7280', fontSize: 12 }}>
                {new Date(v.created_at).toLocaleString()}
              </span>
            </header>
            <div style={{ fontSize: 13, color: '#6b7280', margin: '6px 0' }}>
              status: {v.status} · duration: {v.duration_s}s
              {v.is_veteran_content && (
                <span style={{ marginLeft: 8, padding: '2px 6px', background: '#1e40af', color: '#fff', borderRadius: 4, fontSize: 11 }}>
                  Veteran
                </span>
              )}
            </div>
            <VideoPlayer
              hlsUrl={v.hls_url}
              mp4Url={v.mp4_url}
              thumbnailUrl={v.thumbnail_url}
              title={v.title}
              height={320}
            />
            {v.description && (
              <p style={{ marginTop: 10, color: '#111827', whiteSpace: 'pre-wrap' }}>{v.description}</p>
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button onClick={() => act(v, 'approve')} disabled={working === v._id}>
                Approve
              </Button>
              <Button variant="secondary" onClick={() => act(v, 'reject')} disabled={working === v._id}>
                Reject
              </Button>
            </div>
          </article>
        ))}
    </PageContainer>
  )
}

export default function VideoModerationPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Inner />
    </ProtectedRoute>
  )
}
