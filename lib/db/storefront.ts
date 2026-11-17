import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { businesses, storefrontSections } from './schema'
import {
  DEFAULT_BRAND_COLOUR,
  SECTION_KEYS,
  orderSections,
  resolveStorefrontFont,
  resolveStorefrontTheme,
  type SectionKey,
  type StorefrontFontKey,
  type StorefrontSection,
  type StorefrontThemeKey,
} from '@/lib/domain/storefront'

/**
 * The storefront engine's data layer.
 *
 * Rows exist only for what the owner changed; the canonical order lives in
 * `lib/domain/storefront.ts`. Every write goes through `getDb()`, which inside a
 * workspace is the RLS-scoped handle — a manager can only ever reorder their own
 * organisation's sections.
 */
const COLUMNS = {
  key: storefrontSections.key,
  position: storefrontSections.position,
  visible: storefrontSections.visible,
  heading: storefrontSections.heading,
  imagePath: storefrontSections.imagePath,
}

export async function getStorefrontSections(
  orgId: string,
  demo: boolean,
): Promise<StorefrontSection[]> {
  if (demo || !isDatabaseConfigured()) return orderSections([])

  const rows = await getDb()
    .select(COLUMNS)
    .from(storefrontSections)
    .where(eq(storefrontSections.orgId, orgId))
    .orderBy(asc(storefrontSections.position))

  return orderSections(rows)
}

/**
 * Materialise the keys this tenant has not saved yet, appended after the ones it
 * has. Idempotent: the unique (org, key) index makes a double submit harmless.
 */
export async function ensureStorefrontSections(orgId: string): Promise<void> {
  const db = getDb()
  const existing = await db
    .select({ key: storefrontSections.key, position: storefrontSections.position })
    .from(storefrontSections)
    .where(eq(storefrontSections.orgId, orgId))

  const have = new Set(existing.map((row) => row.key))
  const missing = SECTION_KEYS.filter((key) => !have.has(key))
  if (missing.length === 0) return

  const start = existing.reduce((max, row) => Math.max(max, row.position + 1), 0)
  await db
    .insert(storefrontSections)
    .values(missing.map((key, index) => ({ orgId, key, position: start + index })))
    .onConflictDoNothing()
}

export async function moveStorefrontSection(
  orgId: string,
  key: SectionKey,
  direction: 'up' | 'down',
): Promise<void> {
  await ensureStorefrontSections(orgId)
  const db = getDb()
  const rows = await db
    .select({ id: storefrontSections.id, key: storefrontSections.key, position: storefrontSections.position })
    .from(storefrontSections)
    .where(eq(storefrontSections.orgId, orgId))
    .orderBy(asc(storefrontSections.position), asc(storefrontSections.key))

  const index = rows.findIndex((row) => row.key === key)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= rows.length) return

  const current = rows[index]
  const neighbour = rows[target]
  if (!current || !neighbour) return

  // Two writes, no unique constraint on position: swapping cannot collide.
  await db
    .update(storefrontSections)
    .set({ position: neighbour.position, updatedAt: new Date() })
    .where(and(eq(storefrontSections.orgId, orgId), eq(storefrontSections.id, current.id)))
  await db
    .update(storefrontSections)
    .set({ position: current.position, updatedAt: new Date() })
    .where(and(eq(storefrontSections.orgId, orgId), eq(storefrontSections.id, neighbour.id)))
}

async function updateSection(
  orgId: string,
  key: SectionKey,
  values: Partial<{ visible: boolean; heading: string | null; imagePath: string | null }>,
): Promise<void> {
  await ensureStorefrontSections(orgId)
  await getDb()
    .update(storefrontSections)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(storefrontSections.orgId, orgId), eq(storefrontSections.key, key)))
}

export async function setStorefrontSectionVisible(
  orgId: string,
  key: SectionKey,
  visible: boolean,
): Promise<void> {
  await updateSection(orgId, key, { visible })
}

export async function setStorefrontSectionHeading(
  orgId: string,
  key: SectionKey,
  heading: string | null,
): Promise<void> {
  await updateSection(orgId, key, { heading })
}

export async function setStorefrontSectionImage(
  orgId: string,
  key: SectionKey,
  imagePath: string | null,
): Promise<void> {
  await updateSection(orgId, key, { imagePath })
}

/** Drops the tenant's customisation; the canonical order and page copy return. */
export async function resetStorefrontSections(orgId: string): Promise<void> {
  await getDb().delete(storefrontSections).where(eq(storefrontSections.orgId, orgId))
}

/**
 * The chosen design lives in `businesses.settings.brand.theme` next to the brand
 * colour, so one settings write serves the whole public surface and no extra
 * column or table is needed for a single enum value.
 */
export async function getStorefrontTheme(
  orgId: string,
  demo: boolean,
): Promise<StorefrontThemeKey> {
  if (demo || !isDatabaseConfigured()) return resolveStorefrontTheme(null)
  const [row] = await getDb()
    .select({ settings: businesses.settings })
    .from(businesses)
    .where(eq(businesses.orgId, orgId))
    .limit(1)
  return resolveStorefrontTheme(row?.settings?.brand?.theme)
}

/** Everything the brand studio edits, resolved from one row. */
export interface StorefrontBrand {
  name: string
  tagline: string | null
  city: string | null
  district: string | null
  phone: string | null
  email: string | null
  theme: StorefrontThemeKey
  font: StorefrontFontKey
  primary: string
  subtitle: string | null
  about: string | null
  logoPath: string | null
}

export async function getStorefrontBrand(
  orgId: string,
  demo: boolean,
): Promise<StorefrontBrand> {
  const fallback: StorefrontBrand = {
    name: 'Your business',
    tagline: null,
    city: null,
    district: null,
    phone: null,
    email: null,
    theme: resolveStorefrontTheme(null),
    font: resolveStorefrontFont(null),
    primary: DEFAULT_BRAND_COLOUR,
    subtitle: null,
    about: null,
    logoPath: null,
  }
  if (demo || !isDatabaseConfigured()) return fallback

  const [row] = await getDb()
    .select({
      name: businesses.name,
      tagline: businesses.tagline,
      city: businesses.city,
      district: businesses.district,
      phone: businesses.phone,
      email: businesses.email,
      settings: businesses.settings,
    })
    .from(businesses)
    .where(eq(businesses.orgId, orgId))
    .limit(1)

  if (!row) return fallback
  const settings = row.settings ?? {}
  const brand = settings.brand ?? {}

  return {
    name: row.name,
    tagline: row.tagline,
    city: row.city,
    district: row.district,
    phone: row.phone,
    email: row.email,
    theme: resolveStorefrontTheme(brand.theme),
    font: resolveStorefrontFont(brand.font),
    primary: brand.primary ?? DEFAULT_BRAND_COLOUR,
    subtitle: typeof settings.brand?.subtitle === 'string' ? settings.brand.subtitle : null,
    about: typeof settings.about === 'string' ? settings.about : null,
    logoPath: typeof brand.logoPath === 'string' ? brand.logoPath : null,
  }
}

/** One read-modify-write so a partial save can never drop the other settings. */
export async function setStorefrontBrand(
  orgId: string,
  patch: Partial<
    Pick<StorefrontBrand, 'theme' | 'font' | 'primary' | 'subtitle' | 'about' | 'logoPath'>
  >,
): Promise<void> {
  const db = getDb()
  const [current] = await db
    .select({ settings: businesses.settings })
    .from(businesses)
    .where(eq(businesses.orgId, orgId))
    .limit(1)

  const settings = current?.settings ?? {}
  const brand = { ...(settings.brand ?? {}) }

  if (patch.theme !== undefined) brand.theme = patch.theme
  if (patch.font !== undefined) brand.font = patch.font
  if (patch.primary !== undefined) brand.primary = patch.primary
  if (patch.logoPath !== undefined) brand.logoPath = patch.logoPath ?? undefined
  if (patch.subtitle !== undefined) brand.subtitle = patch.subtitle ?? undefined

  await db
    .update(businesses)
    .set({
      settings: {
        ...settings,
        brand: brand as typeof settings.brand,
        ...(patch.about !== undefined ? { about: patch.about ?? undefined } : {}),
      },
      updatedAt: new Date(),
    })
    .where(eq(businesses.orgId, orgId))
}

/** The text fields that live as columns rather than inside the settings blob. */
export async function updateStorefrontIdentity(
  orgId: string,
  values: { name: string; tagline: string | null; city: string | null; phone: string | null },
): Promise<void> {
  await getDb()
    .update(businesses)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(businesses.orgId, orgId))
}
