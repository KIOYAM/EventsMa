/**
 * The tenant's own rows: identity and settings, enabled services, crew, clients,
 * suppliers, stock, published work and the storefront layout — then one real
 * publish through the same snapshot builder the studio uses.
 */
import { createHash } from 'node:crypto'
import {
  buildStorefrontSnapshot,
  parseStorefrontSnapshot,
  snapshotFingerprint,
} from '../../lib/domain/storefront-snapshot'
import { orderSections } from '../../lib/domain/storefront'
import {
  BLOCKED_DATES, BRAND, CLIENTS, CREW, FAQ, INVENTORY, LAYOUT, PAYMENT, PORTFOLIO, SEO,
  SERVICE_CONFIG, STOREFRONT_VIEWS, SUPPLIERS, TEAM_CARDS, TENANT, TESTIMONIALS,
} from './tenant-content'
import type { Sql } from './context'
import { dateAgo, jsonOf, normalisePhone } from './context'

export interface ProfileCounts {
  crew: number
  clients: number
  suppliers: number
  inventory: number
  portfolio: number
}

export async function importProfile(sql: Sql, orgId: string): Promise<ProfileCounts> {
  const json = jsonOf(sql)

  const settings = {
    taxMode: 'exclusive' as const,
    advancePct: 40,
    quoteValidityDays: 14,
    serviceAreas: [...TENANT.areas],
    brand: {
      primary: BRAND.primary,
      font: BRAND.font,
      theme: BRAND.theme,
      subtitle: TENANT.subtitle,
    },
    seo: { title: SEO.title, description: SEO.description, noindex: false },
    about: TENANT.about,
    payment: { ...PAYMENT },
  }

  await sql`
    update businesses set
      name = ${TENANT.name},
      tagline = ${TENANT.tagline},
      city = ${TENANT.city},
      district = ${TENANT.district},
      phone = ${TENANT.phone},
      email = ${TENANT.email},
      settings = coalesce(settings, '{}'::jsonb) || ${json(settings)}::jsonb,
      published = true,
      updated_at = now()
    where org_id = ${orgId}
  `
  await sql`update organisations set name = ${TENANT.name} where id = ${orgId}`

  // ── Services: activated, configured and shown ─────────────────────────────
  const serviceOrder = ['catering', 'decor', 'photography', 'makeup']
  for (const [index, key] of serviceOrder.entries()) {
    const config = SERVICE_CONFIG[key] ?? {}
    await sql`
      insert into business_services
        (org_id, vertical_key, enabled, storefront_visible, sort_order, config)
      values
        (${orgId}, ${key}, true, true, ${index}, ${json(config)}::jsonb)
      on conflict (org_id, vertical_key) do update set
        enabled = true,
        storefront_visible = true,
        sort_order = ${index},
        config = ${json(config)}::jsonb
    `
  }

  // ── Crew ──────────────────────────────────────────────────────────────────
  for (const member of CREW) {
    await sql`
      insert into memberships
        (org_id, user_id, role, email, display_name, phone, skills, wage_paise_per_day, status)
      values
        (${orgId}, ${member.userId}, ${member.role}::member_role, ${member.email},
         ${member.name}, ${member.phone}, ${member.skills}, ${member.wage}, 'active')
      on conflict (org_id, user_id) do update set
        role = excluded.role,
        email = excluded.email,
        display_name = excluded.display_name,
        phone = excluded.phone,
        skills = excluded.skills,
        wage_paise_per_day = excluded.wage_paise_per_day,
        status = 'active'
    `
  }

  // ── Clients ───────────────────────────────────────────────────────────────
  for (const client of CLIENTS) {
    const phone = client.phone
    const normalised = normalisePhone(phone)
    const [existing] = await sql`
      select id from clients where org_id = ${orgId} and phone_normalized = ${normalised} limit 1
    `
    if (existing) {
      await sql`
        update clients set name = ${client.name}, phone = ${phone}, email = ${client.email ?? null},
          source = coalesce(source, ${client.source}), notes = coalesce(notes, ${client.notes ?? null})
        where id = ${existing.id}
      `
      continue
    }
    await sql`
      insert into clients (org_id, name, phone_normalized, phone, email, source, notes)
      values (${orgId}, ${client.name}, ${normalised}, ${phone}, ${client.email ?? null},
              ${client.source}, ${client.notes ?? null})
    `
  }

  // ── Suppliers and stock ───────────────────────────────────────────────────
  for (const supplier of SUPPLIERS) {
    const [existing] = await sql`
      select id from suppliers where org_id = ${orgId} and name = ${supplier.name} limit 1
    `
    if (existing) continue
    await sql`
      insert into suppliers (org_id, name, category, phone, notes, active)
      values (${orgId}, ${supplier.name}, ${supplier.category}, ${supplier.phone},
              ${supplier.notes ?? null}, true)
    `
  }

  for (const item of INVENTORY) {
    const [existing] = await sql`
      select id from inventory_items where org_id = ${orgId} and name = ${item.name} limit 1
    `
    let itemId = existing?.id as string | undefined
    if (!itemId) {
      const [row] = await sql`
        insert into inventory_items
          (org_id, name, unit, reorder_level_milli, cost_paise_per_unit, supplier, active)
        values (${orgId}, ${item.name}, ${item.unit}, ${item.reorderMilli},
                ${item.costPaise}, ${item.supplier}, true)
        returning id
      `
      itemId = row?.id
    }
    if (!itemId) continue

    const openingNote = 'Opening stock, imported'
    const [opening] = await sql`
      select id from inventory_movements
      where org_id = ${orgId} and item_id = ${itemId} and note = ${openingNote} limit 1
    `
    if (!opening) {
      await sql`
        insert into inventory_movements (org_id, item_id, delta_milli, reason, note, created_at)
        values (${orgId}, ${itemId}, ${item.openingMilli}, 'opening', ${openingNote}, now() - interval '12 days')
      `
    }
    if (item.receiptMilli) {
      const receiptNote = `Goods received from ${item.supplier}`
      const [receipt] = await sql`
        select id from inventory_movements
        where org_id = ${orgId} and item_id = ${itemId} and note = ${receiptNote} limit 1
      `
      if (!receipt) {
        await sql`
          insert into inventory_movements (org_id, item_id, delta_milli, reason, note, created_at)
          values (${orgId}, ${itemId}, ${item.receiptMilli}, 'purchase', ${receiptNote}, now() - interval '5 days')
        `
      }
    }
  }

  // ── Published work ────────────────────────────────────────────────────────
  for (const [index, work] of PORTFOLIO.entries()) {
    const [existing] = await sql`
      select id from portfolio_items where org_id = ${orgId} and title = ${work.title} limit 1
    `
    if (existing) {
      await sql`
        update portfolio_items set event_date = ${work.date}::date, venue_name = ${work.venue},
          description = ${work.description}, published = true, sort_order = ${index}
        where id = ${existing.id}
      `
      continue
    }
    await sql`
      insert into portfolio_items
        (org_id, title, event_date, venue_name, description, published, sort_order)
      values (${orgId}, ${work.title}, ${work.date}::date, ${work.venue}, ${work.description}, true, ${index})
    `
  }

  // ── Storefront layout and owner-written content ───────────────────────────
  // Deterministic ids: a re-run must produce the same section content, or the
  // published fingerprint would change every time and pile up versions.
  const stableId = (seed: string) => {
    const hex = createHash('sha256').update(seed).digest('hex')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
  }

  const sectionConfig = (key: string) => {
    if (key === 'faq') {
      return { faq: FAQ.map((item, index) => ({ id: stableId(`faq:${index}`), ...item })) }
    }
    if (key === 'team') {
      return { team: TEAM_CARDS.map((item, index) => ({ id: stableId(`team:${index}`), ...item })) }
    }
    if (key === 'testimonials') {
      return {
        testimonials: TESTIMONIALS.map((item, index) => ({
          id: stableId(`testimonial:${index}`),
          ...item,
        })),
      }
    }
    return {}
  }

  for (const [position, section] of LAYOUT.entries()) {
    const config = sectionConfig(section.key)
    await sql`
      insert into storefront_sections (org_id, key, position, visible, heading, config)
      values (${orgId}, ${section.key}, ${position}, true, ${section.heading}, ${json(config)}::jsonb)
      on conflict (org_id, key) do update set
        position = excluded.position,
        visible = true,
        heading = excluded.heading,
        config = excluded.config,
        updated_at = now()
    `
  }

  // ── Availability and last week's traffic ──────────────────────────────────
  for (const block of BLOCKED_DATES) {
    await sql`
      insert into availability_blocks (org_id, date, status, reason)
      values (${orgId}, ${block.date}::date, 'blocked', ${block.reason})
      on conflict (org_id, date) do nothing
    `
  }

  for (const view of STOREFRONT_VIEWS) {
    const day = dateAgo(view.daysAgo)
    const bucket = `${view.path}|${view.referrerHost}|${view.utmSource}`
    await sql`
      insert into storefront_views
        (org_id, day, bucket, path, referrer_host, utm_source, utm_medium, utm_campaign, views)
      values
        (${orgId}, ${day}::date, ${bucket}, ${view.path}, ${view.referrerHost},
         ${view.utmSource}, '', '', ${view.views})
      on conflict (org_id, day, bucket) do update set
        views = greatest(storefront_views.views, excluded.views),
        updated_at = now()
    `
  }

  const [counts] = (await sql`
    select
      (select count(*)::int from memberships where org_id = ${orgId}) as crew,
      (select count(*)::int from clients where org_id = ${orgId}) as clients,
      (select count(*)::int from suppliers where org_id = ${orgId}) as suppliers,
      (select count(*)::int from inventory_items where org_id = ${orgId}) as inventory,
      (select count(*)::int from portfolio_items where org_id = ${orgId}) as portfolio
  `) as unknown as { crew: number; clients: number; suppliers: number; inventory: number; portfolio: number }[]

  return {
    crew: Number(counts?.crew ?? 0),
    clients: Number(counts?.clients ?? 0),
    suppliers: Number(counts?.suppliers ?? 0),
    inventory: Number(counts?.inventory ?? 0),
    portfolio: Number(counts?.portfolio ?? 0),
  }
}

/** Publish the current draft rows as a new immutable storefront version. */
export async function publishStorefrontData(
  sql: Sql,
  orgId: string,
  userId: string | null,
): Promise<{ version: number; sections: number }> {
  const json = jsonOf(sql)

  const [business] = (await sql`
    select name, tagline, city, phone, settings from businesses where org_id = ${orgId} limit 1
  `) as unknown as {
    name: string
    tagline: string | null
    city: string | null
    phone: string | null
    settings: {
      brand?: Record<string, string>
      about?: string
      seo?: { title?: string; description?: string; noindex?: boolean }
    } | null
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
  const brand = business.settings?.brand ?? {}

  const snapshot = buildStorefrontSnapshot({
    name: business.name,
    tagline: business.tagline,
    city: business.city,
    phone: business.phone,
    theme: brand.theme,
    font: brand.font,
    primary: brand.primary,
    subtitle: brand.subtitle ?? null,
    about: business.settings?.about ?? null,
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
    seo: {
      title: business.settings?.seo?.title ?? null,
      description: business.settings?.seo?.description ?? null,
      noindex: business.settings?.seo?.noindex === true,
    },
  })

  await sql`insert into storefronts (org_id) values (${orgId}) on conflict (org_id) do nothing`
  const [storefront] = (await sql`
    select id, published_version_id from storefronts where org_id = ${orgId} limit 1
  `) as unknown as { id: string; published_version_id: string | null }[]
  if (!storefront) throw new Error('No storefront row for this organisation.')

  // A re-run with the same draft is not a new version: compare the fingerprint of
  // what is live and keep the pointer where it is.
  if (storefront.published_version_id) {
    const [current] = await sql`
      select version, snapshot from storefront_versions
      where id = ${storefront.published_version_id} limit 1
    `
    const live = parseStorefrontSnapshot(current?.snapshot)
    if (live && snapshotFingerprint(live) === snapshotFingerprint(snapshot)) {
      return {
        version: Number(current?.version ?? 1),
        sections: snapshot.sections.filter((section) => section.visible).length,
      }
    }
  }

  const [next] = (await sql`
    select coalesce(max(version), 0) + 1 as next_version
    from storefront_versions where storefront_id = ${storefront.id}
  `) as unknown as { next_version: number }[]
  const version = Number(next?.next_version ?? 1)

  const [row] = (await sql`
    insert into storefront_versions
      (org_id, storefront_id, version, schema_version, snapshot, created_by)
    values
      (${orgId}, ${storefront.id}, ${version}, ${snapshot.schemaVersion}, ${json(snapshot)}::jsonb, ${userId})
    returning id
  `) as unknown as { id: string }[]
  if (!row) throw new Error('The version row was not written.')

  await sql`
    update storefronts set
      status = 'published',
      published_version_id = ${row.id},
      published_at = now(),
      updated_at = now()
    where org_id = ${orgId}
  `
  await sql`update businesses set published = true, updated_at = now() where org_id = ${orgId}`

  return { version, sections: snapshot.sections.filter((section) => section.visible).length }
}
