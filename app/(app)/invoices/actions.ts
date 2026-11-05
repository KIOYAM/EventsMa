'use server'

import { and, eq, like, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { auditEvents, invoices, payments, quotationVersions, quotations } from '@/lib/db/schema'
import { parseRupees } from '@/lib/domain/money'
import { PAYMENT_MODES, type PaymentMode } from '@/lib/domain/ops'

const DATE = /^\d{4}-\d{2}-\d{2}$/

function field(formData: FormData, key: string, max = 200): string {
  return String(formData.get(key) ?? '').trim().slice(0, max)
}

async function audit(
  values: {
    orgId: string
    actorId: string | null
    action: string
    entity: string
    entityId: string
    after?: Record<string, unknown>
  },
): Promise<void> {
  try {
    await getDb().insert(auditEvents).values({
      orgId: values.orgId,
      actorId: values.actorId,
      action: values.action,
      entity: values.entity,
      entityId: values.entityId,
      after: values.after ?? {},
    })
  } catch {
    // Never let an audit write turn a successful money action into an error.
  }
}

/**
 * Numbering is per organisation and per year. The advisory lock serialises two
 * people raising the last invoice of the day; the unique quotation index makes
 * the second click on "Create invoice" return the first invoice, not a copy.
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

  const [already] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.orgId, ctx.orgId), eq(invoices.quotationId, quote.id)))
    .limit(1)

  if (already) redirect(`/invoices/${already.id}?saved=existing`)

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
      .onConflictDoNothing()
      .returning({ id: invoices.id })

    return inserted ?? null
  })

  // A concurrent request can win the insert race. Return its invoice rather
  // than showing the user an error for a click that did create the document.
  if (!created) {
    const [existing] = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.orgId, ctx.orgId), eq(invoices.quotationId, quote.id)))
      .limit(1)
    if (existing) redirect(`/invoices/${existing.id}?saved=existing`)
    redirect('/invoices?error=missing')
  }

  await audit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'invoice.created',
    entity: 'invoice',
    entityId: created.id,
    after: { quotationId: quote.id, amountPaise: quote.totalPaise },
  })

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
  const reference = field(formData, 'reference', 120)
  const paymentToken = field(formData, 'paymentToken', 80) || randomUUID()

  if (!invoiceId || amount === null || amount <= 0 || !DATE.test(receivedOn)) {
    redirect(`/invoices/${invoiceId}?error=payment`)
  }

  const db = getDb()
  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx
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
      .for('update')

    if (!invoice) return { kind: 'missing' as const }
    if (invoice.status === 'void') return { kind: 'void' as const }

    const [paidRow] = await tx
      .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
      .from(payments)
      .where(and(eq(payments.invoiceId, invoice.id), eq(payments.status, 'captured')))

    const received = paidRow?.n ?? 0
    const balance = Math.max(0, invoice.amountPaise - received)
    if (balance <= 0) return { kind: 'settled' as const, eventId: invoice.eventId }
    if (amount > balance) return { kind: 'overpay' as const, eventId: invoice.eventId }

    const idempotencyKey = `manual:${invoice.id}:${paymentToken}`

    await tx
      .insert(payments)
      .values({
        orgId: ctx.orgId,
        invoiceId: invoice.id,
        quotationId: invoice.quotationId,
        eventId: invoice.eventId,
        amountPaise: amount,
        mode,
        gatewayRef: reference || null,
        status: 'captured',
        receivedAt: new Date(`${receivedOn}T12:00:00.000Z`),
        idempotencyKey,
        recordedBy: ctx.userId,
      })
      .onConflictDoNothing()

    const [afterPaid] = await tx
      .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
      .from(payments)
      .where(and(eq(payments.invoiceId, invoice.id), eq(payments.status, 'captured')))

    const total = afterPaid?.n ?? 0
    const status = total >= invoice.amountPaise ? 'paid' : total > 0 ? 'part_paid' : 'issued'

    await tx.update(invoices).set({ status }).where(eq(invoices.id, invoice.id))

    return { kind: 'ok' as const, eventId: invoice.eventId }
  })

  if (result.kind === 'missing') redirect('/invoices?error=missing')
  if (result.kind === 'void') redirect(`/invoices/${invoiceId}?error=void`)
  if (result.kind === 'overpay') redirect(`/invoices/${invoiceId}?error=overpay`)
  if (result.kind === 'settled') redirect(`/invoices/${invoiceId}?saved=settled`)

  await audit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'payment.recorded',
    entity: 'invoice',
    entityId: invoiceId,
    after: { amountPaise: amount, mode, reference: reference || null },
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/finance')
  revalidatePath('/reports')
  revalidatePath(`/events/${result.eventId}`)
  redirect(`/invoices/${invoiceId}?saved=payment`)
}

/**
 * A manual "paid in full" is still a payment row, never a status flag edited in
 * place. That keeps the ledger and the invoice status impossible to disagree.
 */
export async function markInvoicePaid(formData: FormData): Promise<void> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) redirect('/invoices?error=permission')
  if (ctx.demo || !isDatabaseConfigured()) redirect('/invoices?error=demo')

  const invoiceId = field(formData, 'invoiceId', 64)
  const paymentToken = field(formData, 'paidToken', 80) || randomUUID()
  if (!invoiceId) redirect('/invoices?error=missing')

  const db = getDb()
  const result = await db.transaction(async (tx) => {
    const [invoice] = await tx
      .select({
        id: invoices.id,
        eventId: invoices.eventId,
        quotationId: invoices.quotationId,
        amountPaise: invoices.amountPaise,
        status: invoices.status,
      })
      .from(invoices)
      .where(and(eq(invoices.orgId, ctx.orgId), eq(invoices.id, invoiceId)))
      .limit(1)
      .for('update')

    if (!invoice) return { kind: 'missing' as const }
    if (invoice.status === 'void') return { kind: 'void' as const }

    const [paidRow] = await tx
      .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
      .from(payments)
      .where(and(eq(payments.invoiceId, invoice.id), eq(payments.status, 'captured')))

    const balance = Math.max(0, invoice.amountPaise - (paidRow?.n ?? 0))
    if (balance === 0) return { kind: 'settled' as const, eventId: invoice.eventId }

    await tx
      .insert(payments)
      .values({
        orgId: ctx.orgId,
        invoiceId: invoice.id,
        quotationId: invoice.quotationId,
        eventId: invoice.eventId,
        amountPaise: balance,
        mode: 'other',
        gatewayRef: 'Marked paid in full',
        status: 'captured',
        receivedAt: new Date(),
        idempotencyKey: `manual:${invoice.id}:${paymentToken}`,
        recordedBy: ctx.userId,
      })
      .onConflictDoNothing()

    const [afterPaid] = await tx
      .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
      .from(payments)
      .where(and(eq(payments.invoiceId, invoice.id), eq(payments.status, 'captured')))

    await tx
      .update(invoices)
      .set({ status: (afterPaid?.n ?? 0) >= invoice.amountPaise ? 'paid' : 'part_paid' })
      .where(eq(invoices.id, invoice.id))

    return { kind: 'ok' as const, eventId: invoice.eventId, amountPaise: balance }
  })

  if (result.kind === 'missing') redirect('/invoices?error=missing')
  if (result.kind === 'void') redirect(`/invoices/${invoiceId}?error=void`)
  if (result.kind === 'settled') redirect(`/invoices/${invoiceId}?saved=settled`)

  await audit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'invoice.marked_paid',
    entity: 'invoice',
    entityId: invoiceId,
    after: { amountPaise: result.amountPaise },
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath('/finance')
  revalidatePath('/reports')
  revalidatePath(`/events/${result.eventId}`)
  redirect(`/invoices/${invoiceId}?saved=paid`)
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

  const [updated] = await db
    .update(invoices)
    .set({ status: 'void' })
    .where(and(eq(invoices.orgId, ctx.orgId), eq(invoices.id, invoiceId)))
    .returning({ eventId: invoices.eventId })

  if (!updated) redirect('/invoices?error=missing')

  await audit({
    orgId: ctx.orgId,
    actorId: ctx.userId,
    action: 'invoice.voided',
    entity: 'invoice',
    entityId: invoiceId,
  })

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath(`/events/${updated.eventId}`)
  redirect(`/invoices/${invoiceId}?saved=void`)
}
