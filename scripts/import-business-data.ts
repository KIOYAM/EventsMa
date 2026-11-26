/**
 * Fill one tenant with a complete, realistic working dataset.
 *
 *   npx vite-node scripts/import-business-data.ts tinu-eventer
 *
 * What it writes, all through the ordinary tables:
 *   • business identity, brand, SEO, payment instructions and service areas
 *   • all four services activated, configured and shown on the storefront
 *   • a full catalogue, packages, recipes, decor materials and makeup artists
 *   • crew accounts, clients, suppliers, stock with its movement ledger
 *   • events from enquiry to completed, with catering sessions, decor builds,
 *     photo coverage, shot lists, deliveries, makeup appointments and trials
 *   • quotations (computed by the app's own pricing engine), invoices, receipts
 *     and expenses
 *   • published work, FAQ, team, testimonials and a new published storefront
 *     version built by `buildStorefrontSnapshot`
 *
 * Idempotent: rows are matched by natural keys and never deleted. Running it a
 * second time refreshes statuses and adds nothing twice. It is sample content for
 * a demonstration tenant, not a product feature — edit or remove any of it in the
 * app afterwards, and the pages follow the database.
 */
import { connect, resolveTenant } from './import/context'
import { importCatalogue } from './import/catalogue'
import { importProfile, publishStorefrontData } from './import/profile'
import { importEvents } from './import/events'
import { importMoney } from './import/money'

const slug = process.argv[2] ?? 'tinu-eventer'
const sql = connect()

try {
  const tenant = await resolveTenant(sql, slug)
  console.log(`Importing business data into ${tenant.name} (${tenant.slug})`)

  console.log('1/5  profile, services, crew, clients, stock, layout')
  const profile = await importProfile(sql, tenant.orgId)
  console.log(
    `     crew ${profile.crew} · clients ${profile.clients} · suppliers ${profile.suppliers}` +
      ` · stock ${profile.inventory} · portfolio ${profile.portfolio}`,
  )

  console.log('2/5  catalogue, packages, recipes, materials, artists')
  const catalogue = await importCatalogue(sql, tenant.orgId)
  console.log(
    `     new items ${catalogue.items} · new packages ${catalogue.packages}` +
      ` · recipe lines ${catalogue.recipes} · materials ${catalogue.materials}` +
      ` · artists ${catalogue.artists}`,
  )

  console.log('3/5  events and their service detail')
  const events = await importEvents(sql, tenant.orgId)
  console.log(`     events created ${events.added} · refreshed ${events.updated}`)

  console.log('4/5  quotes, invoices, receipts, expenses')
  const money = await importMoney(sql, tenant.orgId, events.eventIds, tenant.ownerUserId)
  console.log(
    `     quotes ${money.quotations} · versions ${money.versions} · lines ${money.lines}` +
      ` · invoices ${money.invoices} · receipts ${money.payments} · expenses ${money.expenses}`,
  )

  console.log('5/5  publishing the storefront')
  const published = await publishStorefrontData(sql, tenant.orgId, tenant.ownerUserId)
  console.log(`     version ${published.version} · ${published.sections} visible sections`)

  const [totals] = await sql`
    select
      (select count(*)::int from service_items where org_id = ${tenant.orgId}) as items,
      (select count(*)::int from service_packages where org_id = ${tenant.orgId}) as packages,
      (select count(*)::int from clients where org_id = ${tenant.orgId}) as clients,
      (select count(*)::int from events where org_id = ${tenant.orgId}) as events,
      (select count(*)::int from quotations where org_id = ${tenant.orgId}) as quotes,
      (select count(*)::int from invoices where org_id = ${tenant.orgId}) as invoices,
      (select count(*)::int from payments where org_id = ${tenant.orgId}) as payments,
      (select count(*)::int from event_catering_sessions where org_id = ${tenant.orgId}) as sessions,
      (select count(*)::int from session_menu_items where org_id = ${tenant.orgId}) as dishes,
      (select count(*)::int from storefront_versions where org_id = ${tenant.orgId}) as versions,
      (select coalesce(sum(views), 0)::int from storefront_views where org_id = ${tenant.orgId}) as views
  `

  console.log('\nTenant now holds')
  console.log(
    [
      `  catalogue items   ${totals?.items}`,
      `  packages          ${totals?.packages}`,
      `  clients           ${totals?.clients}`,
      `  events            ${totals?.events}`,
      `  quotations        ${totals?.quotes}`,
      `  invoices          ${totals?.invoices}`,
      `  receipts          ${totals?.payments}`,
      `  catering sessions ${totals?.sessions}`,
      `  chosen dishes     ${totals?.dishes}`,
      `  storefront        version ${published.version}, ${totals?.versions} versions`,
      `  views, last week  ${totals?.views}`,
      `  public page       /p/${tenant.slug}`,
    ].join('\n'),
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
} finally {
  await sql.end({ timeout: 5 })
}
