'use server'

import { createHash, randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  events,
  quotationLines,
  quotationVersions,
  quotations,
  quoteCounters,
  usageEvents,
} from '@/lib/db/schema'
import { computeQuote } from '@/lib/domain/pricing'
import type { UnitClass } from '@/lib/domain/units'
import { saveQuoteSchema } from '@/lib/validation/quote'

type SaveResult =
  | { ok: true; quotationId: string; number: string }
  | { ok: false; error: string }

/**
 * The server is the authority on every total.
 *
 * The composer sends a preview; this action recomputes from the payload, stores the
 * frozen version, and returns the number. A client total that disagrees is recorded
 * as telemetry and then ignored — the server value wins.
 */
export async function saveQuotation(input: unknown): Promise<SaveResult> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) {
    return { ok: false, error: 'Only an owner or manager can send a quotation.' }
  }

  const parsed = saveQuoteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Some quote details are missing or out of range.' }
  }
  const data = parsed.data

  if (ctx.demo || !isDatabaseConfigured()) {
    return { ok: false, error: 'Demo mode: connect a database before saving a quotation.' }
  }

  const computed = computeQuote({
    guests: data.guests,
    lines: data.lines.map((line) => ({
      id: line.id,
      serviceKey: line.serviceKey,
      label: line.label,
      unitClass: line.unitClass as UnitClass,
      unitRatePaise: line.unitRatePaise,
      quantity: line.quantity,
      minQuantity: line.minQuantity ?? 0,
      includedInPackage: line.includedInPackage ?? false,
      taxRateBp: line.taxRateBp,
      costPerUnitPaise: line.costPerUnitPaise ?? 0,
    })),
    orderDiscount:
      data.discountValue > 0
        ? { kind: data.discountKind, value: data.discountValue, reason: data.discountReason }
        : null,
  })

  const contentHash = createHash('sha256')
    .update(JSON.stringify(computed.lines))
    .digest('hex')

  const db = getDb()

  try {
    const saved = await db.transaction(async (tx) => {
      let eventId = data.eventId
      if (!eventId) {
        const [createdEvent] = await tx
          .insert(events)
          .values({
            orgId: ctx.orgId,
            clientId: data.clientId ?? null,
            title: data.title,
            eventDate: data.eventDate,
            guests: data.guests,
            venueName: data.venueName ?? null,
            status: 'tentative',
          })
          .returning({ id: events.id })

        if (!createdEvent) throw new Error('Could not create the event record.')
        eventId = createdEvent.id
      }

      const year = Number(data.eventDate.slice(0, 4)) || new Date().getFullYear()
      const [counter] = await tx
        .insert(quoteCounters)
        .values({ orgId: ctx.orgId, year, value: 1 })
        .onConflictDoUpdate({
          target: [quoteCounters.orgId, quoteCounters.year],
          set: { value: sql`${quoteCounters.value} + 1` },
        })
        .returning({ value: quoteCounters.value })

      const sequence = counter?.value ?? 1
      const number = `QT-${year}-${String(sequence).padStart(4, '0')}`
      const publicToken = randomUUID().replace(/-/g, '')
      const validUntil = new Date(Date.now() + 7 * 86_400_000)

      const [quotation] = await tx
        .insert(quotations)
        .values({
          orgId: ctx.orgId,
          eventId,
          number,
          status: 'sent',
          publicToken,
          tokenExpiresAt: validUntil,
        })
        .returning({ id: quotations.id })

      if (!quotation) throw new Error('Could not create the quotation record.')

      const [version] = await tx
        .insert(quotationVersions)
        .values({
          orgId: ctx.orgId,
          quotationId: quotation.id,
          version: 1,
          subtotalPaise: computed.subtotalPaise,
          discountPaise: computed.discountPaise,
          taxPaise: computed.taxPaise,
          roundOffPaise: computed.roundOffPaise,
          totalPaise: computed.totalPaise,
          costPaise: computed.costPaise,
          marginPaise: computed.marginPaise,
          guests: data.guests,
          contentHash,
          snapshot: {
            guests: data.guests,
            discount: data.discountValue,
            lines: computed.lines.length,
          },
          sentAt: new Date(),
          createdBy: ctx.userId,
        })
        .returning({ id: quotationVersions.id })

      if (!version) throw new Error('Could not freeze the quotation version.')

      await tx
        .update(quotations)
        .set({ currentVersionId: version.id, updatedAt: new Date() })
        .where(eq(quotations.id, quotation.id))

      await tx.insert(quotationLines).values(
        computed.lines.map((line, index) => ({
          orgId: ctx.orgId,
          versionId: version.id,
          serviceKey: line.serviceKey,
          label: line.label,
          unitClass: line.unitClass,
          basis: line.basis,
          unitRatePaise: line.unitRatePaise,
          grossPaise: line.grossPaise,
          discountPaise: line.discountPaise,
          taxablePaise: line.taxablePaise,
          taxRateBp: line.taxRateBp,
          taxPaise: line.taxPaise,
          totalPaise: line.totalPaise,
          costPaise: line.costPaise,
          included: line.included,
          minQuantityApplied: line.minQuantityApplied,
          sortOrder: index,
        })),
      )

      return { quotationId: quotation.id, number, mismatch: data.clientTotalPaise !== computed.totalPaise }
    })

    // Telemetry must never fail a save.
    try {
      await db.insert(usageEvents).values({
        orgId: ctx.orgId,
        name: 'quote.sent',
        props: {
          services: [...new Set(computed.lines.map((l) => l.serviceKey))],
          totalPaise: computed.totalPaise,
          previewMismatch: saved.mismatch,
        },
      })
    } catch {
      // ignored on purpose
    }

    revalidatePath('/quotes')
    revalidatePath('/dashboard')

    return { ok: true, quotationId: saved.quotationId, number: saved.number }
  } catch {
    return { ok: false, error: 'The quote could not be saved. Please try again.' }
  }
}
