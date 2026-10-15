import {
  Sparkles, ArrowUpCircle, HandHeart, TrendingUp, ShieldCheck, Rocket,
  Gift, MessageSquare, Globe, Siren, HeartHandshake, BadgeCheck,
  type LucideIcon,
} from 'lucide-react'

// The backend sends an icon NAME; the frontend owns the component mapping.
// A missing icon falls back to Sparkles rather than throwing.
const MAP: Record<string, LucideIcon> = {
  Sparkles,
  ArrowUpCircle,
  HandHeart,
  TrendingUp,
  ShieldCheck,
  Rocket,
  Gift,
  MessageSquare,
  Globe,
  Siren,
  HeartHandshake,
  BadgeCheck,
}

export function resolveIcon(name: string): LucideIcon {
  return MAP[name] || Sparkles
}

export const ACCENT_MAP: Record<string, string> = {
  red: '#C0392B',
  blue: '#1A5FA8',
  green: '#1A7A4A',
  amber: '#D4870A',
  ink: '#18171A',
}
export function resolveAccent(name: string): string {
  return ACCENT_MAP[name] || ACCENT_MAP.red
}
