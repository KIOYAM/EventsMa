/**
 * Import sample catalogue, portfolio, testimonials and layout into one tenant,
 * then publish a normal storefront version.
 *
 *   npx vite-node scripts/seed-storefront-demo.ts kannan-events
 *
 * Why a script: the public page renders only real rows, so reviewing the
 * renderer against a fresh tenant means giving that tenant a catalogue. Every
 * row is written to the ordinary tables through the owner connection
 * (`DIRECT_URL`/`DATABASE_URL`), and the publish step goes through the same
 * `buildStorefrontSnapshot` the studio uses — so the snapshot is the real shape,
 * not a hand-written JSON blob.
 *
 * Idempotent: items, packages and portfolio entries are matched by name/title
 * before insert, sections are upserted by key. Running it twice adds nothing and
 * publishes the next version. It never deletes a row.
 *
 * This is sample content for a demonstration tenant, not a product feature. Edit
 * or remove any of it in the studio afterwards; the page follows the database.
 */
import postgres from 'postgres'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildStorefrontSnapshot } from '../lib/domain/storefront-snapshot'
import { orderSections } from '../lib/domain/storefront'
import {
  DEMO_BUSINESS,
  DEMO_FAQ,
  DEMO_ITEMS,
  DEMO_PACKAGES,
  DEMO_PORTFOLIO,
  DEMO_SECTION_ORDER,
  DEMO_SERVICES,
  DEMO_TEAM,
  DEMO_TESTIMONIALS,
} from './storefront-demo-content'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
process.loadEnvFile(resolve(root, '.env.local'))

const slug = process.argv[2]
if (!slug) {
  console.error('Usage: npx vite-node scripts/seed-storefront-demo.ts <organisation-slug>')
  process.exit(2)
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error('DIRECT_URL and DATABASE_URL are both empty in .env.local')
  process.exit(2)
}

const sql = postgres(url, { max: 2, ssl: 'require', prepare: false, onnotice: () => {} })
const json = (value: unknown) => sql.json(value as never)

try {
  const [org] = await sql`
    select o.id as org_id, b.id as business_id, b.name
    from organisations o
    join businesses b on b.org_id = o.id
    where o.slug = ${slug}
    limit 1
  `
  if (!org) {
    console.error(`No business found for slug "${slug}".`)
    process.exit(1)
  }
  const orgId = org.org_id as string
  console.log(`Seeding ${org.name} (${slug})`)

  // ── Identity, brand words and the introduction ────────────────────────────
  await sql`
    update businesses set
      tagline = ${DEMO_BUSINESS.tagline},
      city = ${DEMO_BUSINESS.city},
      district = ${DEMO_BUSINESS.district},
      -- to_jsonb, not a JSON.stringify cast: a text parameter cast to jsonb a
      -- second time keeps the quotes and the page shows a quoted paragraph.
      settings = jsonb_set(
        jsonb_set(
          coalesce(settings, '{}'::jsonb),
          '{about}',
          to_jsonb(${DEMO_BUSINESS.about}::text)
        ),
        '{brand}',
        coalesce(settings->'brand', '{}'::jsonb)
          || jsonb_build_object('subtitle', ${DEMO_BUSINESS.subtitle}::text),
        true
      ),
      updated_at = now()
    where org_id = ${orgId}
  `

  // ── Services: activated and shown ─────────────────────────────────────────
  for (const service of DEMO_SERVICES) {
    await sql`
      insert into business_services (org_id, vertical_key, enabled, storefront_visible, sort_order)
      values (${orgId}, ${service.verticalKey}, true, true, ${service.sortOrder})
      on conflict (org_id, vertical_key) do update set
        enabled = true,
        storefront_visible = true,
        sort_order = ${service.sortOrder}
    `
  }

  // ── Catalogue items ───────────────────────────────────────────────────────
  const itemsBeforeRows = (await sql`
    select count(*)::int as count from service_items where org_id = ${orgId}
  `) as unknown as { count: number }[]
  const itemsBefore = itemsBeforeRows[0]?.count ?? 0
  let itemsAdded = 0
  for (const [verticalKey, items] of Object.entries(DEMO_ITEMS)) {
    const existing = await sql`
      select name from service_items where org_id = ${orgId} and vertical_key = ${verticalKey}
    `
    const have = new Set(existing.map((row) => String(row.name)))
    for (const [index, item] of items.entries()) {
      if (have.has(item.name)) continue
      await sql`
        insert into service_items
          (org_id, vertical_key, name, category, unit_class, unit_label, price_paise,
           description, dietary, sort_order, active)
        values
          (${orgId}, ${verticalKey}, ${item.name}, ${item.category}, ${item.unit}::unit_class,
           ${item.label}, ${item.price}, ${item.description ?? null}, ${item.diet ?? null},
           ${index}, true)
      `
      itemsAdded += 1
    }
  }

  // ── Packages ──────────────────────────────────────────────────────────────
  /** Inclusions are text[]: `${arr}` would serialise as a Postgres array. */
  const packageExists = async (verticalKey: string, name: string): Promise<boolean> => {
    const [row] = await sql`
      select 1 from service_packages
      where org_id = ${orgId} and vertical_key = ${verticalKey} and name = ${name}
      limit 1
    `
    return Boolean(row)
  }
  let packagesAdded = 0
  for (const pack of DEMO_PACKAGES) {
    if (await packageExists(pack.verticalKey, pack.name)) continue
    await sql`
      insert into service_packages
        (org_id, vertical_key, name, unit_class, rate_paise, min_quantity, tax_rate_bp, inclusions, active)
      values
        (${orgId}, ${pack.verticalKey}, ${pack.name}, ${pack.unit}::unit_class, ${pack.rate},
         ${pack.minQuantity}, 1800, ${pack.inclusions}, true)
    `
    packagesAdded += 1
  }

  // ── Published work ────────────────────────────────────────────────────────
  let portfolioAdded = 0
  for (const [index, work] of DEMO_PORTFOLIO.entries()) {
    const [row] = await sql`
      select 1 from portfolio_items where org_id = ${orgId} and title = ${work.title} limit 1
    `
    if (row) continue
    await sql`
      insert into portfolio_items
        (org_id, title, event_date, venue_name, description, published, sort_order)
      values
        (${orgId}, ${work.title}, ${work.eventDate}::date, ${work.venueName}, ${work.description},
         true, ${index})
    `
    portfolioAdded += 1
  }

  // ── Layout: order, content, headings ──────────────────────────────────────
  const config = {
    faq: DEMO_FAQ.map((item) => ({ id: crypto.randomUUID(), ...item })),
    team: DEMO_TEAM.map((member) => ({ id: crypto.randomUUID(), ...member })),
    testimonials: DEMO_TESTIMONIALS.map((item) => ({ id: crypto.randomUUID(), ...item })),
  }

  for (const [position, key] of DEMO_SECTION_ORDER.entries()) {
    const sectionConfig = key === 'faq' || key === 'team' || key === 'testimonials' ? config : null
    await sql`
      insert into storefront_sections (org_id, key, position, visible, config)
      values (${orgId}, ${key}, ${position}, true, ${json(sectionConfig ?? {})})
      on conflict (org_id, key) do update set
        position = ${position},
        visible = true,
        config = case
          when ${key} in ('faq', 'team', 'testimonials') then ${json(config)}
          else storefront_sections.config
        end,
        updated_at = now()
    `
  }

  // ── Publish through the real snapshot builder ─────────────────────────────
  const [business] = (await sql`
    select name, tagline, city, phone, settings from businesses where org_id = ${orgId} limit 1
  `) as unknown as {
    name: string
    tagline: string | null
    city: string | null
    phone: string | null
    settings: { brand?: Record<string, string>; about?: string } | null
  }[]
  if (!business) throw new Error('The business row disappeared mid-run.')
  const sectionRows = await sql`
    select key, position, visible, heading, image_path, config
    from storefront_sections where org_id = ${orgId} order by position
  `
  const serviceRows = await sql`
    select vertical_key, storefront_visible from business_services
    where org_id = ${orgId} order by sort_order, vertical_key
  `
  const settings = (business.settings ?? {}) as {
    brand?: Record<string, string>
    about?: string
  }
  const brand = settings.brand ?? {}

  const snapshot = buildStorefrontSnapshot({
    name: String(business.name),
    tagline: business.tagline ?? null,
    city: business.city ?? null,
    phone: business.phone ?? null,
    theme: brand.theme,
    font: brand.font,
    primary: brand.primary,
    subtitle: brand.subtitle ?? null,
    about: settings.about ?? null,
    logoPath: brand.logoPath ?? null,
    sections: orderSections(
      sectionRows.map((row) => ({
        key: String(row.key),
        position: Number(row.position),
        visible: row.visible !== false,
        heading: row.heading ?? null,
        imagePath: row.image_path ?? null,
        config: row.config,
      })),
    ),
    services: serviceRows.map((row) => ({
      verticalKey: String(row.vertical_key),
      visible: row.storefront_visible !== false,
    })),
  })

  await sql`
    insert into storefronts (org_id) values (${orgId}) on conflict (org_id) do nothing
  `
  const storefrontRows = (await sql`
    select id as storefront_id from storefronts where org_id = ${orgId} limit 1
  `) as unknown as { storefront_id: string }[]
  const storefrontId = storefrontRows[0]?.storefront_id
  if (!storefrontId) throw new Error('No storefront row for this organisation.')

  const nextVersionRows = (await sql`
    select coalesce(max(version), 0) + 1 as next_version
    from storefront_versions where storefront_id = ${storefrontId}
  `) as unknown as { next_version: number }[]
  const nextVersion = nextVersionRows[0]?.next_version ?? 1

  const [version] = (await sql`
    insert into storefront_versions (org_id, storefront_id, version, schema_version, snapshot)
    values (${orgId}, ${storefrontId}, ${nextVersion}, ${snapshot.schemaVersion}, ${json(snapshot)})
    returning id, version
  `) as unknown as { id: string; version: number }[]
  if (!version) throw new Error('The version row was not written.')
  await sql`
    update storefronts set
      status = 'published',
      published_version_id = ${version.id},
      published_at = now(),
      updated_at = now()
    where org_id = ${orgId}
  `
  await sql`update businesses set published = true, updated_at = now() where org_id = ${orgId}`

  const afterRows = (await sql`
    select
      (select count(*)::int from service_items where org_id = ${orgId}) as items,
      (select count(*)::int from service_packages where org_id = ${orgId}) as packages,
      (select count(*)::int from portfolio_items where org_id = ${orgId}) as work
  `) as unknown as { items: number; packages: number; work: number }[]
  const after = afterRows[0] ?? { items: 0, packages: 0, work: 0 }

  console.log(
    [
      `catalogue items : ${itemsBefore} -> ${after.items} (+${itemsAdded})`,
      `packages        : ${after.packages}`,
      `portfolio       : ${after.work} (+${portfolioAdded})`,
      `testimonials    : ${snapshot.sections.find((s) => s.key === 'testimonials')?.config.testimonials.length ?? 0}`,
      `published       : version ${version.version} (schema ${snapshot.schemaVersion})`,
      `public page     : /p/${slug}`,
    ].join('\n'),
  )
} finally {
  await sql.end()
}
