/**
 * Video service — frontend wrapper over /api/videos + /api/community/posts.
 *
 * All backend calls through apiClient (apiClient CI check happy). The direct
 * upload to Cloudinary is NOT routed through apiClient (that's a cross-origin
 * multipart upload, not an authenticated backend call).
 */

import { apiClient } from '@/lib/api'

export type VideoStatus = 'uploading' | 'processing' | 'published' | 'rejected' | 'removed'
export type Visibility = 'public' | 'unlisted' | 'community'

export interface SignUploadResponse {
  cloud_name: string
  api_key: string
  upload_preset: string
  folder: string
  // Sent to Cloudinary as `public_id` — leaf only.
  public_id: string
  // What Cloudinary actually stores it as (folder + "/" + public_id). This is
  // the id to pass back to /api/videos so the backend can look it up.
  stored_public_id?: string
  timestamp: number
  signature: string
  expires_in_s: number
  upload_url: string
}

export interface Video {
  _id: string
  owner_id: string | { _id: string; display_name?: string; username?: string; avatar_url?: string | null }
  campaign_id: string | null
  title: string
  description: string
  tags: string[]
  cloudinary_public_id: string
  hls_url: string | null
  mp4_url: string | null
  thumbnail_url: string | null
  duration_s: number
  status: VideoStatus
  visibility: Visibility
  is_veteran_content: boolean
  view_count: number
  share_count: number
  created_at: string
  published_at: string | null
}

export interface FeedResponse {
  items: Video[]
  next_cursor: string | null
  limit: number
}

export const videoService = {
  async signUpload(): Promise<SignUploadResponse> {
    const { data } = await apiClient.post<{ data: SignUploadResponse }>('/videos/sign-upload')
    return data.data
  },

  async create(payload: {
    public_id: string
    title: string
    description?: string
    tags?: string[]
    visibility?: Visibility
    campaign_id?: string | null
    is_veteran?: boolean
  }): Promise<Video> {
    const { data } = await apiClient.post<{ data: Video }>('/videos', payload)
    return data.data
  },

  async list(params: { cursor?: string; limit?: number; isVeteran?: boolean; tag?: string } = {}): Promise<FeedResponse> {
    const search = new URLSearchParams()
    if (params.cursor) search.set('cursor', params.cursor)
    if (params.limit) search.set('limit', String(params.limit))
    if (typeof params.isVeteran === 'boolean') search.set('is_veteran', String(params.isVeteran))
    if (params.tag) search.set('tag', params.tag)
    const qs = search.toString()
    const { data } = await apiClient.get<FeedResponse & { success: boolean }>(
      `/videos${qs ? `?${qs}` : ''}`
    )
    return data
  },

  async get(id: string): Promise<Video> {
    const { data } = await apiClient.get<{ data: Video }>(`/videos/${encodeURIComponent(id)}`)
    return data.data
  },

  async listPending(params: { page?: number; limit?: number } = {}) {
    const search = new URLSearchParams()
    if (params.page) search.set('page', String(params.page))
    if (params.limit) search.set('limit', String(params.limit))
    const qs = search.toString()
    const { data } = await apiClient.get(`/videos/admin/pending${qs ? `?${qs}` : ''}`)
    return data as { success: boolean; items: Video[]; total: number }
  },

  async moderate(id: string, decision: 'approve' | 'reject', reason?: string) {
    const { data } = await apiClient.post(`/videos/admin/${encodeURIComponent(id)}/moderate`, {
      decision,
      reason: reason || null,
    })
    return data
  },

  // Phase 6 share-to-earn — TASK-6.4 / TASK-6.5.
  async share(
    videoId: string,
    payload: { platform: string; external_post_url?: string | null },
    idempotencyKey: string
  ): Promise<ShareRewardResponse> {
    const { data } = await apiClient.post<{ data: ShareRewardResponse }>(
      `/videos/${encodeURIComponent(videoId)}/share`,
      payload,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    )
    return data.data
  },

  async listMyRewards(limit = 50): Promise<VideoRewardRow[]> {
    const { data } = await apiClient.get<{ data: VideoRewardRow[] }>(
      `/videos/rewards/mine?limit=${limit}`
    )
    return data.data
  },
}

export interface ShareRewardResponse {
  share_id: string
  verification_status: 'pending_verification' | 'verified' | 'rejected'
  reward_amount: number
  reward_status: 'reserved' | 'paid' | 'rejected'
  rejection_reason?: string | null
  replayed?: boolean
}

export interface VideoRewardRow {
  _id: string
  video_id: string | { _id: string; title?: string | null }
  platform: string
  amount_cents: number
  verification_status: 'pending_verification' | 'verified' | 'rejected'
  rejection_reason?: string | null
  external_post_url?: string | null
  verified_at?: string | null
  rejected_at?: string | null
  createdAt: string
}

/**
 * Upload a File directly to Cloudinary using the signed upload parameters.
 * This is a plain cross-origin multipart POST — not routed through apiClient.
 */
export async function uploadFileToCloudinary(
  file: File,
  sign: SignUploadResponse,
  opts: { onProgress?: (pct: number) => void; signal?: AbortSignal } = {}
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', sign.upload_preset)
  form.append('public_id', sign.public_id)
  form.append('folder', sign.folder)
  form.append('timestamp', String(sign.timestamp))
  form.append('signature', sign.signature)
  form.append('api_key', sign.api_key)

  if (opts.onProgress && typeof XMLHttpRequest !== 'undefined') {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', sign.upload_url)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) opts.onProgress?.(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Cloudinary ${xhr.status}`)))
      xhr.onerror = () => reject(new Error('Upload failed'))
      opts.signal?.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('Aborted'))
      })
      // api-client-exempt
      xhr.send(form)
    })
    return
  }

  // api-client-exempt
  const res = await fetch(sign.upload_url, { method: 'POST', body: form, signal: opts.signal })
  if (!res.ok) throw new Error(`Cloudinary ${res.status}`)
}

// ── Community posts ───────────────────────────────────────────────────────
export interface CommunityAuthor {
  _id: string
  display_name?: string
  username?: string
  avatar_url?: string | null
  verified?: boolean
}

export interface CommunityPost {
  _id: string
  author_id: string | CommunityAuthor
  body: string
  media: Array<{ kind: 'image' | 'video'; image_url: string | null; video_id: string | Video | null }>
  visibility: 'public' | 'community'
  status: 'published' | 'flagged' | 'removed'
  like_count: number
  comment_count: number
  liked_by_viewer?: boolean
  created_at: string
}

export interface CommunityComment {
  _id: string
  post_id: string
  author_id: string | CommunityAuthor
  body: string
  status: 'published' | 'removed'
  created_at: string
}

export const communityService = {
  async listFeed(params: { cursor?: string; limit?: number } = {}) {
    const search = new URLSearchParams()
    if (params.cursor) search.set('cursor', params.cursor)
    if (params.limit) search.set('limit', String(params.limit))
    const qs = search.toString()
    const { data } = await apiClient.get<{ items: CommunityPost[]; next_cursor: string | null }>(
      `/community/posts${qs ? `?${qs}` : ''}`
    )
    return data
  },
  async createPost(body: string, media: CommunityPost['media'] = [], visibility: 'public' | 'community' = 'public') {
    const { data } = await apiClient.post<{ data: CommunityPost }>('/community/posts', {
      body,
      media,
      visibility,
    })
    return data.data
  },
  async deletePost(id: string) {
    await apiClient.delete(`/community/posts/${encodeURIComponent(id)}`)
  },
  async toggleLike(postId: string): Promise<{ liked: boolean; like_count: number }> {
    const { data } = await apiClient.post<{ data: { liked: boolean; like_count: number } }>(
      `/community/posts/${encodeURIComponent(postId)}/like`
    )
    return data.data
  },
  async listComments(postId: string, params: { cursor?: string; limit?: number } = {}) {
    const search = new URLSearchParams()
    if (params.cursor) search.set('cursor', params.cursor)
    if (params.limit) search.set('limit', String(params.limit))
    const qs = search.toString()
    const { data } = await apiClient.get<{ items: CommunityComment[]; next_cursor: string | null }>(
      `/community/posts/${encodeURIComponent(postId)}/comments${qs ? `?${qs}` : ''}`
    )
    return data
  },
  async createComment(postId: string, body: string): Promise<CommunityComment> {
    const { data } = await apiClient.post<{ data: CommunityComment }>(
      `/community/posts/${encodeURIComponent(postId)}/comments`,
      { body }
    )
    return data.data
  },
  async deleteComment(commentId: string) {
    await apiClient.delete(`/community/comments/${encodeURIComponent(commentId)}`)
  },
}
