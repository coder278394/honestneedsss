'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supportService, type TicketCategory } from '@/services/supportService'
import { getApiErrorMessage } from '@/lib/api'

const CATEGORIES: Array<{ key: TicketCategory; label: string }> = [
  { key: 'account', label: 'Account & sign-in' },
  { key: 'payment', label: 'Payment / payout' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'volunteer', label: 'Volunteer' },
  { key: 'veterans', label: 'Veterans / Battle Buddies' },
  { key: 'trust_safety', label: 'Trust & safety' },
  { key: 'bug', label: 'Bug or technical issue' },
  { key: 'other', label: 'Something else' },
]

// Minimal client-side PII hint — the backend has the authoritative check
// and will log if the user sends it anyway.
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/
const CC_RE = /\b(?:\d[ -]*?){13,16}\b/
function hasPII(s: string) {
  return SSN_RE.test(s) || CC_RE.test(s)
}

export default function NewSupportTicketPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<TicketCategory>('other')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const piiHint = useMemo(() => hasPII(body) || hasPII(subject), [body, subject])

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const { ticket } = await supportService.create({ subject, body, category })
      router.push(`/support/${ticket._id}`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not open ticket.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={pad}>
      <Link href="/support">← All tickets</Link>
      <h1 style={{ fontSize: 32, marginTop: 10 }}>New ticket</h1>

      <label style={label}>Category</label>
      <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} style={input}>
        {CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <label style={label}>Subject</label>
      <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={140} style={input} />

      <label style={label}>What's going on?</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={10_000}
        style={{ ...input, minHeight: 180 }}
      />

      {piiHint && (
        <div style={warnStyle}>
          Please don't include Social Security numbers, full credit-card numbers, or other sensitive IDs — we don't need them to help.
        </div>
      )}
      {error && <div style={errorStyle}>{error}</div>}

      <button onClick={submit} disabled={busy || !subject.trim() || !body.trim()} style={btn}>
        {busy ? 'Submitting…' : 'Open ticket'}
      </button>
    </main>
  )
}

const pad: React.CSSProperties = { maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }
const label: React.CSSProperties = { display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#4A4750', marginTop: 14 }
const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 12px',
  background: '#FFFFFF',
  color: '#18171A',
  border: '1px solid #E2DDD6',
  borderRadius: 8,
  marginTop: 6,
  fontFamily: 'inherit',
}
const btn: React.CSSProperties = {
  marginTop: 18,
  padding: '12px 20px',
  background: '#18171A',
  color: '#F7F5F1',
  border: 0,
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
}
const warnStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '10px 14px',
  borderRadius: 10,
  background: '#FFF4D6',
  color: '#8A5A00',
  border: '1px solid #F0D98B',
}
const errorStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '10px 14px',
  borderRadius: 10,
  background: '#FDECEA',
  color: '#9C2A1F',
}
