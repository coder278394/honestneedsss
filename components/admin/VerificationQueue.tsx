'use client'

/**
 * Admin — identity verification queue.
 *
 * Lists pending submissions and shows Persona context (automated check scores,
 * dashboard link) alongside the manual approve/reject controls that already
 * exist for the legacy upload flow.
 *
 * Dashboard links are fetched on demand (admin-only, backend-audited) and
 * opened in a new tab. The link is treated as short-lived: fetched fresh each
 * time the admin clicks "Open Persona report".
 */

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { apiClient } from '@/lib/api'
import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface QueueItem {
  _id: string
  user_id: string
  status: string
  tier: string
  submitted_at: string
  persona_inquiry_id?: string | null
  persona_report_id?: string | null
  webhook_last_event_at?: string | null
  automated_checks?: {
    face_match_score?: number | null
    liveness_passed?: boolean | null
    duplicate_suspected?: boolean
    provider?: string
  } | null
}

interface QueueResponse {
  success: boolean
  items: QueueItem[]
  total: number
  page: number
  limit: number
}

export default function VerificationQueue() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<QueueResponse>('/api/verification/admin/queue')
      setItems(res.data.items || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load queue'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function openPersonaReport(submissionId: string) {
    try {
      const res = await apiClient.get<{ data: { dashboard_url: string } }>(
        `/api/verification/admin/${encodeURIComponent(submissionId)}/persona-report`
      )
      const url = res.data.data.dashboard_url
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not open Persona report'
      toast.error(message)
    }
  }

  async function act(submissionId: string, decision: 'approve' | 'reject') {
    setWorking(submissionId)
    try {
      const body: Record<string, string> = { decision }
      if (decision === 'reject') {
        const reason = window.prompt('Rejection reason (shown to user):')
        if (!reason) {
          setWorking(null)
          return
        }
        body.rejection_reason = reason
      }
      await apiClient.post(`/api/verification/admin/${encodeURIComponent(submissionId)}/review`, body)
      toast.success(`Submission ${decision}d`)
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Review failed'
      toast.error(message)
    } finally {
      setWorking(null)
    }
  }

  return (
    <section aria-labelledby="verification-queue-heading">
      <h2 id="verification-queue-heading" style={{ marginBottom: 12 }}>
        Identity verification queue
      </h2>
      {loading && <LoadingSpinner />}
      {!loading && items.length === 0 && (
        <p style={{ color: '#6b7280' }}>No pending submissions.</p>
      )}
      {!loading &&
        items.map((item) => {
          const persona = item.automated_checks?.provider === 'persona'
          return (
            <article
              key={item._id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                background: '#fff',
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong>User: {item.user_id}</strong>
                <span style={{ color: '#6b7280', fontSize: 12 }}>
                  {new Date(item.submitted_at).toLocaleString()} · {item.tier}
                </span>
              </header>

              <div style={{ marginTop: 8, fontSize: 14 }}>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', marginRight: 8 }}>
                  status: {item.status}
                </span>
                {persona && (
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: '#eff6ff', color: '#1e40af' }}>
                    via Persona
                  </span>
                )}
              </div>

              {item.automated_checks && (
                <dl style={{ marginTop: 10, fontSize: 13, color: '#374151' }}>
                  <div>
                    <dt style={{ display: 'inline', fontWeight: 600 }}>Face match: </dt>
                    <dd style={{ display: 'inline' }}>{item.automated_checks.face_match_score ?? '—'}</dd>
                  </div>
                  <div>
                    <dt style={{ display: 'inline', fontWeight: 600 }}>Liveness: </dt>
                    <dd style={{ display: 'inline' }}>
                      {item.automated_checks.liveness_passed === null || item.automated_checks.liveness_passed === undefined
                        ? '—'
                        : item.automated_checks.liveness_passed
                          ? 'pass'
                          : 'fail'}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ display: 'inline', fontWeight: 600 }}>Duplicate suspected: </dt>
                    <dd style={{ display: 'inline' }}>{item.automated_checks.duplicate_suspected ? 'yes' : 'no'}</dd>
                  </div>
                </dl>
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {persona && (
                  <Button variant="secondary" onClick={() => openPersonaReport(item._id)}>
                    Open Persona report
                  </Button>
                )}
                <Button
                  onClick={() => act(item._id, 'approve')}
                  disabled={working === item._id || item.status !== 'pending'}
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => act(item._id, 'reject')}
                  disabled={working === item._id || item.status !== 'pending'}
                >
                  Reject
                </Button>
              </div>
            </article>
          )
        })}
    </section>
  )
}
