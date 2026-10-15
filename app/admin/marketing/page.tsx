'use client'

/**
 * /admin/marketing — compose, preview, double-confirm, send.
 *
 * Safety story:
 *  1. Dry-run is the default. The first send is always a preview that
 *     returns the resolved list sizes and the HTML with the CAN-SPAM footer
 *     already appended.
 *  2. Live send requires BOTH a typed confirmation phrase AND the user
 *     repeating the contact count. The backend re-checks both.
 *  3. The backend writes an AuditLog entry per successful send.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { adminMarketingService, type MarketingList } from '@/services/supportService'
import { getApiErrorMessage } from '@/lib/api'

type Preview = { html: string; subject: string; list_ids: string[]; name: string }

export default function MarketingComposerPage() {
  const [lists, setLists] = useState<MarketingList[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('<p>Hi {{first_name}},</p>\n<p>Here\'s what\'s new on HonestNeed this week.</p>')
  const [sendAt, setSendAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [resolvedContacts, setResolvedContacts] = useState(0)
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [confirmCount, setConfirmCount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setLists(await adminMarketingService.listSegments())
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load lists.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const selectedTotal = useMemo(() => {
    return lists.filter((l) => selected.has(l.id)).reduce((n, l) => n + (l.contact_count || 0), 0)
  }, [lists, selected])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setPreview(null)
  }

  const runPreview = async () => {
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      const res = await adminMarketingService.send({
        name,
        subject,
        html,
        list_ids: Array.from(selected),
        send_at: sendAt ? new Date(sendAt).toISOString() : null,
        dry_run: true,
      })
      setPreview(res.preview)
      setResolvedContacts(res.total_contacts || 0)
      setConfirmCount('')
      setConfirmPhrase('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Preview failed.'))
    } finally {
      setBusy(false)
    }
  }

  const sendLive = async () => {
    if (confirmPhrase !== 'yes-send-live') {
      setError('Type "yes-send-live" exactly to confirm.')
      return
    }
    if (Number(confirmCount) !== resolvedContacts) {
      setError(`Confirm count must equal ${resolvedContacts}.`)
      return
    }
    setBusy(true)
    try {
      const res = await adminMarketingService.send({
        name,
        subject,
        html,
        list_ids: Array.from(selected),
        send_at: sendAt ? new Date(sendAt).toISOString() : null,
        dry_run: false,
        confirm: 'yes-send-live',
        confirm_contact_count: resolvedContacts,
      })
      setSuccess(`Scheduled. SendGrid id: ${res.id} · at ${res.scheduled_at}`)
      setPreview(null)
      setConfirmPhrase('')
      setConfirmCount('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Send failed.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main style={pad}>
      <h1 style={{ fontSize: 28 }}>Marketing composer</h1>
      <p style={{ color: '#4A4750' }}>
        Dry-run first. Live sends require typed confirmation + contact-count match.
        Every live send is logged in the admin audit log.
      </p>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={okStyle}>{success}</div>}

      <section style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>1. Compose</h2>
        <label style={label}>Internal name (for the audit log)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={input} />
        <label style={label}>Subject line</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} style={input} />
        <label style={label}>HTML body</label>
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} style={{ ...input, minHeight: 220, fontFamily: 'monospace' }} />
        <label style={label}>Send at (leave blank for immediate)</label>
        <input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} style={input} />
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>2. Pick lists</h2>
        {loading ? (
          <div style={{ opacity: 0.7 }}>Loading…</div>
        ) : lists.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No lists found.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {lists.map((l) => (
              <li key={l.id} style={{ padding: 6 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} />
                  <strong>{l.name}</strong>{' '}
                  <span style={{ color: '#8C8790' }}>· {l.contact_count.toLocaleString()} contacts</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 8, fontWeight: 700 }}>
          Selected: {selectedTotal.toLocaleString()} contact{selectedTotal === 1 ? '' : 's'}
        </div>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>3. Preview + send</h2>
        <button onClick={runPreview} disabled={busy || !subject || !html || !name || selected.size === 0} style={ghostBtn}>
          {busy ? 'Working…' : 'Preview (dry run)'}
        </button>
        {preview && (
          <>
            <div style={{ marginTop: 12, padding: 14, background: '#F7F5F1', borderRadius: 8, fontSize: 13, color: '#4A4750' }}>
              Will send <strong>{resolvedContacts.toLocaleString()}</strong> emails with subject &ldquo;{preview.subject}&rdquo;.
            </div>
            <iframe
              title="Preview"
              srcDoc={preview.html}
              style={{ width: '100%', height: 400, border: '1px solid #E2DDD6', borderRadius: 8, marginTop: 10 }}
            />
            <div style={{ marginTop: 16, padding: 14, background: '#FFF4D6', borderRadius: 8 }}>
              <strong>Final gate.</strong>
              <div style={{ marginTop: 8 }}>
                <label style={label}>Type &ldquo;yes-send-live&rdquo; to confirm</label>
                <input value={confirmPhrase} onChange={(e) => setConfirmPhrase(e.target.value)} style={input} />
                <label style={label}>Confirm contact count ({resolvedContacts})</label>
                <input value={confirmCount} onChange={(e) => setConfirmCount(e.target.value)} style={input} />
                <button onClick={sendLive} disabled={busy} style={dangerBtn}>
                  {busy ? 'Sending…' : 'SEND LIVE'}
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

const pad: React.CSSProperties = { maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }
const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E2DDD6', borderRadius: 12, padding: 18, marginTop: 16 }
const label: React.CSSProperties = { display: 'block', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#4A4750', marginTop: 10 }
const input: React.CSSProperties = { display: 'block', width: '100%', padding: '10px 12px', background: '#FFFFFF', color: '#18171A', border: '1px solid #E2DDD6', borderRadius: 8, marginTop: 6, fontFamily: 'inherit' }
const ghostBtn: React.CSSProperties = { padding: '10px 14px', background: '#FFFFFF', color: '#18171A', border: '1px solid #3D3A44', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }
const dangerBtn: React.CSSProperties = { marginTop: 10, padding: '12px 20px', background: '#8E1C1C', color: '#F6F3EC', border: 0, borderRadius: 10, fontWeight: 800, cursor: 'pointer' }
const errorStyle: React.CSSProperties = { marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#FDECEA', color: '#9C2A1F' }
const okStyle: React.CSSProperties = { marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#E8F5EC', color: '#1E6B33' }
