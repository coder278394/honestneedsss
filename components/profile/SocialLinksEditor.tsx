'use client'

/**
 * SocialLinksEditor — profile card for social + custom links.
 *
 * Rendered inside the Settings tab of /profile and themed with the same
 * honestNeed design tokens as the rest of the profile dashboard (warm-amber +
 * ink, Syne headings, DM Sans body).
 *
 * Validation (mirrors the backend ProfileService):
 *   - https:// only
 *   - up to 200 chars per URL
 *   - up to 10 social_links, 5 other_links
 *   - other.label required, 1..40 chars
 *
 * Submission goes through apiClient to PATCH /users/me/profile.
 */

import { useId, useMemo, useState } from 'react'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import {
  Link2,
  Plus,
  Trash2,
  Save,
} from 'lucide-react'
import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaTwitter,
  FaLinkedinIn,
  FaTiktok,
  FaYoutube,
  FaTwitch,
  FaThreads,
} from 'react-icons/fa6'

import { apiClient } from '@/lib/api'
import { honestNeed } from '@/features/profile/theme'

type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'x'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'twitch'
  | 'threads'

interface SocialLink { platform: SocialPlatform; url: string }
interface OtherLink { label: string; url: string }

interface Props {
  initialSocial?: SocialLink[]
  initialOther?: OtherLink[]
  initialPrimary?: string | null
  onSaved?: () => void
}

const PLATFORMS: { id: SocialPlatform; label: string; placeholder: string }[] = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { id: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourhandle' },
  { id: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourchannel' },
  { id: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/yourpage' },
  { id: 'twitter',   label: 'Twitter',   placeholder: 'https://twitter.com/yourhandle' },
  { id: 'x',         label: 'X',         placeholder: 'https://x.com/yourhandle' },
  { id: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/you' },
  { id: 'twitch',    label: 'Twitch',    placeholder: 'https://twitch.tv/yourhandle' },
  { id: 'threads',   label: 'Threads',   placeholder: 'https://threads.net/@yourhandle' },
]

function PlatformIcon({ platform, size = 16 }: { platform: SocialPlatform; size?: number }) {
  switch (platform) {
    case 'facebook':  return <FaFacebookF  size={size} />
    case 'instagram': return <FaInstagram  size={size} />
    case 'twitter':   return <FaTwitter    size={size} />
    case 'x':         return <FaXTwitter   size={size} />
    case 'linkedin':  return <FaLinkedinIn size={size} />
    case 'youtube':   return <FaYoutube    size={size} />
    case 'twitch':    return <FaTwitch     size={size} />
    case 'tiktok':    return <FaTiktok     size={size} />
    case 'threads':   return <FaThreads    size={size} />
  }
}

function isValidUrl(url: string) {
  if (!url) return false
  if (url.length > 200) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:'
  } catch { return false }
}

// ─── Styled bits (profile `honestNeed` theme) ──────────────────────────────
const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Hint = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${honestNeed.colors.mutedText};
  line-height: 1.5;

  code {
    font-family: 'DM Mono', ui-monospace, monospace;
    font-size: 0.78rem;
    background: ${honestNeed.colors.surfaceAlt};
    padding: 1px 6px;
    border-radius: 4px;
    color: ${honestNeed.colors.text};
  }
`

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const GroupHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`

const GroupTitle = styled.h4`
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${honestNeed.colors.text};
  letter-spacing: -0.2px;
`

const CountChip = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  color: ${honestNeed.colors.mutedText};
  background: ${honestNeed.colors.surfaceAlt};
  padding: 2px 8px;
  border-radius: 999px;
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr auto;
  gap: 10px;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px;
    background: ${honestNeed.colors.surfaceAlt};
    border-radius: 10px;
  }
`

// A field-shaped wrapper that puts a leading icon flush with the input/select
// edge, so the whole row reads as one input instead of a loose icon.
const FieldWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg.lead {
    position: absolute;
    left: 12px;
    color: ${honestNeed.colors.mutedText};
    pointer-events: none;
  }
`

const Select = styled.select`
  width: 100%;
  height: 42px;
  padding: 0 14px 0 38px;
  border: 1.5px solid ${honestNeed.colors.border};
  border-radius: 10px;
  background: ${honestNeed.colors.surface};
  color: ${honestNeed.colors.text};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%238C8790' d='M0 0l5 6 5-6z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 14px center;
  transition: all 180ms;
  cursor: pointer;

  &:focus { outline: none; border-color: ${honestNeed.colors.secondary}; box-shadow: 0 0 0 4px ${honestNeed.colors.secondaryBg}; }
`

const Input = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 14px 0 38px;
  border: 1.5px solid ${honestNeed.colors.border};
  border-radius: 10px;
  background: ${honestNeed.colors.surface};
  color: ${honestNeed.colors.text};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  transition: all 180ms;

  &::placeholder { color: ${honestNeed.colors.muted}; }
  &:focus { outline: none; border-color: ${honestNeed.colors.secondary}; box-shadow: 0 0 0 4px ${honestNeed.colors.secondaryBg}; }
`

const InputPlain = styled(Input)`
  padding: 0 14px;
`

const RemoveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1.5px solid ${honestNeed.colors.border};
  border-radius: 10px;
  background: ${honestNeed.colors.surface};
  color: ${honestNeed.colors.mutedText};
  cursor: pointer;
  transition: all 160ms;

  @media (max-width: 640px) {
    width: 100%;
    gap: 6px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    &::after { content: 'Remove'; }
  }

  &:hover {
    color: ${honestNeed.colors.error};
    border-color: ${honestNeed.colors.error};
    background: ${honestNeed.colors.errorBg};
  }
`

const AddBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1.5px dashed ${honestNeed.colors.secondary};
  background: ${honestNeed.colors.surface};
  color: ${honestNeed.colors.secondary};
  font-family: 'DM Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms;

  &:hover:not(:disabled) {
    background: ${honestNeed.colors.secondaryBg};
    border-style: solid;
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const EmptyRow = styled.p`
  margin: 0;
  padding: 14px 16px;
  background: ${honestNeed.colors.surfaceAlt};
  border: 1px dashed ${honestNeed.colors.border};
  border-radius: 10px;
  color: ${honestNeed.colors.mutedText};
  font-size: 0.85rem;
`

const PrimaryField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PrimaryLabel = styled.label`
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: ${honestNeed.colors.text};
`

const PrimaryHint = styled.span`
  font-size: 0.78rem;
  color: ${honestNeed.colors.mutedText};
  font-weight: 400;
`

const ActionsRow = styled.div`
  display: flex;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid ${honestNeed.colors.divider};
  margin-top: 4px;
`

const SaveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 22px;
  border-radius: 10px;
  border: none;
  background: ${honestNeed.colors.secondary};
  color: #fff;
  font-family: 'Syne', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(26, 95, 168, 0.2);
  transition: all 180ms;

  &:hover:not(:disabled) {
    background: ${honestNeed.colors.secondaryDark};
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(26, 95, 168, 0.26);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
`

// ─── Component ──────────────────────────────────────────────────────────────
export default function SocialLinksEditor({
  initialSocial = [],
  initialOther = [],
  initialPrimary = null,
  onSaved,
}: Props) {
  const [social, setSocial] = useState<SocialLink[]>(initialSocial)
  const [other, setOther] = useState<OtherLink[]>(initialOther)
  const [primary, setPrimary] = useState<string>(initialPrimary || '')
  const [saving, setSaving] = useState(false)
  const idPrefix = useId()

  const addSocial = () => {
    if (social.length >= 10) return toast.info('Up to 10 social links.')
    setSocial((s) => [...s, { platform: 'instagram', url: '' }])
  }
  const addOther = () => {
    if (other.length >= 5) return toast.info('Up to 5 other links.')
    setOther((o) => [...o, { label: '', url: '' }])
  }

  const updateSocial = (idx: number, patch: Partial<SocialLink>) =>
    setSocial((s) => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)))
  const updateOther = (idx: number, patch: Partial<OtherLink>) =>
    setOther((o) => o.map((row, i) => (i === idx ? { ...row, ...patch } : row)))

  const removeSocial = (idx: number) => setSocial((s) => s.filter((_, i) => i !== idx))
  const removeOther = (idx: number) => setOther((o) => o.filter((_, i) => i !== idx))

  const platformPlaceholder = (p: SocialPlatform) =>
    PLATFORMS.find((x) => x.id === p)?.placeholder || 'https://…'

  const onSave = async () => {
    const invalidSocial = social.some((row) => !isValidUrl(row.url))
    const invalidOther = other.some(
      (row) => !row.label.trim() || row.label.length > 40 || !isValidUrl(row.url)
    )
    if (invalidSocial || invalidOther) {
      toast.error('Fix invalid URLs (https only, up to 200 chars) and ensure labels are set.')
      return
    }
    setSaving(true)
    try {
      await apiClient.patch('/users/me/profile', {
        social_links: social,
        other_links: other,
        primary_social_platform: primary || null,
      })
      toast.success('Links saved.')
      onSaved?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const primaryChoices = useMemo(
    () => [
      { value: '', label: '— choose —' },
      ...PLATFORMS.map((p) => ({ value: p.id, label: p.label })),
      { value: 'other', label: 'Other / custom link' },
    ],
    []
  )

  return (
    <Wrap aria-labelledby={`${idPrefix}-h`}>
      <Hint id={`${idPrefix}-h`}>
        Add up to 10 social profiles and 5 custom links. URLs must start with <code>https://</code>.
      </Hint>

      <Group>
        <GroupHeader>
          <GroupTitle>Social</GroupTitle>
          <CountChip>{social.length} / 10</CountChip>
        </GroupHeader>

        {social.length === 0 && (
          <EmptyRow>No social links yet. Pick a platform below.</EmptyRow>
        )}

        {social.map((row, i) => (
          <Row key={i}>
            <FieldWrap>
              <span className="lead"><PlatformIcon platform={row.platform} /></span>
              <Select
                value={row.platform}
                onChange={(e) => updateSocial(i, { platform: e.target.value as SocialPlatform })}
                aria-label="Platform"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </Select>
            </FieldWrap>
            <FieldWrap>
              <span className="lead"><Link2 size={16} /></span>
              <Input
                type="url"
                value={row.url}
                onChange={(e) => updateSocial(i, { url: e.target.value })}
                placeholder={platformPlaceholder(row.platform)}
                maxLength={200}
                aria-label={`${row.platform} URL`}
              />
            </FieldWrap>
            <RemoveBtn type="button" onClick={() => removeSocial(i)} aria-label="Remove social link">
              <Trash2 size={16} />
            </RemoveBtn>
          </Row>
        ))}

        <AddBtn type="button" onClick={addSocial} disabled={social.length >= 10}>
          <Plus size={14} />
          Add social link
        </AddBtn>
      </Group>

      <Group>
        <GroupHeader>
          <GroupTitle>Custom links</GroupTitle>
          <CountChip>{other.length} / 5</CountChip>
        </GroupHeader>

        {other.length === 0 && (
          <EmptyRow>No custom links yet. Portfolios, newsletters, press pages — anything with an https URL.</EmptyRow>
        )}

        {other.map((row, i) => (
          <Row key={i}>
            <InputPlain
              type="text"
              value={row.label}
              onChange={(e) => updateOther(i, { label: e.target.value })}
              placeholder="Label (e.g. Portfolio)"
              maxLength={40}
              aria-label="Label"
            />
            <FieldWrap>
              <span className="lead"><Link2 size={16} /></span>
              <Input
                type="url"
                value={row.url}
                onChange={(e) => updateOther(i, { url: e.target.value })}
                placeholder="https://example.com/page"
                maxLength={200}
                aria-label="Custom URL"
              />
            </FieldWrap>
            <RemoveBtn type="button" onClick={() => removeOther(i)} aria-label="Remove custom link">
              <Trash2 size={16} />
            </RemoveBtn>
          </Row>
        ))}

        <AddBtn type="button" onClick={addOther} disabled={other.length >= 5}>
          <Plus size={14} />
          Add custom link
        </AddBtn>
      </Group>

      <PrimaryField>
        <PrimaryLabel htmlFor={`${idPrefix}-primary`}>
          Primary platform
          <PrimaryHint> &nbsp;·&nbsp; used for share-to-earn syndication</PrimaryHint>
        </PrimaryLabel>
        <FieldWrap>
          <span className="lead"><Link2 size={16} /></span>
          <Select
            id={`${idPrefix}-primary`}
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
          >
            {primaryChoices.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </FieldWrap>
      </PrimaryField>

      <ActionsRow>
        <SaveBtn onClick={onSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving…' : 'Save links'}
        </SaveBtn>
      </ActionsRow>
    </Wrap>
  )
}
