'use client'

import React from 'react'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import { Lock, Bell, Eye, ArrowRight, Link2 } from 'lucide-react'
import { honestNeed } from '@/features/profile/theme'
import type { ProfileDashboard, PrivacySettings } from '@/types/profile'
import { useUpdateProfile } from '@/api/hooks/useProfile'
import { SectionCard, SectionTitle, GhostLink } from '../shared'
import SocialLinksCard from '@/components/profile/SocialLinksCard'

/**
 * Settings tab â€” privacy controls (wired to PATCH /users/me/profile) plus
 * deep-links to dedicated password & notification-preference pages.
 */
export function SettingsTab({ data }: { data: ProfileDashboard }) {
  const update = useUpdateProfile()
  const privacy = data.privacy

  const toggle = (key: keyof PrivacySettings, value: boolean) => {
    update.mutate(
      { privacy: { [key]: value } },
      { onSuccess: () => toast.success('Privacy updated') }
    )
  }

  const setVisibility = (value: 'public' | 'private') => {
    update.mutate(
      { privacy: { profile_visibility: value } },
      { onSuccess: () => toast.success('Visibility updated') }
    )
  }

  return (
    <Stack>
      <SectionCard>
        <SectionTitle><Eye size={16} color={honestNeed.colors.primary} /> Privacy</SectionTitle>

        <Field>
          <FieldLabel>Profile visibility</FieldLabel>
          <Segmented>
            <Seg $active={privacy.profile_visibility === 'public'} onClick={() => setVisibility('public')}>
              Public
            </Seg>
            <Seg $active={privacy.profile_visibility === 'private'} onClick={() => setVisibility('private')}>
              Private
            </Seg>
          </Segmented>
        </Field>

        <Toggle label="Show impact stats on public profile" checked={privacy.show_stats} onChange={(v) => toggle('show_stats', v)} />
        <Toggle label="Show donation history" checked={privacy.show_donations} onChange={(v) => toggle('show_donations', v)} />
        <Toggle label="Show my location" checked={privacy.show_location} onChange={(v) => toggle('show_location', v)} />
        <Toggle label="Show activity feed" checked={privacy.show_activity_feed} onChange={(v) => toggle('show_activity_feed', v)} />
      </SectionCard>

      <SectionCard>
        <SectionTitle><Bell size={16} color={honestNeed.colors.accentDark} /> Notifications</SectionTitle>
        <LinkRow>
          <span>Manage email, push and in-app notification preferences.</span>
          <GhostLink href="/creator/settings">Open settings <ArrowRight size={15} /></GhostLink>
        </LinkRow>
      </SectionCard>

      <SectionCard>
        <SectionTitle><Lock size={16} color={honestNeed.colors.love} /> Security</SectionTitle>
        <LinkRow>
          <span>Change your password and manage account access.</span>
          <GhostLink href="/creator/settings">Change password <ArrowRight size={15} /></GhostLink>
        </LinkRow>
      </SectionCard>

      {/* Social & custom links — the destination for the "Add your social
          links" feature-spotlight tile on /whats-new. */}
      <SectionCard id="social-links">
        <SectionTitle>
          <Link2 size={16} color={honestNeed.colors.primary} />
          Social &amp; custom links
        </SectionTitle>
        <p style={{ margin: '0 0 14px', fontSize: '0.88rem', color: honestNeed.colors.mutedText }}>
          Instagram, TikTok, YouTube, LinkedIn, X — plus up to 5 named custom links.
          Shown on your public profile and campaign pages.
        </p>
        <SocialLinksCard />
      </SectionCard>
    </Stack>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <ToggleRow>
      <ToggleLabel>{label}</ToggleLabel>
      <Switch
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        $on={checked}
        onClick={() => onChange(!checked)}
      >
        <Knob $on={checked} />
      </Switch>
    </ToggleRow>
  )
}

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`
const Field = styled.div`
  margin-bottom: 16px;
`
const FieldLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${honestNeed.colors.text};
  margin-bottom: 8px;
`
const Segmented = styled.div`
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: ${honestNeed.colors.disabled};
`
const Seg = styled.button<{ $active: boolean }>`
  padding: 7px 20px;
  border: none;
  border-radius: 999px;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
  color: ${({ $active }) => ($active ? '#fff' : honestNeed.colors.mutedText)};
  background: ${({ $active }) => ($active ? honestNeed.colors.primary : 'transparent')};
  transition: all 150ms ease;
`
const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid ${honestNeed.colors.border};
`
const ToggleLabel = styled.span`
  font-size: 0.88rem;
  color: ${honestNeed.colors.text};
`
const Switch = styled.button<{ $on: boolean }>`
  position: relative;
  width: 44px;
  height: 25px;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: ${({ $on }) => ($on ? honestNeed.colors.success : honestNeed.colors.divider)};
  transition: background 200ms ease;
`
const Knob = styled.span<{ $on: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ $on }) => ($on ? '22px' : '3px')};
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #fff;
  transition: left 200ms ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`
const LinkRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.88rem;
  color: ${honestNeed.colors.mutedText};
`

export default SettingsTab
