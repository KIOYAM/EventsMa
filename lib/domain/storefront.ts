/**
 * Storefront section order — pure, so both the public page and the owner
 * builder read the same rules without either importing the other's data layer.
 *
 * A tenant stores only what it has customised. Anything missing falls back to the
 * canonical order below, which means a workspace that has never opened the
 * builder still renders the page it shipped with: opening the builder is not a
 * migration step and cannot break a live storefront.
 */
export const SECTION_KEYS = [
  'hero',
  'about',
  'services',
  'packages',
  'gallery',
  'team',
  'faq',
  'contact',
  'enquiry',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

export const SECTION_LABEL: Record<SectionKey, string> = {
  hero: 'Opening',
  about: 'About us',
  services: 'Services & catalogue',
  packages: 'Packages',
  gallery: 'Recent work',
  team: 'Team',
  faq: 'Questions and answers',
  contact: 'Contact details',
  enquiry: 'Enquiry form',
}

export const SECTION_HINT: Record<SectionKey, string> = {
  hero: 'Name, city, tagline and the opening photograph.',
  about: 'The introduction you wrote for clients, on its own.',
  services: 'Only the services this workspace has adopted, with their catalogue.',
  packages: 'Active packages with their rate basis, set up in the catalogue.',
  gallery: 'Published portfolio entries, newest first by your own order.',
  team: 'Names and roles you add here. Nothing is taken from staff accounts.',
  faq: 'Questions you answer yourself. Rendered as a closed accordion.',
  contact: 'Phone, email and city from your business details.',
  enquiry: 'The form that creates a real enquiry and notifies the owner.',
}

/**
 * Sections whose content the owner writes in the builder itself. Everything they
 * add lives in `storefront_sections.config`, is capped and sanitised here, and is
 * frozen into the published snapshot like any other edit.
 */
export interface StorefrontFaqItem {
  id: string
  question: string
  answer: string
}

export interface StorefrontTeamMember {
  id: string
  name: string
  role: string
}

export interface SectionConfig {
  faq: StorefrontFaqItem[]
  team: StorefrontTeamMember[]
}

/** Twelve entries per section: enough for a real FAQ, small enough to read. */
export const SECTION_CONFIG_MAX_ITEMS = 12

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function emptySectionConfig(): SectionConfig {
  return { faq: [], team: [] }
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function rowOf(entry: unknown): Record<string, unknown> {
  return typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {}
}

function idOf(entry: Record<string, unknown>): string {
  const raw = typeof entry.id === 'string' ? entry.id : ''
  if (UUID_RE.test(raw)) return raw
  // Stable per render is not required: an id only has to address the row while
  // the owner is editing it, and the action validates it as a UUID.
  return crypto.randomUUID()
}

/**
 * Every read of a section's free content passes through here, so a hand-edited
 * row or an old snapshot cannot inject markup or unbounded text into a page.
 */
export function sanitiseSectionConfig(raw: unknown): SectionConfig {
  const value = rowOf(raw)
  const faq = Array.isArray(value.faq) ? value.faq : []
  const team = Array.isArray(value.team) ? value.team : []

  return {
    faq: faq
      .slice(0, SECTION_CONFIG_MAX_ITEMS)
      .map((entry) => {
        const item = rowOf(entry)
        return {
          id: idOf(item),
          question: text(item.question, 160),
          answer: text(item.answer, 600),
        }
      })
      .filter((item) => item.question.length > 0 && item.answer.length > 0),
    team: team
      .slice(0, SECTION_CONFIG_MAX_ITEMS)
      .map((entry) => {
        const item = rowOf(entry)
        return {
          id: idOf(item),
          name: text(item.name, 80),
          role: text(item.role, 80),
        }
      })
      .filter((item) => item.name.length > 0),
  }
}

/**
 * The three storefront designs.
 *
 * A theme is a layout treatment, not a colour scheme: the tenant's own brand
 * colour is applied separately. Swatches reference theme tokens (not hex) so the
 * picker cannot drift from the palette the page actually renders.
 */
export const STOREFRONT_THEMES = [
  {
    key: 'editorial',
    label: 'Editorial',
    description: 'Wide margins, a large serif name, one idea per screen.',
    swatch: ['var(--color-canvas)', 'var(--color-forest)', 'var(--color-mint)'],
  },
  {
    key: 'ledger',
    label: 'Ledger',
    description: 'Ruled rows and small caps: dense, factual, quick to scan.',
    swatch: ['var(--color-paper)', 'var(--color-hairline)', 'var(--color-ink-muted)'],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    description: 'Photograph first: a full-bleed opening image with the name over it.',
    swatch: ['var(--color-forest)', 'var(--color-night)', 'var(--color-cream)'],
  },
] as const

export type StorefrontThemeKey = (typeof STOREFRONT_THEMES)[number]['key']

export const DEFAULT_THEME: StorefrontThemeKey = 'editorial'

/** Unknown or missing values fall back rather than throwing on a public page. */
export function resolveStorefrontTheme(raw: unknown): StorefrontThemeKey {
  const match = STOREFRONT_THEMES.find((theme) => theme.key === raw)
  return match?.key ?? DEFAULT_THEME
}

/**
 * Wordmark typography. Only families the app actually loads are offered, so a
 * choice cannot silently fall back to a different font on the visitor's machine.
 */
export const BRAND_FONTS = [
  { key: 'serif', label: 'Serif wordmark', className: 'font-display' },
  { key: 'sans', label: 'Sans wordmark', className: 'font-sans' },
] as const

export type StorefrontFontKey = (typeof BRAND_FONTS)[number]['key']

export function resolveStorefrontFont(raw: unknown): StorefrontFontKey {
  return BRAND_FONTS.find((font) => font.key === raw)?.key ?? 'serif'
}

export function fontClass(key: StorefrontFontKey): string {
  return BRAND_FONTS.find((font) => font.key === key)?.className ?? 'font-display'
}

/**
 * Starting points for the brand colour. The owner can still pick any colour; these
 * are the four that already exist as tokens so the page looks right immediately.
 */
export const BRAND_COLOURS = [
  { hex: '#183d33', label: 'Forest' },
  { hex: '#c56e4e', label: 'Terracotta' },
  { hex: '#8a6524', label: 'Gold' },
  { hex: '#2f4f7f', label: 'Indigo' },
] as const

/** Used when the owner has not chosen a colour yet. */
export const DEFAULT_BRAND_COLOUR = '#183d33'

/**
 * Owner-facing builder notices.
 *
 * Kept beside the section copy rather than in `lib/i18n`: this surface has not been
 * extracted yet, and inventing a half-populated message module here would leave a
 * second source of truth for the same screen. Extract both together.
 */
export const BUILDER_NOTICE: Record<string, string> = {
  saved: 'Layout saved.',
  published: 'Published. Clients see this version now.',
  restored: 'Restored. That version is live again.',
  publish: 'The page could not be published. Try again.',
  version: 'That version is no longer available.',
  permission: 'Only an owner or manager can change the public page.',
  demo: 'Demo mode is read-only.',
  section: 'That section does not exist.',
  limit: 'You can add up to 12 entries to a section.',
  services: 'Service visibility saved. Publish to show it on the public page.',
  item: 'That entry is no longer there.',
  storage: 'Photo storage is not configured for this environment.',
  image: 'Use a WebP, JPEG or PNG under 400 KB.',
  upload: 'The photo could not be uploaded. Try again.',
}

export interface SectionRecord {
  key: string
  position: number
  visible: boolean
  heading: string | null
  imagePath: string | null
  config?: unknown
}

export interface StorefrontSection {
  key: SectionKey
  position: number
  visible: boolean
  /** An owner's override. `null` means keep the page's own heading. */
  heading: string | null
  imagePath: string | null
  /** FAQ entries and team members the owner wrote for this section. */
  config: SectionConfig
}

function isSectionKey(value: string): value is SectionKey {
  return (SECTION_KEYS as readonly string[]).includes(value)
}

/**
 * Stored rows first, in their chosen order; then any key the tenant has never
 * saved, in canonical order. Hidden sections are returned too — the builder has
 * to show them so they can be switched back on.
 */
export function orderSections(rows: readonly SectionRecord[]): StorefrontSection[] {
  const known = rows
    .filter((row): row is SectionRecord & { key: SectionKey } => isSectionKey(row.key))
    .sort((a, b) => a.position - b.position || a.key.localeCompare(b.key))

  const ordered: StorefrontSection[] = known.map((row, index) => ({
    key: row.key,
    position: index,
    visible: row.visible,
    heading: row.heading,
    imagePath: row.imagePath,
    config: sanitiseSectionConfig(row.config),
  }))

  const seen = new Set(ordered.map((section) => section.key))
  for (const key of SECTION_KEYS) {
    if (seen.has(key)) continue
    ordered.push({
      key,
      position: ordered.length,
      visible: true,
      heading: null,
      imagePath: null,
      config: emptySectionConfig(),
    })
  }

  return ordered
}

/** What the public page renders: the visible prefix, order preserved. */
export function visibleSections(rows: readonly SectionRecord[]): StorefrontSection[] {
  return orderSections(rows).filter((section) => section.visible)
}
