'use server'

import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM || 'EventsMa <noreply@eventsma.in>'

/**
 * Send an email via Resend. Falls back gracefully when Resend is not configured
 * so the rest of the app (signup confirmation links, password resets, quote
 * sharing) keeps working without an email provider.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    // Email provider not configured. The confirmation link is still generated
    // by Supabase and can be copied manually; we just can't deliver it.
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { ok: false, error: `Resend ${response.status}: ${errorText}` }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown email error',
    }
  }
}

/**
 * Send a notification that was queued in the notifications table. Marks it as
 * sent (or records the failure) so the worker loop doesn't retry forever.
 */
export async function sendQueuedNotification(notificationId: string): Promise<void> {
  if (!isDatabaseConfigured()) return

  const db = getDb()
  const [row] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1)

  if (!row || row.status !== 'queued') return

  const payload = row.payload as {
    to?: string
    subject?: string
    html?: string
    text?: string
    kind?: string
  }

  const result = await sendEmail({
    to: payload.to ?? '',
    subject: payload.subject ?? 'EventsMa notification',
    html: payload.html,
    text: payload.text,
  })

  await db
    .update(notifications)
    .set({
      status: result.ok ? 'sent' : 'failed',
      attempts: row.attempts + 1,
      sentAt: result.ok ? new Date() : null,
    })
    .where(eq(notifications.id, notificationId))
}

/**
 * Queue a notification for later delivery.
 */
export async function queueNotification({
  orgId,
  kind,
  channel = 'email',
  to,
  subject,
  html,
  text,
}: {
  orgId: string
  kind: string
  channel?: string
  to?: string
  subject?: string
  html?: string
  text?: string
}): Promise<void> {
  if (!isDatabaseConfigured()) return

  const db = getDb()
  await db.insert(notifications).values({
    orgId,
    kind,
    channel,
    status: 'queued',
    attempts: 0,
    payload: {
      to,
      subject,
      html,
      text,
      kind,
    },
  })
}
