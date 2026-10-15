'use client'

/**
 * SocialConnections — TASK-5.5.
 *
 * Lists the caller's social connections and offers connect / reconnect /
 * disconnect for each supported provider. Backend lives at /api/social.
 *
 * UX notes:
 *  - Status badges: active (green), needs_reauth (amber, prompts reconnect),
 *    revoked / disconnected (muted).
 *  - "Connect" POSTs to /api/social/connect/:provider and redirects the
 *    browser to the authorize URL the backend returns. The provider calls
 *    the backend callback, which redirects back here with ?status=ok|error.
 *  - A revoked token must behave like "not connected" from the UI's
 *    perspective; the row is still listed as history but the primary action
 *    becomes Connect, not Disconnect.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient, getApiErrorMessage } from '@/lib/api'

type Provider = 'meta' | 'x'
type Status = 'active' | 'needs_reauth' | 'revoked'

interface Connection {
  _id: string
  provider: Provider
  status: Status
  provider_display_name: string | null
  scopes: string[]
  expires_at: string | null
  updatedAt: string
  meta?: { instagram_business_account_id?: string | null }
}

const PROVIDER_META: Record<
  Provider,
  { label: string; description: string; icon: React.ReactNode }
> = {
  meta: {
    label: 'Facebook & Instagram',
    description: 'Post to a Facebook Page you admin, and its linked Instagram business account.',
    icon: <span aria-hidden>📘</span>,
  },
  x: {
    label: 'X (Twitter)',
    description: 'Post to your X account using OAuth 2.0 with per-use refresh-token rotation.',
    icon: <span aria-hidden>✖</span>,
  },
}

const PROVIDERS: Provider[] = ['meta', 'x']

function readStatusQuery(): { provider?: string; status?: string; reason?: string } {
  if (typeof window === 'undefined') return {}
  const url = new URL(window.location.href)
  return {
    provider: url.searchParams.get('provider') || undefined,
    status: url.searchParams.get('status') || undefined,
    reason: url.searchParams.get('reason') || undefined,
  }
}

function clearStatusQuery() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.delete('provider')
  url.searchParams.delete('status')
  url.searchParams.delete('reason')
  window.history.replaceState({}, '', url.toString())
}

export default function SocialConnections() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<Provider | null>(null)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const byProvider = useMemo(() => {
    const m: Partial<Record<Provider, Connection>> = {}
    for (const c of connections) m[c.provider] = c
    return m
  }, [connections])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<{ success: boolean; data: Connection[] }>(
        '/social/connections'
      )
      setConnections(res.data?.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load social connections.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const q = readStatusQuery()
    if (!q.status) return
    if (q.status === 'ok') {
      setBanner({ kind: 'ok', text: `Connected ${q.provider || 'account'}.` })
    } else {
      setBanner({
        kind: 'error',
        text: `Could not connect ${q.provider || 'account'}${q.reason ? ` (${q.reason})` : ''}.`,
      })
    }
    clearStatusQuery()
  }, [])

  const connect = useCallback(async (provider: Provider) => {
    setBusy(provider)
    setBanner(null)
    try {
      const res = await apiClient.post<{
        success: boolean
        data: { authorizeUrl: string }
      }>(`/social/connect/${provider}`)
      const url = res.data?.data?.authorizeUrl
      if (!url) throw new Error('No authorize URL returned')
      window.location.href = url
    } catch (err) {
      setBanner({ kind: 'error', text: getApiErrorMessage(err, 'Could not start connection.') })
      setBusy(null)
    }
  }, [])

  const disconnect = useCallback(
    async (provider: Provider) => {
      if (!window.confirm(`Disconnect ${PROVIDER_META[provider].label}?`)) return
      setBusy(provider)
      setBanner(null)
      try {
        await apiClient.delete(`/social/connections/${provider}`)
        setBanner({ kind: 'ok', text: `Disconnected ${PROVIDER_META[provider].label}.` })
        await refresh()
      } catch (err) {
        setBanner({ kind: 'error', text: getApiErrorMessage(err, 'Disconnect failed.') })
      } finally {
        setBusy(null)
      }
    },
    [refresh]
  )

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontFamily: 'Syne, sans-serif', fontSize: 24 }}>
          Social connections
        </h2>
        <p style={{ margin: '6px 0 0', color: '#4A4750' }}>
          Connect accounts so HonestNeed can post campaign updates and videos on your behalf.
          Tokens are stored encrypted and never shown to anyone — not even to you.
        </p>
      </header>

      {banner && (
        <div
          role="status"
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 16,
            background: banner.kind === 'ok' ? '#E8F5EC' : '#FDECEA',
            color: banner.kind === 'ok' ? '#1E6B33' : '#9C2A1F',
            border: `1px solid ${banner.kind === 'ok' ? '#A9D8B5' : '#F2B3AC'}`,
          }}
        >
          {banner.text}
        </div>
      )}

      {error && (
        <div role="alert" style={errorStyle}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#8C8790' }}>Loading connections…</div>
      ) : (
        <ul style={listStyle}>
          {PROVIDERS.map((provider) => {
            const conn = byProvider[provider]
            const meta = PROVIDER_META[provider]
            const connected = conn && conn.status === 'active'
            const needsReauth = conn && conn.status === 'needs_reauth'
            return (
              <li key={provider} style={rowStyle}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                  <div style={iconStyle}>{meta.icon}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong>{meta.label}</strong>
                      <StatusBadge status={conn?.status} />
                    </div>
                    <div style={{ color: '#4A4750', marginTop: 4 }}>{meta.description}</div>
                    {conn?.provider_display_name && (
                      <div style={{ marginTop: 6, fontSize: 13, color: '#4A4750' }}>
                        Linked as <code>{conn.provider_display_name}</code>
                        {conn.meta?.instagram_business_account_id ? ' · IG linked' : ''}
                      </div>
                    )}
                    {conn?.expires_at && (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#8C8790' }}>
                        Expires {new Date(conn.expires_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {!connected && (
                    <button
                      type="button"
                      onClick={() => connect(provider)}
                      disabled={busy === provider}
                      style={primaryBtn}
                    >
                      {needsReauth
                        ? 'Reconnect'
                        : busy === provider
                          ? 'Opening…'
                          : 'Connect'}
                    </button>
                  )}
                  {connected && (
                    <button
                      type="button"
                      onClick={() => disconnect(provider)}
                      disabled={busy === provider}
                      style={secondaryBtn}
                    >
                      {busy === provider ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status?: Status }) {
  if (!status) {
    return <Badge color="#8C8790" bg="#EEEBE5" label="Not connected" />
  }
  if (status === 'active') return <Badge color="#1E6B33" bg="#E8F5EC" label="Active" />
  if (status === 'needs_reauth')
    return <Badge color="#8A5A00" bg="#FFF4D6" label="Reconnect needed" />
  return <Badge color="#8C8790" bg="#EEEBE5" label="Disconnected" />
}

function Badge({ color, bg, label }: { color: string; bg: string; label: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 999,
        background: bg,
        color,
        fontWeight: 600,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
  padding: '24px',
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E2DDD6',
}
const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}
const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  padding: '16px',
  border: '1px solid #E2DDD6',
  borderRadius: 12,
  alignItems: 'center',
  background: '#F7F5F1',
}
const iconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: '#FFFFFF',
  border: '1px solid #E2DDD6',
  display: 'grid',
  placeItems: 'center',
  fontSize: 20,
  flexShrink: 0,
}
const primaryBtn: React.CSSProperties = {
  padding: '10px 16px',
  background: '#18171A',
  color: '#F7F5F1',
  border: 0,
  borderRadius: 10,
  fontWeight: 600,
  cursor: 'pointer',
}
const secondaryBtn: React.CSSProperties = {
  padding: '10px 16px',
  background: '#FFFFFF',
  color: '#18171A',
  border: '1px solid #3D3A44',
  borderRadius: 10,
  fontWeight: 600,
  cursor: 'pointer',
}
const errorStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  marginBottom: 16,
  background: '#FDECEA',
  color: '#9C2A1F',
  border: '1px solid #F2B3AC',
}
