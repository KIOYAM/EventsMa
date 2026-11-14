import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createShareSubmission } from '@/lib/db/share'
import { sendEmail } from '@/lib/email'

export const revalidate = 0

const SelectionSchema = z.object({
  serviceKey: z.string().min(1).max(64),
  itemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10_000).optional(),
})

const SubmitSchema = z.object({
  clientName: z.string().trim().min(1).max(120),
  clientEmail: z.string().trim().email().max(160).optional().or(z.literal('')),
  clientPhone: z.string().trim().max(24).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  selections: z.array(SelectionSchema).min(1).max(200),
})

/**
 * Public submission endpoint.
 *
 * Authorisation is the share token in the path, not a session. The token is
 * re-resolved server-side, the service must still be enabled, and every item is
 * re-checked against the organisation's own catalogue. All writes are one
 * transaction inside createShareSubmission.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!slug) return NextResponse.json({ ok: false, error: 'Missing link' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }

  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Please check your details and choose at least one item.' },
      { status: 400 },
    )
  }

  const data = parsed.data
  const result = await createShareSubmission({
    token: slug,
    clientName: data.clientName,
    clientEmail: data.clientEmail || null,
    clientPhone: data.clientPhone || null,
    message: data.message || null,
    selections: data.selections,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
  }

  // Notify the owner. Delivery failure never fails the customer's submission:
  // the row and the in-app notification already exist.
  if (result.businessEmail && !result.duplicate) {
    try {
      await sendEmail({
        to: result.businessEmail,
        subject: `New event enquiry from ${data.clientName}`,
        text: [
          `${data.clientName} submitted a request through your share link.`,
          data.clientPhone ? `Phone: ${data.clientPhone}` : '',
          data.clientEmail ? `Email: ${data.clientEmail}` : '',
          data.message ? `Note: ${data.message}` : '',
          'Open EventsMa → Submissions to review and prepare a quotation.',
        ]
          .filter(Boolean)
          .join('\n'),
      })
    } catch {
      // Swallowed on purpose; the queued notification row is the durable record.
    }
  }

  return NextResponse.json({
    ok: true,
    submissionId: result.submissionId,
    duplicate: result.duplicate,
    message:
      'Thank you for sharing your event requirements. Our team has received your request and will contact you shortly with a customized quotation.',
  })
}
