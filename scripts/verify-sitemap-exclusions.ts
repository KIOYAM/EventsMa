/**
 * Prove the sitemap's exclusion rules against real rows, then remove the rows.
 *
 *   npx vite-node scripts/verify-sitemap-exclusions.ts [baseUrl]
 *
 * Two disposable storefronts are published, each through the same
 * `buildStorefrontSnapshot` the studio uses:
 *
 *   A  indexable, catering shown, decor hidden, one active item in each
 *   B  noindex, catering shown, one active item
 *
 * Expected: A's page, catering listing and catering item are listed; A's decor
 * listing and decor item are not; B contributes nothing at all. The organisations
 * are deleted in a `finally`, so a failed assertion does not leave test tenants in
 * the database or the sitemap.
 */
import postgres from 'postgres'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { buildStorefrontSnapshot } from '../lib/domain/storefront-snapshot'
import { orderSections } from '../lib/domain/storefront'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
process.loadEnvFile(resolve(root, '.env.local'))

const base = (process.argv[2] || 'http://localhost:3400').replace(/\/$/, '')
const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error('DIRECT_URL and DATABASE_URL are both empty in .env.local')
  process.exit(2)
}

const stamp = Date.now().toString(36)
const slugs = {
  indexable: `verify-sitemap-shown-${stamp}`,
  noindex: `verify-sitemap-hidden-${stamp}`,
}

const sql = postgres(url, { max: 2, ssl: 'require', prepare: false, onnotice: () => {} })
const json = (value: unknown) => sql.json(value as never)

const failures: string[] = []
function check(name: string, ok: boolean): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) failures.push(name)
}

type Snapshot = ReturnType<typeof buildStorefrontSnapshot>

async function createStorefront(input: {
  slug: string
  noindex: boolean
  services: { verticalKey: string; visible: boolean }[]
}): Promise<{ itemIds: Record<string, string> }> {
  const [org] = (await sql`
    insert into organisations (name, slug) values (${`Verify ${input.slug}`}, ${input.slug})
    returning id
  `) as unknown as { id: string }[]
  if (!org) throw new Error('organisation insert failed')
  const orgId = org.id

  await sql`
    insert into businesses (org_id, name, city, published)
    values (${orgId}, ${`Verify ${input.slug}`}, 'Kochi', true)
  `

  const itemIds: Record<string, string> = {}
  for (const [index, service] of input.services.entries()) {
    await sql`
      insert into business_services (org_id, vertical_key, enabled, storefront_visible, sort_order)
      values (${orgId}, ${service.verticalKey}, true, ${service.visible}, ${index})
    `
    const [item] = (await sql`
      insert into service_items
        (org_id, vertical_key, name, unit_class, price_paise, sort_order, active)
      values (${orgId}, ${service.verticalKey}, ${`${service.verticalKey} item`},
              'PER_UNIT', 100000, 0, true)
      returning id
    `) as unknown as { id: string }[]
    if (!item) throw new Error('item insert failed')
    itemIds[service.verticalKey] = item.id
  }

  const sectionRows = (['hero', 'services', 'enquiry'] as const).map((key, position) => ({
    key,
    position,
    visible: true,
    heading: null,
    imagePath: null,
    config: null,
  }))

  const snapshot: Snapshot = buildStorefrontSnapshot({
    name: `Verify ${input.slug}`,
    tagline: 'Disposable storefront for a sitemap test.',
    city: 'Kochi',
    phone: null,
    theme: 'editorial',
    font: 'serif',
    primary: '#183d33',
    subtitle: null,
    about: null,
    logoPath: null,
    sections: orderSections(sectionRows),
    services: input.services,
    seo: {
      title: null,
      description: null,
      noindex: input.noindex,
    },
  })

  await sql`insert into storefronts (org_id) values (${orgId})`
  const [storefront] = (await sql`
    select id from storefronts where org_id = ${orgId} limit 1
  `) as unknown as { id: string }[]
  if (!storefront) throw new Error('storefront insert failed')

  const [version] = (await sql`
    insert into storefront_versions (org_id, storefront_id, version, schema_version, snapshot)
    values (${orgId}, ${storefront.id}, 1, ${snapshot.schemaVersion}, ${json(snapshot)})
    returning id
  `) as unknown as { id: string }[]
  if (!version) throw new Error('version insert failed')

  await sql`
    update storefronts set status = 'published', published_version_id = ${version.id},
      published_at = now(), updated_at = now()
    where org_id = ${orgId}
  `

  return { itemIds }
}

async function sitemapUrls(): Promise<string> {
  const response = await fetch(`${base}/sitemap.xml`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`sitemap responded ${response.status}`)
  return response.text()
}

try {
  console.log(`Base: ${base}`)
  const before = await sitemapUrls()
  const beforeCount = (before.match(/<loc>/g) ?? []).length

  const indexable = await createStorefront({
    slug: slugs.indexable,
    noindex: false,
    services: [
      { verticalKey: 'catering', visible: true },
      { verticalKey: 'decor', visible: false },
    ],
  })
  const hidden = await createStorefront({
    slug: slugs.noindex,
    noindex: true,
    services: [{ verticalKey: 'catering', visible: true }],
  })

  const xml = await sitemapUrls()

  check(
    'indexable storefront is listed',
    xml.includes(`/p/${slugs.indexable}</loc>`),
  )
  check(
    'shown service listing is listed',
    xml.includes(`/p/${slugs.indexable}/services/catering</loc>`),
  )
  check(
    'shown service item is listed',
    xml.includes(`/p/${slugs.indexable}/services/${indexable.itemIds.catering}</loc>`),
  )
  check(
    'hidden service listing is excluded',
    !xml.includes(`/p/${slugs.indexable}/services/decor</loc>`),
  )
  check(
    'hidden service item is excluded',
    !xml.includes(`/p/${slugs.indexable}/services/${indexable.itemIds.decor}</loc>`),
  )

  check('noindex storefront is excluded', !xml.includes(`/p/${slugs.noindex}</loc>`))
  check(
    'noindex storefront catalogue is excluded',
    !xml.includes(`/p/${slugs.noindex}/services/`) &&
      !xml.includes(`/p/${slugs.noindex}/services/${hidden.itemIds.catering}`),
  )
} finally {
  await sql`delete from organisations where slug in (${slugs.indexable}, ${slugs.noindex})`

  const [left] = (await sql`
    select count(*)::int as count from organisations
    where slug in (${slugs.indexable}, ${slugs.noindex})
  `) as unknown as { count: number }[]
  console.log(`${left?.count === 0 ? 'PASS' : 'FAIL'}  temporary organisations deleted`)

  try {
    const after = await sitemapUrls()
    console.log(
      `${after.includes(slugs.indexable) || after.includes(slugs.noindex) ? 'FAIL' : 'PASS'}  ` +
        'temporary storefronts absent from the sitemap',
    )
  } catch (error) {
    console.log(`WARN  could not re-read the sitemap after cleanup: ${String(error)}`)
  }

  await sql.end()
}

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('\nAll sitemap exclusion checks passed.')
