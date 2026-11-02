'use server'

import { revalidatePath } from 'next/cache'
import { and, asc, eq } from 'drizzle-orm'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import { quotationLines, quotationVersions, quotations } from '@/lib/db/schema'

/**
 * A revision is a new immutable version. Version N is never updated, so a
 * customer holding the old link still sees exactly what was sent to them.
 */
export async function reviseQuotation(
  quotationId: string,
): Promise<{ ok: true; version: number } | { ok: false; error: string }> {
  const ctx = await requireWorkspace()
  if (!canManageCommercial(ctx.role)) {
    return { ok: false, error: 'Only an owner or manager can revise a quotation.' }
  }
  if (ctx.demo || !isDatabaseConfigured()) {
    return { ok: false, error: 'Demo mode: connect a database to create a revision.' }
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(quotationId)) {
    return { ok: false, error: 'Unknown quotation.' }
  }

  const db = getDb()

  const [current] = await db
    .select({
      id: quotations.id,
      currentVersionId: quotations.currentVersionId,
    })
    .from(quotations)
    .where(and(eq(quotations.orgId, ctx.orgId), eq(quotations.id, quotationId)))
    .limit(1)

  if (!current?.currentVersionId) {
    return { ok: false, error: 'This quotation has no saved version to revise.' }
  }

  const [version] = await db
    .select({
      version: quotationVersions.version,
      subtotalPaise: quotationVersions.subtotalPaise,
      discountPaise: quotationVersions.discountPaise,
      taxPaise: quotationVersions.taxPaise,
      roundOffPaise: quotationVersions.roundOffPaise,
      totalPaise: quotationVersions.totalPaise,
      costPaise: quotationVersions.costPaise,
      marginPaise: quotationVersions.marginPaise,
      guests: quotationVersions.guests,
      snapshot: quotationVersions.snapshot,
      contentHash: quotationVersions.contentHash,
    })
    .from(quotationVersions)
    .where(eq(quotationVersions.id, current.currentVersionId))
    .limit(1)

  if (!version) return { ok: false, error: 'The current version could not be read.' }

  const lines = await db
    .select()
    .from(quotationLines)
    .where(eq(quotationLines.versionId, current.currentVersionId))
    .orderBy(asc(quotationLines.sortOrder))

  const nextNumber = version.version + 1

  try {
    await db.transaction(async (tx) => {
      const [next] = await tx
        .insert(quotationVersions)
        .values({
          orgId: ctx.orgId,
          quotationId,
          version: nextNumber,
          subtotalPaise: version.subtotalPaise,
          discountPaise: version.discountPaise,
          taxPaise: version.taxPaise,
          roundOffPaise: version.roundOffPaise,
          totalPaise: version.totalPaise,
          costPaise: version.costPaise,
          marginPaise: version.marginPaise,
          guests: version.guests,
          snapshot: { ...version.snapshot, revisedFrom: version.version },
          contentHash: version.contentHash,
          sentAt: new Date(),
          createdBy: ctx.userId,
        })
        .returning({ id: quotationVersions.id })

      if (!next) throw new Error('revision insert failed')

      if (lines.length > 0) {
        await tx.insert(quotationLines).values(
          lines.map((line) => ({
            orgId: ctx.orgId,
            versionId: next.id,
            serviceKey: line.serviceKey,
            label: line.label,
            unitClass: line.unitClass,
            unitLabel: line.unitLabel,
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
            sortOrder: line.sortOrder,
          })),
        )
      }

      await tx
        .update(quotations)
        .set({ currentVersionId: next.id, status: 'sent', updatedAt: new Date() })
        .where(eq(quotations.id, quotationId))
    })

    revalidatePath(`/quotes/${quotationId}`)
    revalidatePath('/quotes')
    return { ok: true, version: nextNumber }
  } catch {
    return { ok: false, error: 'The revision could not be created.' }
  }
}
