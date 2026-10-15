'use client'

/**
 * /rewards/videos — Phase 6 TASK-6.5.
 *
 * Lists the signed-in user's video share rewards: pending, verified, rejected.
 * Pulled from /api/videos/rewards/mine. Links out to /settings/payouts when
 * the user has verified balance ready to withdraw.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { videoService, type VideoRewardRow } from '@/services/videoService'
import { getApiErrorMessage } from '@/lib/api'

const PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X',
  x: 'X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  threads: 'Threads',
}

function cents(c: number) {
  return `$${(c / 100).toFixed(2)}`
}

function titleOf(v: VideoRewardRow['video_id']): string {
  if (typeof v === 'string') return 'Video'
  return v?.title || 'Video'
}

function videoLink(v: VideoRewardRow['video_id']): string {
  const id = typeof v === 'string' ? v : v?._id
  return id ? `/videos/${id}` : '#'
}

export default function RewardsVideosPage() {
  const [rows, setRows] = useState<VideoRewardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await videoService.listMyRewards(100)
      setRows(items)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your rewards.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totals = useMemo(() => {
    let pending = 0
    let verified = 0
    let rejected = 0
    for (const r of rows) {
      if (r.verification_status === 'pending_verification') pending += r.amount_cents
      else if (r.verification_status === 'verified') verified += r.amount_cents
      else if (r.verification_status === 'rejected') rejected += r.amount_cents
    }
    return { pending, verified, rejected }
  }, [rows])

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <Link href="/rewards" style={backLinkStyle}>
          ← Rewards hub
        </Link>
        <h1 style={{ margin: '8px 0 0', fontFamily: 'Syne, sans-serif', fontSize: 32 }}>
          Video share rewards
        </h1>
        <p style={{ margin: '8px 0 0', color: '#4A4750', maxWidth: 640 }}>
          Share published videos on your primary social platform to earn promo credit.
          Each reward is verified before it pays — until then it stays in <em>pending</em>.
        </p>
      </div>

      <section style={gridStyle}>
        <StatCard label="Pending" amount={cents(totals.pending)} tone="pending" />
        <StatCard label="Verified" amount={cents(totals.verified)} tone="verified" />
        <StatCard label="Rejected" amount={cents(totals.rejected)} tone="rejected" />
      </section>

      {totals.verified > 0 && (
        <div style={payoutBannerStyle}>
          <span>
            You have <strong>{cents(totals.verified)}</strong> verified reward credit ready.
          </span>
          <Link href="/settings/payouts" style={{ color: '#F7F5F1', fontWeight: 700 }}>
            Set up payout →
          </Link>
        </div>
      )}

      {error && <div style={errorStyle}>{error}</div>}

      {loading ? (
        <div style={{ color: '#8C8790' }}>Loading rewards…</div>
      ) : rows.length === 0 ? (
        <div style={emptyStyle}>
          <strong>No rewards yet.</strong>
          <div style={{ marginTop: 6, color: '#4A4750' }}>
            Share a published video from a creator profile to earn your first one.
          </div>
        </div>
      ) : (
        <ul style={listStyle}>
          {rows.map((r) => (
            <li key={r._id} style={rowStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link href={videoLink(r.video_id)} style={{ fontWeight: 600 }}>
                    {titleOf(r.video_id)}
                  </Link>
                  <StatusBadge status={r.verification_status} />
                </div>
                <div style={{ color: '#4A4750', marginTop: 4, fontSize: 13 }}>
                  Shared on {PLATFORM_LABEL[r.platform] || r.platform} ·{' '}
                  {new Date(r.createdAt).toLocaleString()}
                </div>
                {r.external_post_url && (
                  <a
                    href={r.external_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#4A4750' }}
                  >
                    View external post ↗
                  </a>
                )}
                {r.verification_status === 'rejected' && r.rejection_reason && (
                  <div style={rejectDetailStyle}>Reason: {r.rejection_reason}</div>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{cents(r.amount_cents)}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function StatCard({
  label,
  amount,
  tone,
}: {
  label: string
  amount: string
  tone: 'pending' | 'verified' | 'rejected'
}) {
  const colors: Record<string, { bg: string; fg: string; border: string }> = {
    pending: { bg: '#FFF4D6', fg: '#8A5A00', border: '#F0D98B' },
    verified: { bg: '#E8F5EC', fg: '#1E6B33', border: '#A9D8B5' },
    rejected: { bg: '#FDECEA', fg: '#9C2A1F', border: '#F2B3AC' },
  }
  const c = colors[tone]
  return (
    <div
      style={{
        padding: 20,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
      }}
    >
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{amount}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: VideoRewardRow['verification_status'] }) {
  const map = {
    pending_verification: { label: 'Pending', bg: '#FFF4D6', fg: '#8A5A00' },
    verified: { label: 'Verified', bg: '#E8F5EC', fg: '#1E6B33' },
    rejected: { label: 'Rejected', bg: '#FDECEA', fg: '#9C2A1F' },
  } as const
  const s = map[status]
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}
    >
      {s.label}
    </span>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F7F5F1',
  padding: '40px 20px 80px',
  maxWidth: 860,
  margin: '0 auto',
}
const headerStyle: React.CSSProperties = { marginBottom: 24 }
const backLinkStyle: React.CSSProperties = { color: '#4A4750', textDecoration: 'none', fontSize: 14 }
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
  marginBottom: 20,
}
const payoutBannerStyle: React.CSSProperties = {
  background: '#18171A',
  color: '#F7F5F1',
  padding: '14px 18px',
  borderRadius: 12,
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
}
const listStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}
const rowStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E2DDD6',
  borderRadius: 12,
  padding: '14px 18px',
  display: 'flex',
  gap: 16,
  alignItems: 'center',
}
const emptyStyle: React.CSSProperties = {
  padding: 24,
  background: '#FFFFFF',
  border: '1px dashed #E2DDD6',
  borderRadius: 12,
  textAlign: 'center',
}
const errorStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  background: '#FDECEA',
  color: '#9C2A1F',
  border: '1px solid #F2B3AC',
  marginBottom: 16,
}
const rejectDetailStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: '#9C2A1F',
}
