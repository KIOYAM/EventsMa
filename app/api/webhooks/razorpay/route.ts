import { NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { payments } from '@/lib/db/schema'
import { isRazorpayConfigured, verifyRazorpayWebhook } from '@/lib/integrations/razorpay'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RazorpayEntity {
  id?: string
  amount?: number
  status?: string
  notes?: Record<string, string>
}

/**
 * Razorpay webhook.
 *
 * Rules: verify the signature over the raw body before parsing; derive the tenant
 * from notes written by our own payment-link call; insert append-only with the
 * gateway payment id as the idempotency key, so a replay adds nothing.
 */
export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!verifyRazorpayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  if (!isRazorpayConfigured() || !isDatabaseConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  let body: { event?: string; payload?: Record<string, { entity?: RazorpayEntity }> }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const event = body.event ?? ''
  if (!['payment.captured', 'payment_link.paid', 'order.paid'].includes(event)) {
    return NextResponse.json({ handled: false, event }, { status: 200 })
  }

  const entity = body.payload?.payment?.entity ?? body.payload?.payment_link?.entity
  const paymentId = entity?.id
  const amountPaise = entity?.amount
  const notes = entity?.notes ?? {}

  // Attribution is mandatory. An unattributed payment is acknowledged and left for
  // manual reconciliation rather than written against a guessed tenant.
  if (!paymentId || typeof amountPaise !== 'number' || !notes.orgId) {
    return NextResponse.json({ handled: false, reason: 'unattributed' }, { status: 200 })
  }

  try {
    await getDb()
      .insert(payments)
      .values({
        orgId: notes.orgId,
        quotationId: notes.quotationId ?? null,
        amountPaise,
        mode: 'razorpay',
        gatewayRef: paymentId,
        status: 'captured',
        idempotencyKey: paymentId,
        receivedAt: new Date(),
      })
      .onConflictDoNothing({ target: payments.idempotencyKey })

    return NextResponse.json({ handled: true }, { status: 200 })
  } catch {
    // 500 asks Razorpay to retry; the idempotency key makes that safe.
    return NextResponse.json({ error: 'write_failed' }, { status: 500 })
  }
}
