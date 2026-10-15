'use client'

/**
 * /videos/upload — direct-to-Cloudinary signed upload + metadata registration.
 *
 * Flow:
 *   1. User picks a file (drag-and-drop or click).
 *   2. Form fetches a signed upload token from /api/videos/sign-upload.
 *   3. File posts DIRECTLY to Cloudinary (Node never streams it).
 *   4. Metadata is sent to /api/videos; backend creates the row and in dev
 *      auto-promotes it to `published` so the feed picks it up without
 *      waiting on a webhook.
 */

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import {
  Sparkles,
  ArrowLeft,
  UploadCloud,
  Film,
  CheckCircle2,
  X,
  ShieldCheck,
  Send,
} from 'lucide-react'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { videoService, uploadFileToCloudinary } from '@/services/videoService'
import { tk, DashboardGlobalStyle, fadeDown } from '@/styles/dashboardTokens'

const ACCEPT_MIME = 'video/mp4,video/quicktime,video/webm'
const MAX_SIZE_MB = 500
const MAX_TITLE = 200
const MAX_DESCRIPTION = 10_000

// ─── Page shell ───────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: ${tk.canvas};
  font-family: 'DM Sans', sans-serif;
  color: ${tk.body};
`

const Hero = styled.header`
  background: ${tk.canvas};
  border-bottom: 2px solid ${tk.blue};
  padding: 24px 16px 20px;
  @media (min-width: 640px) { padding: 32px 24px 24px; }
  @media (min-width: 1024px) { padding: 40px 32px 28px; }
`

const HeroInner = styled.div`
  max-width: 820px;
  margin: 0 auto;
  animation: ${fadeDown} 400ms ease both;
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
  text-decoration: none;
  margin-bottom: 12px;
  transition: color 180ms;

  &:hover { color: ${tk.blue}; }
`

const HeroEyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${tk.amberDark};
  background: ${tk.amberLight};
  padding: 4px 12px;
  border-radius: 999px;
  margin: 0 0 12px;
`

const HeroTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, ${tk.heading} 0%, ${tk.blue} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 6px;
  letter-spacing: -0.5px;
  line-height: 1.2;
  @media (min-width: 640px) { font-size: 2rem; }
  @media (min-width: 1024px) { font-size: 2.4rem; }
`

const HeroSub = styled.p`
  font-size: 0.9rem;
  color: ${tk.muted};
  margin: 0;
  line-height: 1.5;
  max-width: 60ch;
  @media (min-width: 640px) { font-size: 1rem; }
`

const ContentWrap = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 20px 12px 48px;
  @media (min-width: 640px) { padding: 24px 20px 56px; }
  @media (min-width: 1024px) { padding: 32px 32px 64px; }
`

// ─── Dropzone ────────────────────────────────────────────────────────────────
const Dropzone = styled.label<{ $hover: boolean; $hasFile: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 24px;
  background: ${(p) => (p.$hover || p.$hasFile ? tk.blueLight : tk.white)};
  border: 1.5px dashed ${(p) => (p.$hover || p.$hasFile ? tk.blue : tk.border)};
  border-radius: 14px;
  cursor: pointer;
  text-align: center;
  color: ${tk.body};
  transition: all 180ms;

  &:hover { border-color: ${tk.blue}; background: ${tk.blueLight}; }

  svg { color: ${tk.blue}; }
`

const DropzoneTitle = styled.p`
  font-family: 'Syne', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: ${tk.heading};
  margin: 0;
`

const DropzoneHint = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${tk.muted};
  margin: 0;
`

const FileChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: ${tk.white};
  border: 1.5px solid ${tk.blue};
  border-radius: 10px;
  color: ${tk.body};
  margin-top: 12px;
  max-width: 100%;
`

const FileName = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.82rem;
  color: ${tk.heading};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
`

const FileSize = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: ${tk.muted};
`

const FileRemove = styled.button`
  background: transparent;
  border: none;
  color: ${tk.muted};
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  display: flex;
  &:hover { color: #B5341E; background: #FBE8DC; }
`

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

// ─── Form fields ─────────────────────────────────────────────────────────────
const Field = styled.div`
  margin-top: 20px;
`

const Label = styled.label`
  display: block;
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${tk.heading};
  margin-bottom: 6px;
`

const Input = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: 1.5px solid ${tk.border};
  border-radius: 12px;
  background: ${tk.white};
  color: ${tk.body};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  transition: all 180ms;

  &::placeholder { color: ${tk.muted}; }
  &:focus { outline: none; border-color: ${tk.blue}; box-shadow: 0 0 0 4px ${tk.blueLight}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const Textarea = styled.textarea`
  width: 100%;
  min-height: 110px;
  padding: 12px 14px;
  border: 1.5px solid ${tk.border};
  border-radius: 12px;
  background: ${tk.white};
  color: ${tk.body};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  resize: vertical;
  transition: all 180ms;

  &::placeholder { color: ${tk.muted}; }
  &:focus { outline: none; border-color: ${tk.blue}; box-shadow: 0 0 0 4px ${tk.blueLight}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`

const CharCount = styled.p`
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${tk.muted};
  margin: 6px 0 0;
  text-align: right;
`

const VeteranToggle = styled.label<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${(p) => (p.$on ? tk.blueLight : tk.white)};
  border: 1.5px solid ${(p) => (p.$on ? tk.blue : tk.border)};
  border-radius: 12px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 180ms;

  &:hover { border-color: ${tk.blue}; }

  input { position: absolute; opacity: 0; pointer-events: none; }

  .box {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid ${(p) => (p.$on ? tk.blue : tk.border)};
    background: ${(p) => (p.$on ? tk.blue : 'transparent')};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${tk.white};
    flex-shrink: 0;
    transition: all 180ms;
  }

  .text {
    flex: 1;
    strong {
      display: block;
      font-family: 'Syne', sans-serif;
      font-size: 0.9rem;
      color: ${tk.heading};
    }
    span {
      display: block;
      font-size: 0.8rem;
      color: ${tk.muted};
      margin-top: 2px;
    }
  }
`

// ─── Progress bar ────────────────────────────────────────────────────────────
const ProgressWrap = styled.div`
  margin-top: 20px;
  padding: 14px 16px;
  background: ${tk.blueLight};
  border: 1px solid ${tk.blue};
  border-radius: 12px;
`

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 0.78rem;
  color: ${tk.blue};
  font-weight: 500;
`

const ProgressTrack = styled.div`
  height: 6px;
  background: ${tk.white};
  border-radius: 999px;
  overflow: hidden;
`

const ProgressBar = styled.div<{ $pct: number }>`
  width: ${(p) => Math.max(0, Math.min(100, p.$pct))}%;
  height: 100%;
  background: linear-gradient(90deg, ${tk.blue} 0%, #0d4a8c 100%);
  border-radius: 999px;
  transition: width 180ms linear;
`

// ─── Actions ─────────────────────────────────────────────────────────────────
const Actions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 28px;
  flex-wrap: wrap;
`

const SubmitBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 22px;
  border-radius: 12px;
  border: none;
  background: ${tk.blue};
  color: ${tk.white};
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(26, 95, 168, 0.2);
  transition: all 180ms;

  &:hover:not(:disabled) {
    background: #0d4a8c;
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.26);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`

const CancelBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 46px;
  padding: 0 22px;
  border-radius: 12px;
  border: 1.5px solid ${tk.border};
  background: ${tk.white};
  color: ${tk.body};
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms;
  &:hover { border-color: ${tk.blue}; color: ${tk.blue}; background: ${tk.blueLight}; }
`

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Component ───────────────────────────────────────────────────────────────
function UploadInner() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isVeteran, setIsVeteran] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [working, setWorking] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const acceptFile = (f: File | null) => {
    if (!f) return
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large — max ${MAX_SIZE_MB} MB.`)
      return
    }
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
  }

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files && e.target.files[0])
  }

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files && e.dataTransfer.files[0])
  }

  const onCancel = () => {
    abortRef.current?.abort()
    setFile(null)
    setProgress(null)
    setWorking(false)
    abortRef.current = null
  }

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { toast.error('Pick a video file first.'); return }
    if (!title.trim()) { toast.error('Give it a title.'); return }

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
        // Pass the stored id (folder + leaf) so the backend can look the
        // asset up on Cloudinary. Falls back to public_id for older signers.
        public_id: sign.stored_public_id || sign.public_id,
        title: title.trim(),
        description: description.trim(),
        is_veteran: isVeteran,
      })
      toast.success('Uploaded — your video is live.')
      router.push(`/videos/${video._id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      toast.error(message)
      setWorking(false)
      setProgress(null)
    }
  }, [description, file, isVeteran, router, title])

  return (
    <Page>
      <DashboardGlobalStyle />

      <Hero>
        <HeroInner>
          <BackLink href="/videos">
            <ArrowLeft size={12} />
            Back to videos
          </BackLink>
          <HeroEyebrow>
            <Sparkles size={12} />
            Share your story
          </HeroEyebrow>
          <HeroTitle>Upload a video</HeroTitle>
          <HeroSub>
            Share a short clip with the HonestNeed community. MP4, MOV, or WebM up to {MAX_SIZE_MB} MB.
          </HeroSub>
        </HeroInner>
      </Hero>

      <ContentWrap>
        <form onSubmit={onSubmit}>
          <Dropzone
            $hover={dragOver}
            $hasFile={!!file}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {file ? (
              <>
                <CheckCircle2 size={36} />
                <DropzoneTitle>File ready</DropzoneTitle>
                <DropzoneHint>Click or drop again to replace</DropzoneHint>
              </>
            ) : (
              <>
                <UploadCloud size={40} />
                <DropzoneTitle>Click to pick a video, or drop one here</DropzoneTitle>
                <DropzoneHint>MP4, MOV, WebM · up to {MAX_SIZE_MB} MB</DropzoneHint>
              </>
            )}
            <HiddenInput
              type="file"
              accept={ACCEPT_MIME}
              onChange={onFile}
              disabled={working}
            />
          </Dropzone>

          {file && (
            <FileChip>
              <Film size={16} />
              <FileName title={file.name}>{file.name}</FileName>
              <FileSize>{formatSize(file.size)}</FileSize>
              {!working && (
                <FileRemove type="button" onClick={() => setFile(null)} aria-label="Remove file">
                  <X size={14} />
                </FileRemove>
              )}
            </FileChip>
          )}

          <Field>
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              placeholder="A short, searchable headline"
              maxLength={MAX_TITLE}
              disabled={working}
            />
            <CharCount>{title.length} / {MAX_TITLE}</CharCount>
          </Field>

          <Field>
            <Label htmlFor="video-description">Description</Label>
            <Textarea
              id="video-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
              placeholder="Tell viewers what the video is about."
              maxLength={MAX_DESCRIPTION}
              disabled={working}
            />
            <CharCount>{description.length.toLocaleString()} / {MAX_DESCRIPTION.toLocaleString()}</CharCount>
          </Field>

          <VeteranToggle $on={isVeteran}>
            <input
              type="checkbox"
              checked={isVeteran}
              onChange={(e) => setIsVeteran(e.target.checked)}
              disabled={working}
            />
            <span className="box">{isVeteran && <CheckCircle2 size={12} />}</span>
            <span className="text">
              <strong>
                <ShieldCheck size={13} style={{ verticalAlign: 'middle', marginRight: 4, color: tk.blue }} />
                Veteran-focused content
              </strong>
              <span>Flags the video for the veterans-first ordering across HonestNeed.</span>
            </span>
          </VeteranToggle>

          {progress !== null && (
            <ProgressWrap role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <ProgressHeader>
                <span>Uploading to Cloudinary…</span>
                <span>{progress}%</span>
              </ProgressHeader>
              <ProgressTrack>
                <ProgressBar $pct={progress} />
              </ProgressTrack>
            </ProgressWrap>
          )}

          <Actions>
            <SubmitBtn type="submit" disabled={working || !file || !title.trim()}>
              <Send size={16} />
              {working ? `Uploading… ${progress ?? 0}%` : 'Upload video'}
            </SubmitBtn>
            {working && (
              <CancelBtn type="button" onClick={onCancel}>
                Cancel upload
              </CancelBtn>
            )}
          </Actions>
        </form>
      </ContentWrap>
    </Page>
  )
}

export default function VideoUploadPage() {
  return (
    <ProtectedRoute>
      <UploadInner />
    </ProtectedRoute>
  )
}
