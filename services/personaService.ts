/**
 * Persona identity verification service — frontend wrapper.
 *
 * Every call goes through apiClient so token refresh is centralized.
 * The Persona SDK itself is NOT imported here — it is dynamically loaded
 * by `app/verify/persona/page.tsx` so it stays out of the main bundle.
 */

import { apiClient } from '@/lib/api'

export type PersonaInquiryStatus =
  | 'created'
  | 'pending'
  | 'completed'
  | 'approved'
  | 'declined'
  | 'needs_review'
  | 'needs_more_info'
  | 'rejected'
  | 'expired'

export interface StartInquiryResponse {
  inquiry_id: string
  session_token: string | null
  status: PersonaInquiryStatus
  reused: boolean
  submission_id: string
}

export interface MyInquiryResponse {
  submission_id: string
  status: PersonaInquiryStatus
  persona_inquiry_id: string
  persona_report_id: string | null
  webhook_last_event_at: string | null
  automated_checks: {
    face_match_score: number | null
    liveness_passed: boolean | null
    duplicate_suspected: boolean
    provider: string
    provider_reference: string
  } | null
  submitted_at: string
}

export async function startPersonaInquiry(metadata: Record<string, unknown> = {}): Promise<StartInquiryResponse> {
  const res = await apiClient.post<{ success: boolean; data: StartInquiryResponse }>(
    '/api/verification/persona/start',
    { metadata }
  )
  return res.data.data
}

export async function getMyPersonaInquiry(): Promise<MyInquiryResponse | null> {
  const res = await apiClient.get<{ success: boolean; data: MyInquiryResponse | null }>(
    '/api/verification/persona/me'
  )
  return res.data.data
}

/** Convenience: terminal statuses the poller can stop on. */
export const TERMINAL_STATUSES: PersonaInquiryStatus[] = [
  'approved',
  'declined',
  'rejected',
  'expired',
  'needs_more_info',
]
