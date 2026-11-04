'use server'

import { and, eq, like, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { invoices, payments, quotationVersions, quotations } from '@/lib/db/schema'
import { parseRupees } from '@/lib/domain/money'
import { PAYMENT_MODES, type PaymentMode } from '@/lib/domain/ops'

const DATE = /^\d{4}-\d{2}-\d{2}$/

function field(formData: FormData, key: string, max = 200): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

/**
 * Numbering is per organisation and per year. The advisory lock serialises two
 * people raising the last invoice of the day; without it both would read the
 * same count and collide on the unique index.
 */
export async function createInvoice(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/invoices?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/invoices?error=demo')

  const quotationId = field(formData, 'quotationId', 64)
  const dueOn = field(formData, 'dueOn', 10)
  if (!quotationId) redirect('/invoices?error=quote')

  const db = getDb()
  const [quote] = await db
    .select({
      id: quotations.id,
      eventId: quotations.eventId,
      totalPaise: quotationVersions.totalPaise,
      taxPaise: quotationVersions.taxPaise,
    })
    .from(quotations)
    .innerJoin(quotationVersions, eq(quotations.currentVersionId, quotationVersions.id))
    .where(
      and(
        eq(quotations.orgId, ctx.orgId),
        eq(quotations.id, quotationId),
        eq(quotations.status, 'accepted'),
      ),
    )
    .limit(1)

  if (!quote) redirect('/invoices?error=quote')

  const created = await db.transaction(async (tx) => {
    const year = new Date().getFullYear()
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`invoice:${ctx.orgId}:${year}`}))`)

    const [existing] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(invoices)
      .where(and(eq(invoices.orgId, ctx.orgId), like(invoices.number, `INV-${year}-%`)))

    const number = `INV-${year}-${String((existing?.n ?? 0) + 1).padStart(4, '0')}`

    const [inserted] = await tx
      .insert(invoices)
      .values({
        orgId: ctx.orgId,
        eventId: quote.eventId,
        quotationId: quote.id,
        number,
        amountPaise: quote.totalPaise,
        taxPaise: quote.taxPaise,
        dueOn: DATE.test(dueOn) ? dueOn : null,
        notes: field(formData, 'notes', 1000) || null,
      })
      .returning({ id: invoices.id })

    return inserted ?? null
  })

  if (!created) redirect('/invoices?error=missing')

  revalidatePath('/invoices')
  revalidatePath(`/events/${quote.eventId}`)
  redirect(`/invoices/${created.id}`)
}

export async function recordPayment(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/invoices?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/invoices?error=demo')

  const invoiceId = field(formData, 'invoiceId', 64)
  const amount = parseRupees(field(formData, 'amount', 20))
  const modeRaw = field(formData, 'mode', 12)
  const mode: PaymentMode = PAYMENT_MODES.find((candidate) => candidate === modeRaw) ?? 'bank'
  const receivedOn = field(formData, 'receivedOn', 10)

  if (!invoiceId || amount === null || amount <= 0 || !DATE.test(receivedOn)) {
    redirect(`/invoices/${invoiceId}?error=payment`)
  }

  const db = getDb()
  const [invoice] = await db
    .select({
      id: invoices.id,
      orgId: invoices.orgId,
      eventId: invoices.eventId,
      quotationId: invoices.quotationId,
      amountPaise: invoices.amountPaise,
      status: invoices.status,
    })
    .from(invoices)
    .where(and(eq(invoices.orgId, ctx.orgId), eq(invoices.id, invoiceId)))
    .limit(1)

  if (!invoice) redirect('/invoices?error=missing')
  if (invoice.status === 'void') redirect(`/invoices/${invoiceId}?error=void`)

  await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      orgId: ctx.orgId,
      invoiceId: invoice.id,
      quotationId: invoice.quotationId,
      eventId: invoice.eventId,
      amountPaise: amount,
      mode,
      status: 'captured',
      receivedAt: new Date(`${receivedOn}T12:00:00.000Z`),
      idempotencyKey: `manual:${randomUUID()}`,
      recordedBy: ctx.userId,
    })

    const [paid] = await tx
      .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
      .from(payments)
      .where(and(eq(payments.invoiceId, invoice.id), eq(payments.status, 'captured')))

    const total = paid?.n ?? 0
    const status = total >= invoice.amountPaise ? 'paid' : total > 0 ? 'part_paid' : 'issued'

    await tx.update(invoices).set({ status }).where(eq(invoices.id, invoice.id))
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/finance')
  revalidatePath('/reports')
  revalidatePath(`/events/${invoice.eventId}`)
  redirect(`/invoices/${invoiceId}?saved=payment`)
}

export async function voidInvoice(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/invoices?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/invoices?error=demo')

  const invoiceId = field(formData, 'invoiceId', 64)
  if (!invoiceId) redirect('/invoices?error=missing')

  const db = getDb()
  const [paid] = await db
    .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
    .from(payments)
    .where(and(eq(payments.orgId, ctx.orgId), eq(payments.invoiceId, invoiceId), eq(payments.status, 'captured')))

  if ((paid?.n ?? 0) > 0) redirect(`/invoices/${invoiceId}?error=has_payments`)

  await db
    .update(invoices)
    .set({ status: 'void' })
    .where(and(eq(invoices.orgId, ctx.orgId), eq(invoices.id, invoiceId)))

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  redirect(`/invoices/${invoiceId}?saved=void`)
}
