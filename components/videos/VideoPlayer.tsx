'use client'

/**
 * VideoPlayer — HLS with MP4 fallback.
 *
 * iOS Safari plays HLS natively via <video src="...m3u8">; other browsers need
 * hls.js. We dynamically import hls.js only when needed to keep the main
 * bundle lean.
 *
 * Accessibility:
 *   - Native <video controls> provides the full keyboard contract
 *   - Captions wired via <track kind="captions"> when the server supplies one
 *   - aria-label describes the video for screen readers
 *   - Autoplay OFF by default (motion/data respect)
 */

import { useEffect, useMemo, useRef } from 'react'

interface Props {
  hlsUrl?: string | null
  mp4Url?: string | null
  thumbnailUrl?: string | null
  title: string
  captionsUrl?: string | null
  autoPlay?: boolean
  muted?: boolean
  width?: number | string
  height?: number | string
}

function supportsNativeHls(video: HTMLVideoElement) {
  return video.canPlayType('application/vnd.apple.mpegurl') !== ''
}

export default function VideoPlayer({
  hlsUrl,
  mp4Url,
  thumbnailUrl,
  title,
  captionsUrl,
  autoPlay = false,
  muted = false,
  width = '100%',
  height,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const preferHls = useMemo(() => !!hlsUrl, [hlsUrl])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !preferHls || !hlsUrl) return undefined

    if (supportsNativeHls(el)) {
      el.src = hlsUrl
      return undefined
    }

    let destroyed = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null
    import('hls.js')
      .then((mod) => {
        if (destroyed) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Hls: any = (mod as any).default || mod
        if (Hls && Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: false })
          hls.loadSource(hlsUrl)
          hls.attachMedia(el)
        } else if (mp4Url) {
          el.src = mp4Url
        }
      })
      .catch(() => {
        // hls.js failed to load — fall back to mp4 if available.
        if (mp4Url) el.src = mp4Url
      })

    return () => {
      destroyed = true
      if (hls && typeof hls.destroy === 'function') hls.destroy()
    }
  }, [hlsUrl, mp4Url, preferHls])

  return (
    <video
      ref={videoRef}
      controls
      preload="metadata"
      autoPlay={autoPlay}
      muted={muted || autoPlay}
      playsInline
      poster={thumbnailUrl || undefined}
      aria-label={title}
      style={{
        width,
        height: height || 'auto',
        background: '#000',
        borderRadius: 8,
        display: 'block',
      }}
      // When HLS isn't present, use direct MP4 src as fallback.
      src={!preferHls ? mp4Url || undefined : undefined}
    >
      {captionsUrl && (
        <track kind="captions" src={captionsUrl} srcLang="en" label="English" default />
      )}
      Your browser does not support the video element.
    </video>
  )
}
