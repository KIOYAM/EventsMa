import {
  DEFAULT_BRAND_COLOUR,
  SECTION_KEYS,
  emptySectionConfig,
  orderSections,
  resolveStorefrontFont,
  resolveStorefrontTheme,
  sanitiseSectionConfig,
  type SectionConfig,
  type SectionKey,
  type StorefrontFontKey,
  type StorefrontSection,
  type StorefrontThemeKey,
} from './storefront'

/**
 * The published storefront snapshot.
 *
 * Publishing freezes exactly the fields a visitor can see into one JSON row.
 * The editor keeps writing normalised draft rows; the public reader trusts this
 * object and nothing else, which is what makes "draft never leaks" a property of
 * the data path rather than a promise in a component.
 *
 * `schemaVersion` exists because snapshots outlive code. A future shape change
 * bumps it and `parseStorefrontSnapshot` returns null for versions it does not
 * understand, so an old version degrades to "no snapshot" (the page keeps
 * working from the draft) instead of rendering half a page.
 */
/**
 * v2 added per-section content (FAQ answers, team names); v3 froze which services
 * the owner chose to show. Older versions are still accepted: their sections carry
 * empty config and their `services` is null, which means "whatever the workspace
 * has enabled" — the behaviour those pages were published with.
 */
export const STOREFRONT_SNAPSHOT_SCHEMA_VERSION = 3
const READABLE_SCHEMA_VERSIONS = [1, 2, 3]

/** One activated service and the owner's decision to show it publicly. */
export interface SnapshotServiceChoice {
  verticalKey: string
  visible: boolean
}

export interface StorefrontSnapshotSection {
  key: SectionKey
  position: number
  visible: boolean
  heading: string | null
  imagePath: string | null
  config: SectionConfig
}

export interface StorefrontSnapshot {
  schemaVersion: number
  identity: {
    name: string
    tagline: string | null
    city: string | null
    phone: string | null
  }
  brand: {
    theme: StorefrontThemeKey
    font: StorefrontFontKey
    primary: string
    subtitle: string | null
    about: string | null
    logoPath: string | null
  }
  sections: StorefrontSnapshotSection[]
  /**
   * The services this version shows. `null` for v1/v2 snapshots, where the answer
   * was "all enabled services" and must stay that way for a page already live.
   */
  services: SnapshotServiceChoice[] | null
  /** ISO timestamp, informational: the pointer in `storefronts` is authoritative. */
  publishedAt: string
}

export interface SnapshotInput {
  name: string
  tagline: string | null
  city: string | null
  phone: string | null
  theme: unknown
  font: unknown
  primary: unknown
  subtitle: string | null
  about: string | null
  logoPath: string | null
  sections: readonly StorefrontSection[]
  /** Activated services with the owner's storefront visibility choice. */
  services: readonly SnapshotServiceChoice[]
}

function trimmed(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim().slice(0, max)
  return text.length > 0 ? text : null
}

function isHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

/** Draft rows in, one immutable snapshot out. Pure: no I/O, so it is testable. */
export function buildStorefrontSnapshot(
  input: SnapshotInput,
  publishedAt: string = new Date().toISOString(),
): StorefrontSnapshot {
  return {
    schemaVersion: STOREFRONT_SNAPSHOT_SCHEMA_VERSION,
    identity: {
      name: input.name.trim().slice(0, 120),
      tagline: trimmed(input.tagline, 200),
      city: trimmed(input.city, 80),
      phone: trimmed(input.phone, 24),
    },
    brand: {
      theme: resolveStorefrontTheme(input.theme),
      font: resolveStorefrontFont(input.font),
      primary: isHex(input.primary) ? input.primary : DEFAULT_BRAND_COLOUR,
      subtitle: trimmed(input.subtitle, 120),
      about: trimmed(input.about, 600),
      logoPath: trimmed(input.logoPath, 400),
    },
    // Canonical order, so a tenant that never touched a section still publishes
    // all four and a future default change reorders the draft, not live sites.
    sections: orderSections(input.sections).map((section) => ({
      key: section.key,
      position: section.position,
      visible: section.visible,
      heading: trimmed(section.heading, 120),
      imagePath: trimmed(section.imagePath, 400),
      config: sanitiseSectionConfig(section.config),
    })),
    services: sanitiseServices(input.services),
    publishedAt,
  }
}

/** Keys are tenant-chosen strings, so they are checked, deduped and capped here. */
function sanitiseServices(
  raw: readonly SnapshotServiceChoice[],
): SnapshotServiceChoice[] {
  const seen = new Set<string>()
  const out: SnapshotServiceChoice[] = []
  for (const entry of raw) {
    const key = typeof entry?.verticalKey === 'string' ? entry.verticalKey.trim().slice(0, 40) : ''
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({ verticalKey: key, visible: entry.visible !== false })
    if (out.length >= 20) break
  }
  return out
}

/**
 * Anything read back from `storefront_versions.snapshot` passes through here.
 * Unknown versions, missing sections and bad colours are all normalised rather
 * than thrown: a broken snapshot must never take a live page down.
 */
export function parseStorefrontSnapshot(raw: unknown): StorefrontSnapshot | null {
  if (typeof raw !== 'object' || raw === null) return null
  const value = raw as Record<string, unknown>

  if (!READABLE_SCHEMA_VERSIONS.includes(Number(value.schemaVersion))) return null
  const identity = value.identity as Record<string, unknown> | undefined
  const brand = value.brand as Record<string, unknown> | undefined
  if (!identity || !brand || typeof identity.name !== 'string') return null
  if (!Array.isArray(value.sections)) return null

  const positions = new Map<string, number>()
  const rawSections = value.sections as Record<string, unknown>[]
  for (const section of rawSections) {
    if (typeof section?.key !== 'string') continue
    if (!(SECTION_KEYS as readonly string[]).includes(section.key)) continue
    positions.set(section.key, typeof section.position === 'number' ? section.position : 0)
  }

  const sections = rawSections
    .filter((section) => typeof section?.key === 'string')
    .filter((section) => (SECTION_KEYS as readonly string[]).includes(section.key as string))
    .map((section) => ({
      key: section.key as SectionKey,
      position: typeof section.position === 'number' ? section.position : 0,
      visible: section.visible !== false,
      heading: trimmed(section.heading, 120),
      imagePath: trimmed(section.imagePath, 400),
      config: section.config === undefined ? emptySectionConfig() : sanitiseSectionConfig(section.config),
    }))

  const rawServices = Array.isArray(value.services) ? (value.services as unknown[]) : null

  return {
    schemaVersion: STOREFRONT_SNAPSHOT_SCHEMA_VERSION,
    services: rawServices
      ? sanitiseServices(
          rawServices.map((entry) => {
            const row = (typeof entry === 'object' && entry !== null ? entry : {}) as Record<
              string,
              unknown
            >
            return {
              verticalKey: typeof row.verticalKey === 'string' ? row.verticalKey : '',
              visible: row.visible !== false,
            }
          }),
        )
      : null,
    identity: {
      name: identity.name.trim().slice(0, 120) || 'Your business',
      tagline: trimmed(identity.tagline, 200),
      city: trimmed(identity.city, 80),
      phone: trimmed(identity.phone, 24),
    },
    brand: {
      theme: resolveStorefrontTheme(brand.theme),
      font: resolveStorefrontFont(brand.font),
      primary: isHex(brand.primary) ? brand.primary : DEFAULT_BRAND_COLOUR,
      subtitle: trimmed(brand.subtitle, 120),
      about: trimmed(brand.about, 600),
      logoPath: trimmed(brand.logoPath, 400),
    },
    sections,
    publishedAt: typeof value.publishedAt === 'string' ? value.publishedAt : new Date(0).toISOString(),
  }
}

/**
 * Everything a publish would change, minus the timestamp. Comparing two
 * fingerprints is how the editor answers "do I have unpublished changes?"
 * without storing a dirty flag that a failed save could leave lying.
 */
export function snapshotFingerprint(snapshot: StorefrontSnapshot): string {
  return JSON.stringify({
    identity: snapshot.identity,
    brand: snapshot.brand,
    sections: snapshot.sections,
    services: snapshot.services,
  })
}
