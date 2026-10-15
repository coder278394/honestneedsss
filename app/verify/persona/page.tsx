'use client'

/**
 * /verify/persona — hosted Persona inquiry entry point.
 *
 * Behaviour:
 *   1. On mount, fetch the user's current Persona inquiry state. If a terminal
 *      status exists, render it directly.
 *   2. "Start verification" calls POST /verification/persona/start, lazy-loads
 *      the Persona SDK (persona), and opens the hosted flow.
 *   3. On the client's `onComplete` callback, start polling /persona/me every
 *      3 s (capped at 60s) until a terminal status appears OR the user leaves.
 *
 * Security notes:
 *   - The session_token is never persisted. If the user reloads, they call
 *     /start again — the backend returns the same inquiry_id if still open.
 *   - The Persona SDK is loaded via dynamic import so the main bundle doesn't
 *     carry its weight for users who never verify.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PageContainer } from '@/components/PageContainer'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Button } from '@/components/Button'
import {
  getMyPersonaInquiry,
  startPersonaInquiry,
  TERMINAL_STATUSES,
  type MyInquiryResponse,
  type PersonaInquiryStatus,
} from '@/services/personaService'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 60_000

function statusLabel(status: PersonaInquiryStatus | null): string {
  if (!status) return 'Not started'
  const map: Record<string, string> = {
    created: 'Starting…',
    pending: 'Awaiting completion',
    completed: 'Processing',
    approved: 'Verified',
    declined: 'Declined',
    rejected: 'Rejected',
    expired: 'Expired',
    needs_review: 'Under review',
    needs_more_info: 'Needs more info',
  }
  return map[status] || status
}

function PersonaInner() {
  const [inquiry, setInquiry] = useState<MyInquiryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollDeadlineRef = useRef<number>(0)

  const refresh = useCallback(async () => {
    try {
      const next = await getMyPersonaInquiry()
      setInquiry(next)
      return next
    } catch (err) {
      // Non-fatal — the UI shows "Not started" and the user can retry.
      console.warn('Persona refresh failed', err)
      return null
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS
    pollTimerRef.current = setInterval(async () => {
      const next = await refresh()
      if (next && TERMINAL_STATUSES.includes(next.status)) stopPolling()
      if (Date.now() > pollDeadlineRef.current) stopPolling()
    }, POLL_INTERVAL_MS)
  }, [refresh, stopPolling])

  useEffect(() => {
    void (async () => {
      await refresh()
      setLoading(false)
    })()
    return () => stopPolling()
  }, [refresh, stopPolling])

  const onStart = useCallback(async () => {
    setStarting(true)
    try {
      const started = await startPersonaInquiry()
      // Dynamic import keeps the SDK out of the main bundle.
      let PersonaCtor: unknown = null
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod: any = await import('persona').catch(() => null)
        PersonaCtor = mod && mod.Client ? mod.Client : null
      } catch {
        PersonaCtor = null
      }

      if (!PersonaCtor) {
        // SDK not installed yet — show a graceful fallback that opens the
        // hosted inquiry URL in a new tab, using the inquiry id.
        toast.info('Opening Persona in a new tab…')
        const base = process.env.NEXT_PUBLIC_PERSONA_HOSTED_URL || 'https://withpersona.com'
        const url = `${base}/verify?inquiry-id=${encodeURIComponent(started.inquiry_id)}`
        window.open(url, '_blank', 'noopener,noreferrer')
        startPolling()
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ClientCtor = PersonaCtor as any
      const client = new ClientCtor({
        inquiryId: started.inquiry_id,
        sessionToken: started.session_token || undefined,
        environment: process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT || 'sandbox',
        onReady: () => client.open(),
        onComplete: () => {
          toast.success('Verification submitted — processing…')
          startPolling()
        },
        onCancel: () => toast.info('Verification cancelled'),
        onError: (err: { code?: string; message?: string }) => {
          toast.error(err?.message || 'Persona could not start')
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start verification'
      toast.error(message)
    } finally {
      setStarting(false)
    }
  }, [startPolling])

  const status = inquiry?.status || null
  const terminal = status ? TERMINAL_STATUSES.includes(status) : false

  return (
    <PageContainer>
      <div
        role="region"
        aria-labelledby="persona-title"
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 10,
          padding: 24,
          maxWidth: 560,
          margin: '32px auto',
        }}
      >
        <h1 id="persona-title" style={{ marginTop: 0 }}>
          Verify your identity
        </h1>
        <p style={{ color: '#374151' }}>
          Identity verification is powered by Persona. You will be asked to take a short selfie and
          upload a government-issued ID. Your documents are stored encrypted and used only to confirm
          your identity.
        </p>

        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 6,
            background: '#f3f4f6',
            fontSize: 14,
          }}
        >
          <strong>Current status: </strong>
          {loading ? <LoadingSpinner /> : statusLabel(status)}
        </div>

        {!terminal && (
          <div style={{ marginTop: 20 }}>
            <Button onClick={onStart} disabled={starting || loading}>
              {starting ? 'Starting…' : status ? 'Resume verification' : 'Start verification'}
            </Button>
          </div>
        )}

        {status === 'approved' && (
          <p style={{ color: '#065f46', marginTop: 16 }}>
            You are verified. Thank you.
          </p>
        )}
        {(status === 'declined' || status === 'rejected') && (
          <p style={{ color: '#b91c1c', marginTop: 16 }}>
            Your verification could not be completed. If you believe this is a mistake, please contact
            support.
          </p>
        )}
      </div>
    </PageContainer>
  )
}

export default function VerifyPersonaPage() {
  return (
    <ProtectedRoute>
      <PersonaInner />
    </ProtectedRoute>
  )
}
