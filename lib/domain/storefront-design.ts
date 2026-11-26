/**
 * The per-tenant design layer: the small decisions that sit on top of a theme.
 *
 * A theme chooses the layout (editorial, ledger, gallery); the brand colour
 * chooses the hue. These tokens are what an owner reaches for next — a second
 * accent colour, how square the corners are, how much air sits between sections,
 * how tall the opening is, what the main button says, and the line above the
 * page. Every value is optional and resolves to the shipped look, so a tenant
 * that never opens this panel renders exactly as before.
 *
 * Pure, so the studio and the public renderer read one set of rules.
 */

export type StorefrontSurface = 'theme' | 'canvas' | 'paper'
export type StorefrontCorners = 'sharp' | 'soft' | 'round'
export type StorefrontSpacing = 'compact' | 'regular' | 'airy'
export type StorefrontHeroHeight = 'short' | 'medium' | 'tall'

export interface StorefrontDesign {
  /** Null keeps the theme's shipped overline colour. */
  accent: string | null
  surface: StorefrontSurface
  corners: StorefrontCorners
  spacing: StorefrontSpacing
  heroHeight: StorefrontHeroHeight
  /** Replaces "Ask for a quote" everywhere the page asks for one. */
  ctaLabel: string | null
  /** One line above the opening, e.g. "Bookings open for December". */
  announcement: string | null
  /** Digits only, country code included: 919843155210. */
  whatsapp: string | null
  /** Handle without the @, e.g. tinueventer. */
  instagram: string | null
  email: string | null
}

export const DESIGN_DEFAULTS: StorefrontDesign = {
  accent: null,
  surface: 'theme',
  corners: 'soft',
  spacing: 'regular',
  heroHeight: 'medium',
  ctaLabel: null,
  announcement: null,
  whatsapp: null,
  instagram: null,
  email: null,
}

export const CORNER_RADIUS: Record<StorefrontCorners, string> = {
  sharp: '0.25rem',
  soft: '1rem',
  round: '1.75rem',
}

export const SECTION_SPACE: Record<StorefrontSpacing, string> = {
  compact: '2.75rem',
  regular: '3.5rem',
  airy: '5rem',
}

export const HERO_HEIGHT: Record<StorefrontHeroHeight, string> = {
  short: '24rem',
  medium: '30rem',
  tall: '38rem',
}

/** Overline colour for a theme when the owner has not chosen one. */
export function defaultAccent(theme: string): string {
  return theme === 'ledger' ? '#c56e4e' : '#8a6524'
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function record(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ').slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/** Strip a pasted instagram URL or @ down to a handle. */
function handleOf(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '')
    .toLowerCase()
  return /^[a-z0-9._]{2,30}$/.test(cleaned) ? cleaned : null
}

/** A dialable WhatsApp number: digits only, country code included. */
function phoneDigits(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

/** Every read of the stored or snapshotted design passes through here. */
export function resolveDesign(raw: unknown): StorefrontDesign {
  const value = record(raw)
  const accent = typeof value.accent === 'string' && HEX_RE.test(value.accent) ? value.accent : null
  const email = text(value.email, 120)

  return {
    accent,
    surface: oneOf(value.surface, ['theme', 'canvas', 'paper'], DESIGN_DEFAULTS.surface),
    corners: oneOf(value.corners, ['sharp', 'soft', 'round'], DESIGN_DEFAULTS.corners),
    spacing: oneOf(value.spacing, ['compact', 'regular', 'airy'], DESIGN_DEFAULTS.spacing),
    heroHeight: oneOf(
      value.heroHeight,
      ['short', 'medium', 'tall'],
      DESIGN_DEFAULTS.heroHeight,
    ),
    ctaLabel: text(value.ctaLabel, 40),
    announcement: text(value.announcement, 120),
    whatsapp: phoneDigits(value.whatsapp),
    instagram: handleOf(value.instagram),
    email: email && EMAIL_RE.test(email) ? email : null,
  }
}

/** CSS variables one wrapper sets for the whole page. */
export function designStyle(design: StorefrontDesign, theme: string): Record<string, string> {
  return {
    '--brand-accent': design.accent ?? defaultAccent(theme),
    '--radius-card': CORNER_RADIUS[design.corners],
  }
}

/** Only a deliberate choice changes the theme's own page background. */
export function surfaceClass(design: StorefrontDesign, themePage: string): string {
  if (design.surface === 'canvas') return 'bg-canvas'
  if (design.surface === 'paper') return 'bg-paper'
  return themePage
}

/**
 * Section rhythm as an override class. `regular` returns null so the theme's own
 * responsive spacing is kept exactly as shipped.
 */
export function spacingClass(design: StorefrontDesign): string | null {
  // Tailwind v4 puts the important marker at the end; the theme's responsive
  // padding is a utility too, so without it the override would lose.
  if (design.spacing === 'compact') return 'py-10!'
  if (design.spacing === 'airy') return 'py-24!'
  return null
}

/** Hero height, or null for the theme's own height. */
export function heroMinHeight(design: StorefrontDesign): string | null {
  if (design.heroHeight === 'short') return HERO_HEIGHT.short
  if (design.heroHeight === 'tall') return HERO_HEIGHT.tall
  return null
}

export function whatsappUrl(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}`
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`
}
