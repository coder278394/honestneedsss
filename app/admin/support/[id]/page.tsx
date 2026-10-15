'use client'

/**
 * Staff ticket detail — includes the TASK-9.5 "Draft reply" button.
 * The draft is loaded into the textarea for the staff member to edit; the
 * eventual send is a normal staff reply with `ai_drafted: true` tagged.
 */

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { adminSupportService, type Ticket, type Message } from '@/services/supportService'
import { getApiErrorMessage } from '@/lib/api'

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [internal, setInternal] = useState(false)
  const [aiDraftedFlag, setAIDraftedFlag] = useState(false)
  const [draftConfidence, setDraftConfidence] = useState<number | null>(null)
  const [draftWarnings, setDraftWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const d = await adminSupportService.get(id as string)
      setTicket(d.ticket)
      setMessages(d.messages)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load ticket.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const draft = async () => {
    if (!id) return
    setBusy(true)
    try {
      const r = await adminSupportService.draftReply(id as string)
      setBody(r.draft)
      setDraftConfidence(r.confidence)
      setDraftWarnings(r.warnings || [])
      setAIDraftedFlag(true)
    } catch (err) {
      alert(getApiErrorMessage(err, 'Draft failed.'))
    } finally {
      setBusy(false)
    }
  }

  const send = async () => {
    if (!id || !body.trim()) return
    setBusy(true)
    try {
      await adminSupportService.reply(id as string, body.trim(), {
        internal,
        ai_drafted: aiDraftedFlag,
      })
      setBody('')
      setInternal(false)
      setAIDraftedFlag(false)
      setDraftConfidence(null)
      setDraftWarnings([])
      await refresh()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Send failed.'))
    } finally {
      setBusy(false)
    }
  }

  const resolve = async () => {
    if (!id) return
    if (!window.confirm('Mark this ticket resolved? User has 7 days to reopen with a reply.')) return
    try {
      await adminSupportService.resolve(id as string)
      await refresh()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Resolve failed.'))
    }
  }

  const close = async () => {
    if (!id) return
    if (!window.confirm('Close this ticket? User will need to open a new one.')) return
    try {
      await adminSupportService.close(id as string)
      await refresh()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Close failed.'))
    }
  }

  if (loading) return <main style={pad}>Loading…</main>
  if (error || !ticket) return <main style={pad}>{error || 'Ticket not found.'}</main>

  const user = typeof ticket.user_id === 'object' ? ticket.user_id : null

  return (
    <main style={pad}>
      <Link href="/admin/support">← Queue</Link>
      <h1 style={{ fontSize: 26, marginTop: 10 }}>{ticket.subject}</h1>
      <div style={{ fontSize: 12, color: '#8C8790' }}>
        {user?.email} · {ticket.category} · priority {ticket.priority} · status <strong>{ticket.status}</strong>
      </div>

      <ol style={{ listStyle: 'none', padding: 0, marginTop: 20 }}>
        {messages.map((m) => (
          <li
            key={m._id}
            style={{
              ...bubble,
              background: m.internal ? '#FEF3C7' : m.author_role === 'staff' ? '#EEF4EB' : '#FFFFFF',
            }}
          >
            <div style={{ fontSize: 11, color: '#8C8790', marginBottom: 4 }}>
              {m.author_role === 'staff' ? 'Staff' : 'User'} · {new Date(m.created_at).toLocaleString()}
              {m.internal && <span style={tag('#8A5A00', '#FFF4D6')}>Internal</span>}
              {m.ai_drafted && <span style={tag('#5A2C87', '#F0E7FB')}>AI-drafted</span>}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
          </li>
        ))}
      </ol>

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button onClick={draft} disabled={busy} style={ghostBtn}>
          {busy ? 'Working…' : 'Draft reply (AI)'}
        </button>
        <button onClick={resolve} disabled={busy} style={ghostBtn}>
          Mark resolved
        </button>
        <button onClick={close} disabled={busy} style={ghostBtn}>
          Close
        </button>
      </div>

      {aiDraftedFlag && (
        <div style={aiBanner}>
          AI draft — review before sending. Confidence {Math.round((draftConfidence ?? 0) * 100)}%.
          {draftWarnings.length > 0 && (
            <ul style={{ marginTop: 6 }}>
              {draftWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          // Human edits clear the AI flag unless the user explicitly keeps it.
          if (aiDraftedFlag) setAIDraftedFlag(false)
        }}
        placeholder="Write a reply…"
        style={{ ...input, minHeight: 160, marginTop: 10 }}
      />
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
        <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
        Internal note (not visible to the user)
      </label>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
        <input type="checkbox" checked={aiDraftedFlag} onChange={(e) => setAIDraftedFlag(e.target.checked)} />
        Tag as AI-drafted (for audit)
      </label>
      <button onClick={send} disabled={busy || !body.trim()} style={btn}>
        {busy ? 'Sending…' : 'Send reply'}
      </button>
    </main>
  )
}

function tag(fg: string, bg: string): React.CSSProperties {
  return {
    marginLeft: 6,
    padding: '0 6px',
    borderRadius: 999,
    background: bg,
    color: fg,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
  }
}

const pad: React.CSSProperties = { maxWidth: 820, margin: '0 auto', padding: '32px 20px 60px' }
const bubble: React.CSSProperties = { display: 'block', padding: '12px 16px', border: '1px solid #E2DDD6', borderRadius: 12, marginBottom: 10 }
const input: React.CSSProperties = { display: 'block', width: '100%', padding: '10px 12px', background: '#FFFFFF', color: '#18171A', border: '1px solid #E2DDD6', borderRadius: 8, fontFamily: 'inherit' }
const btn: React.CSSProperties = { marginTop: 10, padding: '12px 20px', background: '#18171A', color: '#F7F5F1', border: 0, borderRadius: 10, fontWeight: 700, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { padding: '10px 14px', background: '#FFFFFF', color: '#18171A', border: '1px solid #3D3A44', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }
const aiBanner: React.CSSProperties = { marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#F0E7FB', color: '#5A2C87', fontSize: 13 }
