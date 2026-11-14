import 'server-only'
import { createHash } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { businesses, clients, enquiries, notifications } from './schema'
import { shareLinks, shareSubmissionLines, shareSubmissionServices, shareSubmissions } from './schema-share'
import { getSharePortal, type PortalItem } from './share-portal'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { priceSelection } from '@/lib/domain/share-pricing'

export interface SelectionInput {
  serviceKey: string
  itemId: string
  quantity?: number
}

export interface SubmissionInput {
  token: string
  clientName: string
  clientEmail?: string | null
  clientPhone?: string | null
  message?: string | null
  selections: SelectionInput[]
}

export type SubmissionResult =
  | {
      ok: true
      submissionId: string
      duplicate: boolean
      businessEmail: string | null
      orgId: string
      eventId: string | null
    }
  | { ok: false; error: string; status: number }

function normalisePhone(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : null
}

/**
 * Persist a customer submission.
 *
 * Everything that can be wrong is checked here, on the server, before a row is
 * written: the token must still resolve, the service must be enabled for the
 * organisation, and every chosen item must belong to that organisation and that
 * service. Prices are recomputed from the catalogue, never trusted from the
 * browser. All writes happen in one transaction.
 */
export async function createShareSubmission(input: SubmissionInput): Promise<SubmissionResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: 'Submissions are not available right now.', status: 503 }
  }

  const clientName = input.clientName.trim().slice(0, 120)
  if (!clientName) return { ok: false, error: 'Your name is required.', status: 400 }

  const portal = await getSharePortal(input.token)
  if (!portal) return { ok: false, error: 'This link is no longer available.', status: 404 }

  const wanted = new Map<string, SelectionInput>()
  for (const selection of input.selections ?? []) {
    const quantity = Math.min(Math.max(Math.trunc(selection.quantity ?? 1), 1), 10_000)
    wanted.set(selection.itemId, { ...selection, quantity })
  }
  if (wanted.size === 0) {
    return { ok: false, error: 'Choose at least one item before submitting.', status: 400 }
  }

  const serviceKeys = new Set(portal.services.map((s) => s.key))
  const catalogue = new Map<string, { serviceKey: string; item: PortalItem }>()
  for (const service of portal.services) {
    for (const category of service.categories) {
      for (const item of category.items) catalogue.set(item.id, { serviceKey: service.key, item })
    }
  }

  for (const [itemId, selection] of wanted) {
    const found = catalogue.get(itemId)
    if (!found) {
      return { ok: false, error: 'One of the selected items is no longer available.', status: 400 }
    }
    if (found.serviceKey !== selection.serviceKey || !serviceKeys.has(selection.serviceKey)) {
      return { ok: false, error: 'One of the selected items does not match its service.', status: 400 }
    }
  }

  const guests = portal.event?.guests ?? 0
  const prepared: {
    serviceKey: string
    indicativePaise: number
    lines: ReturnType<typeof priceSelection>[]
  }[] = []

  for (const serviceKey of serviceKeys) {
    const lines: ReturnType<typeof priceSelection>[] = []
    for (const [itemId, selection] of wanted) {
      const found = catalogue.get(itemId)
      if (!found || found.serviceKey !== serviceKey) continue
      lines.push(
        priceSelection(
          {
            itemId,
            serviceKey,
            label: found.item.name,
            unitClass: found.item.unitClass,
            quantity: selection.quantity ?? 1,
            unitPricePaise: found.item.pricePaise,
          },
          guests,
        ),
      )
    }
    if (lines.length > 0) {
      prepared.push({
        serviceKey,
        indicativePaise: lines.reduce((sum, line) => sum + line.amountPaise, 0),
        lines,
      })
    }
  }

  if (prepared.length === 0) {
    return { ok: false, error: 'Choose at least one item before submitting.', status: 400 }
  }

  const indicativeTotal = prepared.reduce((sum, service) => sum + service.indicativePaise, 0)
  const dedupeKey = createHash('sha256')
    .update(
      [
        portal.event?.id ?? 'catalogue',
        normalisePhone(input.clientPhone) ??
          input.clientEmail?.toLowerCase().trim() ??
          clientName.toLowerCase(),
        [...wanted.keys()].sort().join(','),
      ].join('|'),
    )
    .digest('hex')

  const db = getDb()
  const [business] = await db
    .select({ email: businesses.email })
    .from(businesses)
    .where(eq(businesses.orgId, portal.orgId))
    .limit(1)

  let linkId: string | null = null
  try {
    const [link] = await db
      .select({ id: shareLinks.id })
      .from(shareLinks)
      .where(eq(shareLinks.token, input.token))
      .limit(1)
    linkId = link?.id ?? null
  } catch {
    linkId = null
  }

  try {
    const submissionId = await db.transaction(async (tx) => {
      const phone = input.clientPhone?.trim().slice(0, 24) || null
      const email = input.clientEmail?.trim().toLowerCase().slice(0, 160) || null
      const phoneNormalized = normalisePhone(phone)
      let clientId: string | null = null

      if (phoneNormalized) {
        const [existing] = await tx
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.orgId, portal.orgId), eq(clients.phoneNormalized, phoneNormalized)))
          .limit(1)
        clientId = existing?.id ?? null
      }
      if (!clientId && email) {
        const [existing] = await tx
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.orgId, portal.orgId), eq(clients.email, email)))
          .limit(1)
        clientId = existing?.id ?? null
      }
      if (!clientId) {
        const [created] = await tx
          .insert(clients)
          .values({
            orgId: portal.orgId,
            name: clientName,
            phone,
            phoneNormalized,
            email,
            source: 'share_link',
          })
          .onConflictDoNothing()
          .returning({ id: clients.id })
        clientId = created?.id ?? null
        if (!clientId && phoneNormalized) {
          const [retry] = await tx
            .select({ id: clients.id })
            .from(clients)
            .where(and(eq(clients.orgId, portal.orgId), eq(clients.phoneNormalized, phoneNormalized)))
            .limit(1)
          clientId = retry?.id ?? null
        }
      }

      const summary = prepared
        .map(
          (service) =>
            `${verticalDescriptor(service.serviceKey).label}: ${service.lines.map((l) => l.label).join(', ')}`,
        )
        .join(' | ')

      const [enquiry] = await tx
        .insert(enquiries)
        .values({
          orgId: portal.orgId,
          clientId,
          eventDate: portal.event?.eventDate ?? null,
          guests: portal.event?.guests ?? 0,
          eventType: portal.event?.eventType ?? null,
          message:
            [input.message?.trim().slice(0, 1000), summary].filter(Boolean).join('\n\n') || null,
          status: 'new',
          source: 'share_link',
        })
        .returning({ id: enquiries.id })

      const [submission] = await tx
        .insert(shareSubmissions)
        .values({
          orgId: portal.orgId,
          shareLinkId: linkId,
          eventId: portal.event?.id ?? null,
          enquiryId: enquiry?.id ?? null,
          clientName,
          clientEmail: email,
          clientPhone: phone,
          message: input.message?.trim().slice(0, 1000) || null,
          status: 'new',
          indicativeTotalPaise: indicativeTotal,
          dedupeKey,
        })
        .returning({ id: shareSubmissions.id })

      if (!submission) throw new Error('submission_insert_failed')

      let sortOrder = 0
      for (const service of prepared) {
        const [serviceRow] = await tx
          .insert(shareSubmissionServices)
          .values({
            orgId: portal.orgId,
            submissionId: submission.id,
            serviceKey: service.serviceKey,
            indicativePaise: service.indicativePaise,
          })
          .returning({ id: shareSubmissionServices.id })

        if (!serviceRow) throw new Error('service_insert_failed')

        for (const line of service.lines) {
          await tx.insert(shareSubmissionLines).values({
            orgId: portal.orgId,
            submissionServiceId: serviceRow.id,
            itemId: line.itemId,
            label: line.label,
            unitClass: line.unitClass,
            quantity: line.quantity,
            basis: line.basis,
            unitPricePaise: line.unitPricePaise,
            indicativePaise: line.amountPaise,
            sortOrder: sortOrder++,
          })
        }
      }

      await tx.insert(notifications).values({
        orgId: portal.orgId,
        kind: 'share_submission',
        channel: 'in_app',
        status: 'queued',
        payload: {
          submissionId: submission.id,
          eventId: portal.event?.id ?? null,
          clientName,
          indicativeTotalPaise: indicativeTotal,
          services: prepared.map((s) => s.serviceKey),
        },
      })

      return submission.id
    })

    return {
      ok: true,
      submissionId,
      duplicate: false,
      businessEmail: business?.email ?? null,
      orgId: portal.orgId,
      eventId: portal.event?.id ?? null,
    }
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === '23505') {
      const [existing] = await db
        .select({ id: shareSubmissions.id })
        .from(shareSubmissions)
        .where(and(eq(shareSubmissions.orgId, portal.orgId), eq(shareSubmissions.dedupeKey, dedupeKey)))
        .limit(1)
      if (existing) {
        return {
          ok: true,
          submissionId: existing.id,
          duplicate: true,
          businessEmail: business?.email ?? null,
          orgId: portal.orgId,
          eventId: portal.event?.id ?? null,
        }
      }
    }
    console.error('share submission failed', error instanceof Error ? error.message : error)
    return { ok: false, error: 'We could not save your request. Please try again.', status: 500 }
  }
}
