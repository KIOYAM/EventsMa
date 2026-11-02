import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Initials for avatar chips: "Annapoorna Signature Catering" -> "AS". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

/** Locale-stable short date for lists ("12 Feb 2026"). */
export function shortDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

export function relativeDays(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const today = new Date()
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfValue = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const days = Math.round((startOfValue - startOfToday) / 86_400_000)

  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`
}

/** Slug for public profile URLs. ASCII-only, stable, no accents. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
