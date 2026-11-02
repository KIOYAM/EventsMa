import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Razorpay server helpers. The browser never sees the key secret: a payment link
 * is created server-side and only its short URL is returned to the page.
 */

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export interface PaymentLinkInput {
  amountPaise: number
  description: string
  referenceId: string
  callbackUrl?: string
  notes?: Record<string, string>
}

export interface PaymentLinkResult {
  id: string
  shortUrl: string
}

export async function createRazorpayPaymentLink(
  input: PaymentLinkInput,
): Promise<PaymentLinkResult> {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured')

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(input.amountPaise),
      currency: 'INR',
      accept_partial: false,
      description: input.description.slice(0, 200),
      reference_id: input.referenceId.slice(0, 40),
      ...(input.callbackUrl ? { callback_url: input.callbackUrl, callback_method: 'get' } : {}),
      notes: input.notes ?? {},
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`Razorpay rejected the payment link (${response.status})`)
  }

  const data = (await response.json()) as { id?: string; short_url?: string }
  if (!data.id || !data.short_url) throw new Error('Razorpay returned an incomplete link')
  return { id: data.id, shortUrl: data.short_url }
}

/** HMAC-SHA256 of the raw request body, compared in constant time. */
export function verifyRazorpayWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
