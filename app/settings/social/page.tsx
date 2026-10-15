'use client'

/**
 * /settings/social — TASK-5.5.
 *
 * Hosts the SocialConnections component. OAuth callbacks on the backend
 * redirect here with ?provider=&status=ok|error&reason= — the component
 * reads and clears those query params on mount.
 */

import React from 'react'
import Link from 'next/link'
import SocialConnections from '@/components/profile/SocialConnections'

export default function SettingsSocialPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F7F5F1',
        padding: '40px 20px 80px',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto 20px' }}>
        <Link
          href="/settings"
          style={{
            color: '#4A4750',
            fontSize: 14,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Back to settings
        </Link>
      </div>
      <SocialConnections />
    </main>
  )
}
