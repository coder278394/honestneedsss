'use client'

/**
 * UploadForm — direct-to-Cloudinary signed upload + metadata registration.
 *
 * Flow:
 *   1. User picks a file.
 *   2. Form fetches a signed upload token from /api/videos/sign-upload.
 *   3. File posts DIRECTLY to Cloudinary (Node never streams it).
 *   4. Metadata is sent to /api/videos; backend stores the row with status
 *      'uploading'. Cloudinary later notifies our webhook, which promotes
 *      the row to 'processing' and (if moderation passes) 'published'.
 *
 * The file size cap in the browser is a UX nicety — the authoritative limits
 * live on the Cloudinary preset and the webhook duration check.
 */

import { useCallback, useId, useRef, useState } from 'react'
import { toast } from 'react-toastify'

import { Button } from '@/components/Button'
import { videoService, uploadFileToCloudinary } from '@/services/videoService'

const ACCEPT_MIME = 'video/mp4,video/quicktime,video/webm'
const MAX_SIZE_MB = 500

export default function UploadForm({ onUploaded }: { onUploaded?: (videoId: string) => void }) {
  const titleId = useId()
  const fileId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isVeteran, setIsVeteran] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [working, setWorking] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const reset = () => {
    setFile(null)
    setTitle('')
    setDescription('')
    setProgress(null)
    setWorking(false)
    abortRef.current = null
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files && e.target.files[0]
    if (!next) return
    if (next.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large — max ${MAX_SIZE_MB} MB.`)
      return
    }
    setFile(next)
    if (!title) setTitle(next.name.replace(/\.[^/.]+$/, ''))
  }

  const onCancel = () => {
    abortRef.current?.abort()
    reset()
  }

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error('Pick a video file first.')
    if (!title.trim()) return toast.error('Give it a title.')

    setWorking(true)
    setProgress(0)
    abortRef.current = new AbortController()

    try {
      const sign = await videoService.signUpload()
      await uploadFileToCloudinary(file, sign, {
        signal: abortRef.current.signal,
        onProgress: (p) => setProgress(p),
      })
      const video = await videoService.create({
        public_id: sign.public_id,
        title: title.trim(),
        description: description.trim(),
        is_veteran: isVeteran,
      })
      toast.success('Uploaded — processing. You will be notified when it is live.')
      onUploaded?.(video._id)
      reset()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      toast.error(message)
      setWorking(false)
      setProgress(null)
    }
  }, [description, file, isVeteran, onUploaded, title])

  return (
    <form onSubmit={onSubmit} aria-label="Upload a video" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor={fileId} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
          Video file
        </label>
        <input
          id={fileId}
          type="file"
          accept={ACCEPT_MIME}
          onChange={onFile}
          disabled={working}
          aria-describedby={`${fileId}-help`}
        />
        <small id={`${fileId}-help`} style={{ display: 'block', color: '#6b7280', marginTop: 4 }}>
          MP4, MOV, or WebM. Up to {MAX_SIZE_MB} MB.
        </small>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor={titleId} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
          Title
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          disabled={working}
          style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor={`${titleId}-desc`} style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
          Description
        </label>
        <textarea
          id={`${titleId}-desc`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={10_000}
          rows={4}
          disabled={working}
          style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 4 }}
        />
      </div>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={isVeteran}
          onChange={(e) => setIsVeteran(e.target.checked)}
          disabled={working}
        />
        <span>This is veteran-focused content</span>
      </label>

      {progress !== null && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ marginBottom: 12, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: 8,
              background: '#2563eb',
              transition: 'width 120ms linear',
            }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Button type="submit" disabled={working || !file}>
          {working ? `Uploading… ${progress ?? 0}%` : 'Upload'}
        </Button>
        {working && (
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
