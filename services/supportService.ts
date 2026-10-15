/**
 * supportService — frontend wrapper over /api/support/* and
 * /api/admin/support/*.
 */

import { apiClient } from '@/lib/api'

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketCategory = 'account' | 'payment' | 'campaign' | 'volunteer' | 'veterans' | 'trust_safety' | 'bug' | 'other'

export interface Ticket {
  _id: string
  user_id: string | { _id: string; display_name?: string; email?: string }
  subject: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  assigned_to: null | { _id: string; display_name?: string; email?: string } | string
  attachments: Array<{ url: string; public_id?: string | null; mime?: string | null; size_bytes?: number | null }>
  first_response_at: string | null
  resolved_at: string | null
  closed_at: string | null
  last_user_message_at: string | null
  last_staff_message_at: string | null
  internal_notes?: string
  created_at: string
  updated_at: string
}

export interface Message {
  _id: string
  ticket_id: string
  author_id: string
  author_role: 'user' | 'staff'
  body: string
  attachments: Ticket['attachments']
  ai_drafted: boolean
  internal: boolean
  created_at: string
}

export const supportService = {
  async listMine() {
    const { data } = await apiClient.get<{ data: Ticket[] }>('/api/support/tickets')
    return data.data
  },
  async create(payload: { subject: string; body: string; category?: TicketCategory; priority?: TicketPriority }) {
    const { data } = await apiClient.post<{ data: { ticket: Ticket; pii_warn: boolean } }>(
      '/api/support/tickets',
      payload
    )
    return data.data
  },
  async get(id: string) {
    const { data } = await apiClient.get<{ data: { ticket: Ticket; messages: Message[] } }>(
      `/api/support/tickets/${encodeURIComponent(id)}`
    )
    return data.data
  },
  async reply(id: string, body: string) {
    const { data } = await apiClient.post<{ data: { message: Message; ticket: Ticket; pii_warn: boolean } }>(
      `/api/support/tickets/${encodeURIComponent(id)}/messages`,
      { body }
    )
    return data.data
  },
}

export const adminSupportService = {
  async queue(opts: { status?: TicketStatus; assigned_to?: string; limit?: number; page?: number } = {}) {
    const search = new URLSearchParams()
    if (opts.status) search.set('status', opts.status)
    if (opts.assigned_to) search.set('assigned_to', opts.assigned_to)
    if (opts.limit) search.set('limit', String(opts.limit))
    if (opts.page) search.set('page', String(opts.page))
    const qs = search.toString()
    const { data } = await apiClient.get<{ items: Ticket[]; total: number; page: number; limit: number }>(
      `/api/admin/support/tickets${qs ? `?${qs}` : ''}`
    )
    return data
  },
  async get(id: string) {
    const { data } = await apiClient.get<{ data: { ticket: Ticket; messages: Message[] } }>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}`
    )
    return data.data
  },
  async reply(id: string, body: string, opts: { internal?: boolean; ai_drafted?: boolean } = {}) {
    const { data } = await apiClient.post<{ data: { message: Message; ticket: Ticket } }>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}/messages`,
      { body, internal: opts.internal, ai_drafted: opts.ai_drafted }
    )
    return data.data
  },
  async assign(id: string, staff_id?: string) {
    const { data } = await apiClient.post<{ data: Ticket }>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}/assign`,
      { staff_id }
    )
    return data.data
  },
  async resolve(id: string) {
    const { data } = await apiClient.post<{ data: Ticket }>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}/resolve`
    )
    return data.data
  },
  async close(id: string) {
    const { data } = await apiClient.post<{ data: Ticket }>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}/close`
    )
    return data.data
  },
  async draftReply(id: string) {
    const { data } = await apiClient.post<{ data: { draft: string; confidence: number; warnings: string[]; ai_drafted: true } }>(
      `/api/admin/support/tickets/${encodeURIComponent(id)}/draft-reply`
    )
    return data.data
  },
}

export interface MarketingList {
  id: string
  name: string
  contact_count: number
}
export const adminMarketingService = {
  async listSegments() {
    const { data } = await apiClient.get<{ data: MarketingList[] }>('/api/admin/marketing/lists')
    return data.data
  },
  async send(payload: {
    name: string
    subject: string
    html: string
    list_ids: string[]
    locale?: string
    send_at?: string | null
    dry_run?: boolean
    confirm?: string
    confirm_contact_count?: number
  }) {
    const { data } = await apiClient.post<{ data: any }>('/api/admin/marketing/campaigns', payload)
    return data.data
  },
}
