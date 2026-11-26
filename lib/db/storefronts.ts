import 'server-only'
import { and, desc, eq, lte, sql } from 'drizzle-orm'
import { getDb, getSystemDb, isDatabaseConfigured, type EventsMaDatabase } from './client'
import {
  businesses,
  businessServices,
  storefrontSections,
  storefrontVersions,
  storefronts,
} from './schema'
import { orderSections } from '@/lib/domain/storefront'
import { seoFromSettings } from '@/lib/domain/storefront-seo'
import {
  buildStorefrontSnapshot,
  parseStorefrontSnapshot,
  snapshotFingerprint,
  type StorefrontSnapshot,
} from '@/lib/domain/storefront-snapshot'

/**
 * Publishing.
 *
 * The draft is read from `businesses` + `storefront_sections`; publishing writes
 * one immutable `storefront_versions` row and moves `storefronts.published_version_id`.
 * The public page reads that pointer and nothing else, so an edit that has not
 * been published cannot reach a visitor even if it is saved.
 *
 * Every function takes an optional handle. Production callers omit it and get
 * `getDb()`, which inside a server action is the `authenticated` role with the
 * member's claims — RLS decides what is writable, and calling outside a scope
 * throws rather than silently running as the table owner. The integration test
 * passes `getSystemDb()` because it has no request. The public read
 * (`getPublishedSnapshot`) always uses the system client: a visitor has no
 * session, and the tenant is resolved from the URL slug on the server.
 */
type Db = EventsMaDatabase

/** Versions kept per storefront; older ones are pruned when a new one publishes. */
const VERSION_RETENTION = 20

export interface PublishState {
  status: 'draft' | 'published' | 'suspended'
  publishedVersion: number | null
  publishedAt: string | null
  hasUnpublishedChanges: boolean
  /**
   * The workspace's own "published" flag. It can disagree with the version
   * pointer on rows written before publishing existed (or by an older build), so
   * the UI reports liveness from `publishedVersion`, never from this alone.
   */
  businessPublished: boolean
}

export interface VersionSummary {
  id: string
  version: number
  createdAt: string
  /** The version the public page is serving right now. */
  isLive: boolean
}

export interface PublishResult {
  ok: true
  version: number
}

export interface PublishFailure {
  ok: false
  error: 'database' | 'empty-name' | 'version'
}

function handle(db?: Db): Db {
  return db ?? getDb()
}

/** The draft, in the same shape a publish would freeze. */
export async function readDraftSnapshot(
  orgId: string,
  db?: Db,
): Promise<StorefrontSnapshot | null> {
  const client = handle(db)
  const [row] = await client
    .select({
      name: businesses.name,
      tagline: businesses.tagline,
      city: businesses.city,
      phone: businesses.phone,
      settings: businesses.settings,
    })
    .from(businesses)
    .where(eq(businesses.orgId, orgId))
    .limit(1)

  if (!row) return null

  const layout = await client
    .select({
      key: storefrontSections.key,
      position: storefrontSections.position,
      visible: storefrontSections.visible,
      heading: storefrontSections.heading,
      imagePath: storefrontSections.imagePath,
      // FAQ answers and team names are section content, so they are part of what
      // a publish freezes; without this read they would never reach a snapshot.
      config: storefrontSections.config,
    })
    .from(storefrontSections)
    .where(eq(storefrontSections.orgId, orgId))
    .orderBy(storefrontSections.position)

  // Which activated services the owner wants visitors to see. Read from the same
  // row the workspace enables, so a service that is no longer offered can never be
  // frozen back into a version by a stale visibility flag.
  const services = await client
    .select({
      verticalKey: businessServices.verticalKey,
      visible: businessServices.storefrontVisible,
    })
    .from(businessServices)
    .where(eq(businessServices.orgId, orgId))
    .orderBy(businessServices.sortOrder, businessServices.verticalKey)

  const brand = row.settings?.brand ?? {}

  return buildStorefrontSnapshot({
    name: row.name,
    tagline: row.tagline,
    city: row.city,
    phone: row.phone,
    theme: brand.theme,
    font: brand.font,
    primary: brand.primary,
    subtitle: brand.subtitle ?? null,
    about: row.settings?.about ?? null,
    logoPath: brand.logoPath ?? null,
    sections: orderSections(layout),
    services,
    seo: seoFromSettings(row.settings),
    design: row.settings?.design,
  })
}

async function ensureStorefront(
  orgId: string,
  client: Db,
): Promise<{ id: string; publishedVersionId: string | null }> {
  const [row] = await client
    .select({ id: storefronts.id, publishedVersionId: storefronts.publishedVersionId })
    .from(storefronts)
    .where(eq(storefronts.orgId, orgId))
    .limit(1)

  if (row) return row

  const [created] = await client
    .insert(storefronts)
    .values({ orgId })
    .onConflictDoUpdate({ target: storefronts.orgId, set: { updatedAt: new Date() } })
    .returning({ id: storefronts.id, publishedVersionId: storefronts.publishedVersionId })

  if (!created) throw new Error('Could not create the storefront row')
  return created
}

async function nextVersionNumber(client: Db, storefrontId: string): Promise<number> {
  const [row] = await client
    .select({ max: sql<number>`coalesce(max(${storefrontVersions.version}), 0)` })
    .from(storefrontVersions)
    .where(eq(storefrontVersions.storefrontId, storefrontId))

  return Number(row?.max ?? 0) + 1
}

export async function getPublishState(
  orgId: string,
  demo: boolean,
  db?: Db,
): Promise<PublishState> {
  const idle: PublishState = {
    status: 'draft',
    publishedVersion: null,
    publishedAt: null,
    hasUnpublishedChanges: true,
    businessPublished: false,
  }
  if (demo || !isDatabaseConfigured()) return idle

  const client = handle(db)
  const [row] = await client
    .select({
      status: storefronts.status,
      publishedAt: storefronts.publishedAt,
      version: storefrontVersions.version,
      snapshot: storefrontVersions.snapshot,
    })
    .from(storefronts)
    .leftJoin(storefrontVersions, eq(storefrontVersions.id, storefronts.publishedVersionId))
    .where(eq(storefronts.orgId, orgId))
    .limit(1)

  const [business] = await client
    .select({ published: businesses.published })
    .from(businesses)
    .where(eq(businesses.orgId, orgId))
    .limit(1)

  const draft = await readDraftSnapshot(orgId, db)
  const published = row?.snapshot ? parseStorefrontSnapshot(row.snapshot) : null

  return {
    status: (row?.status as PublishState['status']) ?? 'draft',
    publishedVersion: row?.version ?? null,
    publishedAt: row?.publishedAt ? row.publishedAt.toISOString() : null,
    hasUnpublishedChanges:
      !published || !draft || snapshotFingerprint(published) !== snapshotFingerprint(draft),
    businessPublished: business?.published ?? false,
  }
}

/**
 * Freeze the current draft as the next immutable version and point the live site
 * at it. Publishing also marks the business published, so one button means "this
 * is ready for clients" rather than two switches that can disagree.
 */
export async function publishStorefront(
  orgId: string,
  actorId: string | null,
  db?: Db,
): Promise<PublishResult | PublishFailure> {
  if (!isDatabaseConfigured()) return { ok: false, error: 'database' }
  const client = handle(db)

  const snapshot = await readDraftSnapshot(orgId, client)
  if (!snapshot) return { ok: false, error: 'database' }
  if (!snapshot.identity.name) return { ok: false, error: 'empty-name' }

  const storefront = await ensureStorefront(orgId, client)
  const version = await nextVersionNumber(client, storefront.id)
  const now = new Date()

  const [inserted] = await client
    .insert(storefrontVersions)
    .values({
      orgId,
      storefrontId: storefront.id,
      version,
      schemaVersion: snapshot.schemaVersion,
      snapshot: snapshot as unknown as Record<string, unknown>,
      createdBy: actorId,
    })
    .returning({ id: storefrontVersions.id, version: storefrontVersions.version })

  if (!inserted) return { ok: false, error: 'version' }

  await client
    .update(storefronts)
    .set({ status: 'published', publishedVersionId: inserted.id, publishedAt: now, updatedAt: now })
    .where(eq(storefronts.orgId, orgId))

  // Retention: keep the newest 20 version numbers. Versions are monotonic and the
  // live one is always the newest, so `<= version - 20` is stale by definition and
  // can never name the version the pointer serves. One statement, no read of
  // history the UI never shows (it lists 10).
  await client
    .delete(storefrontVersions)
    .where(
      and(
        eq(storefrontVersions.storefrontId, storefront.id),
        lte(storefrontVersions.version, version - VERSION_RETENTION),
      ),
    )

  await client
    .update(businesses)
    .set({ published: true, updatedAt: now })
    .where(eq(businesses.orgId, orgId))

  return { ok: true, version: inserted.version }
}

/**
 * Rollback copies an old snapshot back into the draft and publishes it as a new
 * version. History is never mutated: v3 can equal v1's content without touching
 * v1, which keeps the audit trail honest and the pointer swap trivial.
 */
export async function restoreStorefrontVersion(
  orgId: string,
  versionId: string,
  actorId: string | null,
  db?: Db,
): Promise<PublishResult | PublishFailure> {
  if (!isDatabaseConfigured()) return { ok: false, error: 'database' }
  const client = handle(db)

  // Scoped by org as well as id: the id arrives in a form field, and RLS alone
  // would let a manager of another tenant try it. A version belonging to someone
  // else must read as "not found", not as a payload to copy.
  const [row] = await client
    .select({ snapshot: storefrontVersions.snapshot })
    .from(storefrontVersions)
    .where(and(eq(storefrontVersions.id, versionId), eq(storefrontVersions.orgId, orgId)))
    .limit(1)

  const snapshot = row ? parseStorefrontSnapshot(row.snapshot) : null
  if (!snapshot) return { ok: false, error: 'version' }

  const now = new Date()
  const brand = {
    theme: snapshot.brand.theme,
    font: snapshot.brand.font,
    primary: snapshot.brand.primary,
    subtitle: snapshot.brand.subtitle,
    logoPath: snapshot.brand.logoPath,
  }

  await client
    .update(businesses)
    .set({
      name: snapshot.identity.name,
      tagline: snapshot.identity.tagline,
      city: snapshot.identity.city,
      phone: snapshot.identity.phone,
      // Brand and about live inside the settings blob, so they are replaced
      // without disturbing the keys this feature does not own.
      settings: sql`jsonb_set(
        jsonb_set(
          jsonb_set(
            coalesce(${businesses.settings}, '{}'::jsonb),
            '{brand}',
            ${JSON.stringify(brand)}::jsonb
          ),
          '{about}',
          ${JSON.stringify(snapshot.brand.about)}::jsonb
        ),
        '{seo}',
        ${JSON.stringify(snapshot.seo)}::jsonb
      )`,
      updatedAt: now,
    })
    .where(eq(businesses.orgId, orgId))

  // Sections are rewritten to exactly what the snapshot says.
  await client.delete(storefrontSections).where(eq(storefrontSections.orgId, orgId))
  if (snapshot.sections.length > 0) {
    await client.insert(storefrontSections).values(
      snapshot.sections.map((section) => ({
        orgId,
        key: section.key,
        position: section.position,
        visible: section.visible,
        heading: section.heading,
        imagePath: section.imagePath,
        config: section.config as unknown as Record<string, unknown>,
      })),
    )
  }

  return publishStorefront(orgId, actorId, client)
}

export async function listStorefrontVersions(
  orgId: string,
  limit = 10,
  db?: Db,
): Promise<VersionSummary[]> {
  if (!isDatabaseConfigured()) return []
  const client = handle(db)

  const [storefront] = await client
    .select({ id: storefronts.id, publishedVersionId: storefronts.publishedVersionId })
    .from(storefronts)
    .where(eq(storefronts.orgId, orgId))
    .limit(1)

  if (!storefront) return []

  const rows = await client
    .select({
      id: storefrontVersions.id,
      version: storefrontVersions.version,
      createdAt: storefrontVersions.createdAt,
    })
    .from(storefrontVersions)
    .where(eq(storefrontVersions.storefrontId, storefront.id))
    .orderBy(desc(storefrontVersions.version))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
    isLive: row.id === storefront.publishedVersionId,
  }))
}

/**
 * The published snapshot for a tenant.
 *
 * Three outcomes, and the difference matters:
 * - a snapshot: this is what a visitor may see.
 * - `null`: the storefront exists and has never published, so there is nothing
 *   legitimate to serve. The caller must 404 rather than quietly show the draft.
 * - `undefined`: we cannot tell (database not configured, or the table is absent
 *   because a deploy landed before 0012 ran). Only this case may fall back to the
 *   draft, which is the behaviour every live page had before publishing existed.
 *
 * System client: a visitor has no session, so this must not depend on RLS, and
 * the caller has already resolved the tenant from a URL slug.
 */
export async function getPublishedSnapshot(
  orgId: string,
): Promise<StorefrontSnapshot | null | undefined> {
  if (!isDatabaseConfigured()) return undefined

  try {
    const [row] = await getSystemDb()
      .select({ snapshot: storefrontVersions.snapshot })
      .from(storefronts)
      .innerJoin(storefrontVersions, eq(storefrontVersions.id, storefronts.publishedVersionId))
      .where(eq(storefronts.orgId, orgId))
      .limit(1)

    return row ? parseStorefrontSnapshot(row.snapshot) : null
  } catch {
    // A public page must never go down because a deployment reached a database
    // where 0012 has not been applied yet: "cannot tell" renders the draft, which
    // is exactly the pre-0012 behaviour clients already had. A tenant that simply
    // has no version is a different answer (`null`) and is not served at all.
    return undefined
  }
}
