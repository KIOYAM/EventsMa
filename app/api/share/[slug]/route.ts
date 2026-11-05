import { NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { eq } from 'drizzle-orm'
import { events } from '@/lib/db/schema'
import { eventServices } from '@/lib/db/schema-services'
import { verticalDescriptor } from '@/lib/domain/verticals'

export const revalidate = 0

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  const db = getDb()

  // Look up event by ID without org restriction (public share link)
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      eventDate: events.eventDate,
      startTime: events.startTime,
      endTime: events.endTime,
      venueName: events.venueName,
      venueAddress: events.venueAddress,
      guests: events.guests,
      status: events.status,
      eventType: events.eventType,
      notes: events.notes,
      orgId: events.orgId,
    })
    .from(events)
    .where(eq(events.id, slug))
    .limit(1)

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Fetch services attached to this event
  const services = await db
    .select({
      id: eventServices.id,
      serviceKey: eventServices.serviceKey,
      status: eventServices.status,
      configSnapshot: eventServices.configSnapshot,
    })
    .from(eventServices)
    .where(eq(eventServices.eventId, event.id))
    .orderBy(eventServices.sortOrder)

  // Resolve service labels from vertical descriptors
  const serviceList = services.map((s) => ({
    id: s.id,
    key: s.serviceKey,
    label: verticalDescriptor(s.serviceKey).label,
    status: s.status,
    configSnapshot: s.configSnapshot ?? {},
  }))

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      guests: event.guests,
      status: event.status,
      eventType: event.eventType,
      notes: event.notes,
    },
    orgId: event.orgId,
    services: serviceList,
  })
}
