'use client'

/**
 * /support — the user's own support tickets.
 */

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supportService, type Ticket } from '@/services/supportService'
import { getApiErrorMessage } from '@/lib/api'

export default function SupportIndexPage() {
  const [rows, setRows] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await supportService.listMine())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load tickets.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <main style={pad}>
      <h1 style={{ fontSize: 32 }}>Support</h1>
      <p style={{ color: '#4A4750' }}>Have an issue? Open a ticket and a teammate will reply.</p>
      <Link href="/support/new" style={btnPrimary}>
        New ticket
      </Link>

      {error && <div style={errorStyle}>{error}</div>}
      {loading ? (
        <div style={{ opacity: 0.7, marginTop: 16 }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={emptyStyle}>No tickets yet.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
          {rows.map((t) => (
            <li key={t._id} style={rowStyle}>
              <Link href={`/support/${t._id}`} style={{ color: '#18171A', textDecoration: 'none', flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{t.subject}</div>
                <div style={{ fontSize: 12, color: '#8C8790' }}>
                  {t.category} · opened {new Date(t.created_at).toLocaleDateString()}
                </div>
              </Link>
              <StatusBadge status={t.status} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const map: Record<Ticket['status'], { bg: string; fg: string; label: string }> = {
    open: { bg: '#FFF4D6', fg: '#8A5A00', label: 'Open' },
    pending: { bg: '#E6F0FA', fg: '#1C4A80', label: 'Waiting on you' },
    resolved: { bg: '#E8F5EC', fg: '#1E6B33', label: 'Resolved' },
    closed: { bg: '#EEEBE5', fg: '#4A4750', label: 'Closed' },
  }
  const s = map[status]
  return (
    <span style={{ padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 12, fontWeight: 700 }}>
      {s.label}
    </span>
  )
}

const pad: React.CSSProperties = { maxWidth: 820, margin: '0 auto', padding: '32px 20px 60px' }
const btnPrimary: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 12,
  padding: '10px 16px',
  background: '#18171A',
  color: '#F7F5F1',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 700,
}
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px',
  background: '#FFFFFF',
  border: '1px solid #E2DDD6',
  borderRadius: 12,
  marginBottom: 10,
}
const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  background: '#FFFFFF',
  border: '1px dashed #E2DDD6',
  borderRadius: 12,
  marginTop: 16,
}
const errorStyle: React.CSSProperties = {
  background: '#FDECEA',
  color: '#9C2A1F',
  padding: '10px 14px',
  borderRadius: 10,
  marginTop: 12,
}
