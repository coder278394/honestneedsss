'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { adminSupportService, type Ticket, type TicketStatus } from '@/services/supportService'
import { getApiErrorMessage } from '@/lib/api'

const STATUSES: Array<{ k: TicketStatus | ''; label: string }> = [
  { k: '', label: 'All' },
  { k: 'open', label: 'Open' },
  { k: 'pending', label: 'Waiting on user' },
  { k: 'resolved', label: 'Resolved' },
  { k: 'closed', label: 'Closed' },
]

export default function AdminSupportQueuePage() {
  const [status, setStatus] = useState<TicketStatus | ''>('open')
  const [rows, setRows] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminSupportService.queue({
        status: status || undefined,
        limit: 50,
      })
      setRows(res.items)
      setTotal(res.total)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load queue.'))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <main style={pad}>
      <h1 style={{ fontSize: 28 }}>Support queue</h1>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {STATUSES.map((s) => (
          <button
            key={s.k || 'all'}
            onClick={() => setStatus(s.k)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid #E2DDD6',
              background: status === s.k ? '#18171A' : '#FFFFFF',
              color: status === s.k ? '#F7F5F1' : '#18171A',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#8C8790', marginTop: 8 }}>{total} ticket{total === 1 ? '' : 's'}</div>

      {error && <div style={errorStyle}>{error}</div>}
      {loading ? (
        <div style={{ opacity: 0.7, marginTop: 16 }}>Loading…</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 16 }}>
          {rows.map((t) => {
            const user = typeof t.user_id === 'object' ? t.user_id : null
            return (
              <li key={t._id} style={row}>
                <Link href={`/admin/support/${t._id}`} style={{ color: '#18171A', textDecoration: 'none', flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{t.subject}</div>
                  <div style={{ fontSize: 12, color: '#8C8790' }}>
                    {user?.display_name || user?.email || t.user_id} · {t.category} · {t.priority}
                    {' · '}
                    {t.last_user_message_at ? `user replied ${new Date(t.last_user_message_at).toLocaleString()}` : 'no replies'}
                  </div>
                </Link>
                <span style={{ padding: '2px 10px', borderRadius: 999, background: '#F0EDE8', color: '#4A4750', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                  {t.status}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

const pad: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '32px 20px 60px' }
const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px',
  background: '#FFFFFF',
  border: '1px solid #E2DDD6',
  borderRadius: 12,
  marginBottom: 8,
}
const errorStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '10px 14px',
  borderRadius: 10,
  background: '#FDECEA',
  color: '#9C2A1F',
}
