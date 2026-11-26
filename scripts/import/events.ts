/**
 * Events and the enquiry inbox.
 *
 * The service detail behind each event lives in `event-details.ts`. Both use
 * (event, natural key) lookups so a re-run refreshes statuses without duplicating
 * rows or deleting anything an owner has since edited.
 */
import type { Sql } from './context'
import { daysAgo, daysAhead } from './context'
import { importEventDetails } from './event-details'
import { ENQUIRIES } from './enquiries-content'
import { EVENTS } from './events-content'
import type { EventSpec } from './types'

export interface EventImport {
  eventIds: Map<string, string>
  added: number
  updated: number
}

async function upsertEvent(
  sql: Sql,
  orgId: string,
  spec: EventSpec,
  clientId: string | null,
): Promise<{ id: string; created: boolean }> {
  const [existing] = await sql`
    select id from events
    where org_id = ${orgId} and title = ${spec.title} and event_date = ${spec.date}::date
    limit 1
  `
  if (existing) {
    await sql`
      update events set
        client_id = ${clientId}, event_type = ${spec.eventType}, start_time = ${spec.start},
        end_time = ${spec.end}, venue_name = ${spec.venue}, venue_address = ${spec.address},
        guests = ${spec.guests}, status = ${spec.status}::event_status, notes = ${spec.notes ?? null}
      where id = ${existing.id}
    `
    return { id: String(existing.id), created: false }
  }
  const [row] = await sql`
    insert into events
      (org_id, client_id, title, event_type, event_date, start_time, end_time,
       venue_name, venue_address, guests, status, notes)
    values
      (${orgId}, ${clientId}, ${spec.title}, ${spec.eventType}, ${spec.date}::date,
       ${spec.start}, ${spec.end}, ${spec.venue}, ${spec.address}, ${spec.guests},
       ${spec.status}::event_status, ${spec.notes ?? null})
    returning id
  `
  return { id: String(row?.id), created: true }
}

async function importServices(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<void> {
  for (const [index, key] of spec.services.entries()) {
    await sql`
      insert into event_services (org_id, event_id, service_key, status, config_snapshot, sort_order)
      values
        (${orgId}, ${eventId}, ${key}, ${spec.status === 'cancelled' ? 'cancelled' : 'planned'},
         ${sql.json({ guests: spec.guests, venue: spec.venue })}, ${index})
      on conflict (event_id, service_key) do update set
        status = excluded.status,
        config_snapshot = excluded.config_snapshot,
        sort_order = excluded.sort_order
    `
  }
}

/** The enquiry inbox, including the follow-up dates that drive the dashboard. */
async function importEnquiries(
  sql: Sql,
  orgId: string,
  clientByName: Map<string, string>,
): Promise<void> {
  for (const enquiry of ENQUIRIES) {
    const clientId = clientByName.get(enquiry.client) ?? null
    const [found] = await sql`
      select id from enquiries
      where org_id = ${orgId} and event_date = ${enquiry.date}::date
        and event_type = ${enquiry.eventType}
        and client_id is not distinct from ${clientId}
      limit 1
    `
    const followUp = enquiry.followUpDays === undefined ? null : daysAhead(enquiry.followUpDays)
    if (found) {
      await sql`
        update enquiries set status = ${enquiry.status}::enquiry_status, guests = ${enquiry.guests},
          message = ${enquiry.message}, source = ${enquiry.source},
          next_follow_up_at = ${followUp}
        where id = ${found.id}
      `
      continue
    }
    await sql`
      insert into enquiries
        (org_id, client_id, event_date, guests, event_type, message, status, source,
         landing_section, utm_source, next_follow_up_at, created_at)
      values
        (${orgId}, ${clientId}, ${enquiry.date}::date, ${enquiry.guests}, ${enquiry.eventType},
         ${enquiry.message}, ${enquiry.status}::enquiry_status, ${enquiry.source},
         ${enquiry.landingSection ?? null}, ${enquiry.utmSource ?? null}, ${followUp},
         ${daysAgo(enquiry.daysAgo)})
    `
  }
}

export async function importEvents(sql: Sql, orgId: string): Promise<EventImport> {
  const clients = await sql`select id, name from clients where org_id = ${orgId}`
  const clientByName = new Map(clients.map((row) => [String(row.name), String(row.id)]))

  await importEnquiries(sql, orgId, clientByName)

  const eventIds = new Map<string, string>()
  let added = 0
  let updated = 0

  for (const spec of EVENTS) {
    const clientId = clientByName.get(spec.client) ?? null
    const { id, created } = await upsertEvent(sql, orgId, spec, clientId)
    if (!id) continue
    if (created) added += 1
    else updated += 1
    eventIds.set(spec.title, id)

    await importServices(sql, orgId, id, spec)
    await importEventDetails(sql, orgId, id, spec)
  }

  // A won enquiry is the record that produced the event, so link them where the
  // client and date agree. Safe to repeat: only unlinked rows are touched.
  await sql`
    update events e set enquiry_id = en.id
    from enquiries en
    where e.org_id = ${orgId} and en.org_id = e.org_id
      and en.client_id = e.client_id and en.event_date = e.event_date
      and en.status in ('won', 'quoted') and e.enquiry_id is null
  `

  return { eventIds, added, updated }
}
