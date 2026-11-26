/**
 * The service detail behind one event: catering sessions and their dishes, decor
 * areas and build slots, photo coverage and the shot list, the makeup chair, and
 * the run of show.
 */
import type { Sql } from './context'
import { at } from './context'
import type { EventSpec, ShotSpec } from './types'

const WEDDING_SHOTS: ShotSpec[] = [
  { moment: 'Getting ready', description: 'Bride and groom preparations, rings and jewellery.', priority: 'high' },
  { moment: 'Muhurtham', description: 'The moment the thaali is tied, wide and tight.', priority: 'must_capture' },
  { moment: 'Family groups', description: 'Both families by side, then the cousins.', priority: 'high' },
  { moment: 'Mandap details', description: 'Flowers, lamps and the stage from three angles.', priority: 'normal' },
  { moment: 'Lunch service', description: 'Banana leaf service and the kitchen crew.', priority: 'normal' },
  { moment: 'Evening portraits', description: 'Couple portraits in the last light.', priority: 'high' },
]

const RECEPTION_SHOTS: ShotSpec[] = [
  { moment: 'Stage entry', description: 'Couple arriving and the first garland exchange.', priority: 'must_capture' },
  { moment: 'Speeches', description: 'Family and friends speaking on stage.', priority: 'normal' },
  { moment: 'Decor wide', description: 'The lawn and lighting from the far corner.', priority: 'normal' },
  { moment: 'Dinner service', description: 'Counters, guests and the crew at work.', priority: 'normal' },
]

async function importCatering(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<void> {
  if (!spec.catering) return
  const menu = await sql`
    select id, name, unit_class, unit_label, price_paise, dietary
    from service_items where org_id = ${orgId} and vertical_key = 'catering'
  `
  const byName = new Map(menu.map((row) => [String(row.name), row]))

  for (const [index, session] of spec.catering.entries()) {
    const [existing] = await sql`
      select id from event_catering_sessions
      where org_id = ${orgId} and event_id = ${eventId} and name = ${session.name}
      limit 1
    `
    let sessionId = existing?.id as string | undefined
    if (sessionId) {
      await sql`
        update event_catering_sessions set
          session_date = ${spec.date}::date, start_time = ${spec.start}, end_time = ${spec.end},
          guest_count = ${session.guests}, service_style = ${session.style}, status = ${session.status}
        where id = ${sessionId}
      `
    } else {
      const [row] = await sql`
        insert into event_catering_sessions
          (org_id, event_id, name, session_date, start_time, end_time, guest_count,
           service_style, status, sort_order)
        values
          (${orgId}, ${eventId}, ${session.name}, ${spec.date}::date, ${spec.start},
           ${spec.end}, ${session.guests}, ${session.style}, ${session.status}, ${index})
        returning id
      `
      sessionId = row?.id as string | undefined
    }
    if (!sessionId) continue

    for (const name of session.menu) {
      const item = byName.get(name)
      if (!item) continue
      await sql`
        insert into session_menu_items
          (org_id, event_session_id, item_id, name_snapshot, unit_snapshot, unit_price_paise,
           unit_class_snapshot, dietary_snapshot, quantity, note)
        values
          (${orgId}, ${sessionId}, ${item.id}, ${name}, ${item.unit_label ?? null},
           ${Number(item.price_paise)}, ${item.unit_class}, ${item.dietary ?? null}, 1, null)
        on conflict (event_session_id, item_id) do update set
          name_snapshot = excluded.name_snapshot,
          unit_price_paise = excluded.unit_price_paise,
          unit_class_snapshot = excluded.unit_class_snapshot,
          dietary_snapshot = excluded.dietary_snapshot
      `
    }

    for (const [profileKey, count] of Object.entries(session.diet ?? {})) {
      await sql`
        insert into session_dietary_counts (org_id, event_session_id, profile_key, count)
        values (${orgId}, ${sessionId}, ${profileKey}, ${count})
        on conflict (event_session_id, profile_key) do update set count = excluded.count
      `
    }
  }
}

async function importDecor(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<void> {
  for (const [index, area] of (spec.decor ?? []).entries()) {
    const [existing] = await sql`
      select id from decoration_areas
      where org_id = ${orgId} and event_id = ${eventId} and name = ${area.area}
      limit 1
    `
    let areaId = existing?.id as string | undefined
    if (areaId) {
      await sql`
        update decoration_areas set area_type = ${area.type}, dimensions = ${area.dimensions},
          setup_notes = ${area.notes}, sort_order = ${index}
        where id = ${areaId}
      `
    } else {
      const [row] = await sql`
        insert into decoration_areas
          (org_id, event_id, name, area_type, dimensions, setup_notes, sort_order, active)
        values (${orgId}, ${eventId}, ${area.area}, ${area.type}, ${area.dimensions},
                ${area.notes}, ${index}, true)
        returning id
      `
      areaId = row?.id as string | undefined
    }
    if (!areaId) continue

    const [setup] = await sql`
      select id from decoration_setups
      where org_id = ${orgId} and event_id = ${eventId} and area_id = ${areaId} limit 1
    `
    const status = area.status ?? (spec.status === 'completed' ? 'completed' : 'scheduled')
    if (setup) {
      await sql`
        update decoration_setups set status = ${status}, crew_assigned = ${area.crew},
          notes = ${area.notes}
        where id = ${setup.id}
      `
    } else {
      await sql`
        insert into decoration_setups
          (org_id, event_id, area_id, setup_start, setup_end, teardown_start, teardown_end,
           status, crew_assigned, notes, sort_order)
        values
          (${orgId}, ${eventId}, ${areaId}, ${at(spec.date, '02:00')}, ${at(spec.date, '06:00')},
           ${at(spec.date, '21:00')}, ${at(spec.date, '23:30')}, ${status},
           ${area.crew}, ${area.notes}, ${index})
      `
    }
  }
}

async function importPhotography(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<void> {
  const photo = spec.photography
  if (!photo) return

  const [existing] = await sql`
    select id from photography_coverage
    where org_id = ${orgId} and event_id = ${eventId} and coverage_type = ${photo.coverage}
    limit 1
  `
  let coverageId = existing?.id as string | undefined
  if (coverageId) {
    await sql`
      update photography_coverage set coverage_start = ${at(spec.date, photo.start)},
        coverage_end = ${at(spec.date, photo.end)}, location = ${spec.venue},
        shot_list_notes = ${photo.notes}
      where id = ${coverageId}
    `
  } else {
    const [row] = await sql`
      insert into photography_coverage
        (org_id, event_id, coverage_type, coverage_start, coverage_end, location,
         shot_list_notes, sort_order, active)
      values
        (${orgId}, ${eventId}, ${photo.coverage}, ${at(spec.date, photo.start)},
         ${at(spec.date, photo.end)}, ${spec.venue}, ${photo.notes}, 0, true)
      returning id
    `
    coverageId = row?.id as string | undefined
  }

  for (const [index, name] of photo.crew.entries()) {
    const [found] = await sql`
      select id from photography_assignments
      where org_id = ${orgId} and event_id = ${eventId} and photographer_name = ${name}
      limit 1
    `
    if (found) continue
    const role = index === 0 ? 'photographer' : index === 1 ? 'second_shooter' : 'assistant'
    await sql`
      insert into photography_assignments
        (org_id, event_id, coverage_id, photographer_name, role, equipment, sort_order)
      values
        (${orgId}, ${eventId}, ${coverageId ?? null}, ${name}, ${role},
         ${index === 0 ? 'Sony A7 IV, 24-70mm, 85mm' : 'Sony A7 III, 35mm'}, ${index})
    `
  }

  const shots = photo.shots ?? (spec.eventType === 'Reception' ? RECEPTION_SHOTS : WEDDING_SHOTS)
  for (const shot of shots) {
    const [found] = await sql`
      select id from photography_shot_lists
      where org_id = ${orgId} and event_id = ${eventId} and moment = ${shot.moment}
      limit 1
    `
    if (found) continue
    await sql`
      insert into photography_shot_lists (org_id, event_id, moment, description, priority, captured)
      values
        (${orgId}, ${eventId}, ${shot.moment}, ${shot.description},
         ${shot.priority}, ${spec.status === 'completed'})
    `
  }

  for (const deliverable of photo.deliverables ?? []) {
    const [found] = await sql`
      select id from photography_deliverables
      where org_id = ${orgId} and event_id = ${eventId} and deliverable_type = ${deliverable.type}
      limit 1
    `
    if (found) {
      await sql`
        update photography_deliverables set quantity = ${deliverable.qty},
          status = ${deliverable.status}, delivery_date = ${deliverable.date ?? null}::date
        where id = ${found.id}
      `
      continue
    }
    await sql`
      insert into photography_deliverables
        (org_id, event_id, deliverable_type, quantity, status, delivery_date)
      values
        (${orgId}, ${eventId}, ${deliverable.type}, ${deliverable.qty},
         ${deliverable.status}, ${deliverable.date ?? null}::date)
    `
  }
}

async function importMakeup(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<void> {
  const artists = await sql`select id, name from makeup_artists where org_id = ${orgId}`
  const artistByName = new Map(artists.map((row) => [String(row.name), String(row.id)]))

  for (const appointment of spec.makeup ?? []) {
    const [found] = await sql`
      select id from makeup_appointments
      where org_id = ${orgId} and event_id = ${eventId}
        and client_name = ${appointment.client} and service_type = ${appointment.style}
      limit 1
    `
    const status = spec.status === 'completed' ? 'completed' : 'scheduled'
    if (found) {
      await sql`
        update makeup_appointments set appointment_start = ${at(spec.date, appointment.start)},
          appointment_end = ${at(spec.date, appointment.end)}, location = ${spec.venue},
          status = ${status}
        where id = ${found.id}
      `
      continue
    }
    await sql`
      insert into makeup_appointments
        (org_id, event_id, artist_id, client_name, service_type, appointment_start,
         appointment_end, location, travel_required, travel_fee_paise, status, notes)
      values
        (${orgId}, ${eventId}, ${artistByName.get(appointment.artist) ?? null},
         ${appointment.client}, ${appointment.style}, ${at(spec.date, appointment.start)},
         ${at(spec.date, appointment.end)}, ${spec.venue}, ${appointment.travel === true},
         ${appointment.travel ? 300000 : 0}, ${status}, null)
    `
  }

  for (const trial of spec.trials ?? []) {
    const [found] = await sql`
      select id from makeup_trials
      where org_id = ${orgId} and event_id = ${eventId} and client_name = ${trial.client}
      limit 1
    `
    if (found) {
      await sql`
        update makeup_trials set trial_date = ${trial.date}::date, makeup_style = ${trial.style},
          approved = ${trial.approved}
        where id = ${found.id}
      `
      continue
    }
    await sql`
      insert into makeup_trials
        (org_id, event_id, client_name, trial_date, trial_start, trial_end, makeup_style,
         approved, approval_notes)
      values
        (${orgId}, ${eventId}, ${trial.client}, ${trial.date}::date,
         ${at(trial.date, '11:00')}, ${at(trial.date, '12:30')}, ${trial.style},
         ${trial.approved}, ${trial.approved ? 'Approved at the Gudalur studio' : null})
    `
  }
}

async function importRunOfShow(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<void> {
  for (const [index, task] of (spec.tasks ?? []).entries()) {
    const [found] = await sql`
      select id from event_tasks
      where org_id = ${orgId} and event_id = ${eventId} and title = ${task.title} limit 1
    `
    if (found) {
      await sql`update event_tasks set due_on = ${task.due}::date, status = ${task.status} where id = ${found.id}`
      continue
    }
    await sql`
      insert into event_tasks (org_id, event_id, title, due_on, status, sort_order)
      values (${orgId}, ${eventId}, ${task.title}, ${task.due}::date, ${task.status}, ${index})
    `
  }

  for (const vendor of spec.vendors ?? []) {
    const [found] = await sql`
      select id from event_vendors
      where org_id = ${orgId} and event_id = ${eventId} and name = ${vendor.name} limit 1
    `
    if (found) {
      await sql`update event_vendors set amount_paise = ${vendor.amount}, status = ${vendor.status} where id = ${found.id}`
      continue
    }
    await sql`
      insert into event_vendors (org_id, event_id, name, category, amount_paise, status)
      values (${orgId}, ${eventId}, ${vendor.name}, ${vendor.category}, ${vendor.amount}, ${vendor.status})
    `
  }

  const members = await sql`select id, display_name from memberships where org_id = ${orgId}`
  const memberByName = new Map(members.map((row) => [String(row.display_name ?? ''), String(row.id)]))

  for (const shift of spec.staff ?? []) {
    const membershipId = memberByName.get(shift.member)
    if (!membershipId) continue
    await sql`
      insert into event_staff (org_id, event_id, membership_id, role_label, shift_start, shift_end)
      values (${orgId}, ${eventId}, ${membershipId}, ${shift.role}, ${shift.start}, ${shift.end})
      on conflict (event_id, membership_id) do update set
        role_label = excluded.role_label,
        shift_start = excluded.shift_start,
        shift_end = excluded.shift_end
    `
  }
}

export async function importEventDetails(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<void> {
  await importCatering(sql, orgId, eventId, spec)
  await importDecor(sql, orgId, eventId, spec)
  await importPhotography(sql, orgId, eventId, spec)
  await importMakeup(sql, orgId, eventId, spec)
  await importRunOfShow(sql, orgId, eventId, spec)
}
