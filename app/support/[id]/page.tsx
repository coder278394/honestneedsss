'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supportService, type Ticket, type Message } from '@/services/supportService'
import { getApiErrorMessage } from '@/lib/api'

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await supportService.get(id as string)
      setTicket(data.ticket)
      setMessages(data.messages)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load ticket.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const reply = async () => {
    if (!body.trim() || !id) return
    setBusy(true)
    try {
      await supportService.reply(id as string, body.trim())
      setBody('')
      await refresh()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Reply failed.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <main style={pad}>Loading…</main>
  if (error || !ticket) return <main style={pad}>{error || 'Ticket not found.'}</main>

  return (
    <main style={pad}>
      <Link href="/support">← All tickets</Link>
      <h1 style={{ fontSize: 28, marginTop: 10 }}>{ticket.subject}</h1>
      <div style={{ fontSize: 12, color: '#8C8790' }}>
        {ticket.category} · status: <strong>{ticket.status}</strong>
      </div>

      <ol style={{ listStyle: 'none', padding: 0, marginTop: 20 }}>
        {messages.map((m) => (
          <li key={m._id} style={{ ...bubble, alignSelf: m.author_role === 'staff' ? 'flex-start' : 'flex-end', background: m.author_role === 'staff' ? '#EEF4EB' : '#FFFFFF' }}>
            <div style={{ fontSize: 11, color: '#8C8790', marginBottom: 4 }}>
              {m.author_role === 'staff' ? 'HonestNeed Support' : 'You'} · {new Date(m.created_at).toLocaleString()}
              {m.ai_drafted && (
                <span style={{ marginLeft: 6, padding: '0 6px', borderRadius: 999, background: '#F0E7FB', color: '#5A2C87' }}>
                  AI-drafted
                </span>
              )}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
          </li>
        ))}
      </ol>

      {ticket.status === 'closed' ? (
        <div style={warnStyle}>This ticket is closed. Open a new one if you need more help.</div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Reply…"
            maxLength={10_000}
            style={{ ...input, minHeight: 120 }}
          />
          <button onClick={reply} disabled={busy || !body.trim()} style={btn}>
            {busy ? 'Sending…' : 'Send reply'}
          </button>
        </div>
      )}
    </main>
  )
}

const pad: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }
const bubble: React.CSSProperties = {
  display: 'block',
  padding: '12px 16px',
  border: '1px solid #E2DDD6',
  borderRadius: 12,
  marginBottom: 10,
}
const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 12px',
  background: '#FFFFFF',
  color: '#18171A',
  border: '1px solid #E2DDD6',
  borderRadius: 8,
  fontFamily: 'inherit',
}
const btn: React.CSSProperties = {
  marginTop: 10,
  padding: '12px 20px',
  background: '#18171A',
  color: '#F7F5F1',
  border: 0,
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
}
const warnStyle: React.CSSProperties = {
  marginTop: 20,
  padding: '10px 14px',
  borderRadius: 10,
  background: '#FFF4D6',
  color: '#8A5A00',
}
