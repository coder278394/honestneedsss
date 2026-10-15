/**
 * Admin — Feature Flags
 *
 * Minimal admin surface for Phase 0's expanded FeatureFlagService.
 * - Lists every declared flag with its current value, default, and overridden flag.
 * - Supports boolean toggle, mode select, and scoped payload JSON edit.
 * - All writes go through apiClient (lib/api.ts); never raw fetch/axios.
 *
 * Access: /api/admin/feature-flags backend enforces admin + role (super_admin | finance).
 * ProtectedRoute keeps non-admins from even hitting this page.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { apiClient } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageContainer } from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type FlagType = 'boolean' | 'mode' | 'scoped';

interface FlagDescriptor {
  name: string;
  type: FlagType;
  modes: string[] | null;
  label: string;
  description: string;
  default: unknown;
  value: unknown;
  overridden: boolean;
}

interface ListResponse {
  success: boolean;
  data: { flags: FlagDescriptor[] };
}

function formatValue(v: unknown): string {
  if (typeof v === 'string' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function FlagRow({ flag, onChanged }: { flag: FlagDescriptor; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string>(formatValue(flag.value));

  async function setValue(value: unknown) {
    setBusy(true);
    try {
      await apiClient.post(`/api/admin/feature-flags/${encodeURIComponent(flag.name)}`, {
        value,
      });
      toast.success(`Updated ${flag.name}`);
      onChanged();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update flag';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await apiClient.delete(`/api/admin/feature-flags/${encodeURIComponent(flag.name)}`);
      toast.success(`Reset ${flag.name} to default`);
      onChanged();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset flag';
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function saveJson() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(draft);
    } catch {
      toast.error('Invalid JSON');
      return;
    }
    await setValue(parsed);
  }

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        background: flag.overridden ? '#fffbea' : '#ffffff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <strong style={{ fontFamily: 'monospace' }}>{flag.name}</strong>
          <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 12 }}>
            type: {flag.type} {flag.overridden ? '· overridden' : '· default'}
          </span>
        </div>
        <Button variant="secondary" onClick={reset} disabled={busy || !flag.overridden}>
          Reset to default
        </Button>
      </div>
      <div style={{ margin: '6px 0 10px', color: '#374151' }}>{flag.label}</div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{flag.description}</div>

      {flag.type === 'boolean' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant={flag.value === true ? 'primary' : 'secondary'} onClick={() => setValue(true)} disabled={busy}>
            On
          </Button>
          <Button variant={flag.value === false ? 'primary' : 'secondary'} onClick={() => setValue(false)} disabled={busy}>
            Off
          </Button>
        </div>
      )}

      {flag.type === 'mode' && flag.modes && (
        <div style={{ display: 'flex', gap: 8 }}>
          {flag.modes.map((m) => (
            <Button
              key={m}
              variant={flag.value === m ? 'primary' : 'secondary'}
              onClick={() => setValue(m)}
              disabled={busy}
            >
              {m}
            </Button>
          ))}
        </div>
      )}

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', color: '#2563eb' }}>Scoped JSON editor</summary>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          style={{
            width: '100%',
            fontFamily: 'monospace',
            fontSize: 12,
            marginTop: 8,
            padding: 8,
            border: '1px solid #d1d5db',
            borderRadius: 4,
          }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <Button onClick={saveJson} disabled={busy}>
            Save JSON
          </Button>
          <span style={{ color: '#6b7280', fontSize: 12, alignSelf: 'center' }}>
            Scoped shape: {'{ enabled, percentage?, user_ids?, roles?, envs? }'}
          </span>
        </div>
      </details>
    </div>
  );
}

function FeatureFlagsAdminPageInner() {
  const [flags, setFlags] = useState<FlagDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResponse>('/api/admin/feature-flags');
      setFlags(res.data?.data?.flags || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const sorted = useMemo(() => [...flags].sort((a, b) => a.name.localeCompare(b.name)), [flags]);

  return (
    <PageContainer>
      <PageHeader
        title="Feature Flags"
        description="Toggle platform features. Changes take effect within ~30 seconds."
      />
      {loading && <LoadingSpinner />}
      {error && (
        <div role="alert" style={{ color: '#b91c1c', padding: 12, border: '1px solid #fecaca', borderRadius: 6 }}>
          {error}
        </div>
      )}
      {!loading && !error && sorted.length === 0 && (
        <div style={{ color: '#6b7280' }}>No flags declared.</div>
      )}
      {!loading && !error && sorted.map((f) => (
        <FlagRow key={f.name} flag={f} onChanged={load} />
      ))}
    </PageContainer>
  );
}

export default function FeatureFlagsAdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <FeatureFlagsAdminPageInner />
    </ProtectedRoute>
  );
}
