import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { eq } from 'drizzle-orm'
import { events, enquiries, clients } from '@/lib/db/schema'

export const revalidate = 0

const SubmitSchema = z.object({
  eventId: z.string().uuid(),
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().max(24).optional(),
  selections: z.record(z.string(), z.any()),
  message: z.string().max(1000).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  const body = await request.json()
  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid submission' },
      { status: 400 }
    )
  }

  const { eventId, clientName, clientEmail, clientPhone, selections, message } = parsed.data
  const db = getDb()

  // Verify the event exists and matches the slug
  const [event] = await db
    .select({ id: events.id, orgId: events.orgId })
    .from(events)
    .where(eq(events.id, slug))
    .limit(1)

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Create or find client
  let clientId: string | null = null
  if (clientPhone || clientEmail) {
    const [existing] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        eq(clients.orgId, event.orgId)
      )
      .limit(1)
    // Simple lookup by phone or email
    if (clientPhone) {
      const [byPhone] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.phone, clientPhone))
        .limit(1)
      if (byPhone) clientId = byPhone.id
    }
    if (!clientId && clientEmail) {
      const [byEmail] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.email, clientEmail))
        .limit(1)
      if (byEmail) clientId = byEmail.id
    }
  }

  // Create client if not found
  if (!clientId) {
    const [newClient] = await db
      .insert(clients)
      .values({
        orgId: event.orgId,
        name: clientName,
        phone: clientPhone ?? null,
        email: clientEmail ?? null,
        source: 'public_share',
      })
      .returning({ id: clients.id })
    clientId = newClient!.id
  }

  // Create enquiry
  const [enquiry] = await db
    .insert(enquiries)
    .values({
      orgId: event.orgId,
      clientId: clientId ?? undefined,
      eventId: event.id,
      eventDate: null,
      guests: 0,
      eventType: null,
      message: message ?? null,
      status: 'new',
      source: 'public_share',
    } as any)
    .returning({ id: enquiries.id })

  const enquiryId = enquiry?.id

  return NextResponse.json({
    ok: true,
    enquiryId,
    message: 'Your selections have been submitted. The event owner will review and contact you with a quotation.',
  })
}
