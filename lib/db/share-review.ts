import 'server-only'
import { asc, desc, eq, inArray } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { events } from './schema'
import { shareSubmissionLines, shareSubmissionServices, shareSubmissions } from './schema-share'
import { verticalDescriptor } from '@/lib/domain/verticals'

export interface OwnerSubmissionLine {
  id: string
  label: string
  quantity: number
  basis: number
  unitPricePaise: number
  indicativePaise: number
}

export interface OwnerSubmissionService {
  key: string
  label: string
  indicativePaise: number
  lines: OwnerSubmissionLine[]
}

export interface OwnerSubmission {
  id: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  message: string | null
  status: string
  indicativeTotalPaise: number
  createdAt: string
  eventId: string | null
  eventTitle: string | null
  eventDate: string | null
  services: OwnerSubmissionService[]
}

/**
 * Owner review read model: every submission with its service-wise breakdown.
 *
 * Returns [] when the share migration has not been applied yet or the database
 * is unreachable, so the workspace renders an empty state rather than a 500.
 */
export async function getOwnerSubmissions(orgId: string, demo: boolean): Promise<OwnerSubmission[]> {
  if (demo || !isDatabaseConfigured()) return []
  const db = getDb()

  let rows: {
    id: string
    clientName: string
    clientEmail: string | null
    clientPhone: string | null
    message: string | null
    status: string
    indicativeTotalPaise: number
    createdAt: Date
    eventId: string | null
    eventTitle: string | null
    eventDate: string | null
  }[] = []

  try {
    rows = await db
      .select({
        id: shareSubmissions.id,
        clientName: shareSubmissions.clientName,
        clientEmail: shareSubmissions.clientEmail,
        clientPhone: shareSubmissions.clientPhone,
        message: shareSubmissions.message,
        status: shareSubmissions.status,
        indicativeTotalPaise: shareSubmissions.indicativeTotalPaise,
        createdAt: shareSubmissions.createdAt,
        eventId: shareSubmissions.eventId,
        eventTitle: events.title,
        eventDate: events.eventDate,
      })
      .from(shareSubmissions)
      .leftJoin(events, eq(shareSubmissions.eventId, events.id))
      .where(eq(shareSubmissions.orgId, orgId))
      .orderBy(desc(shareSubmissions.createdAt))
      .limit(50)
  } catch {
    return []
  }

  if (rows.length === 0) return []

  const serviceRows = await db
    .select({
      id: shareSubmissionServices.id,
      submissionId: shareSubmissionServices.submissionId,
      serviceKey: shareSubmissionServices.serviceKey,
      indicativePaise: shareSubmissionServices.indicativePaise,
    })
    .from(shareSubmissionServices)
    .where(
      inArray(
        shareSubmissionServices.submissionId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(asc(shareSubmissionServices.serviceKey))

  const lineRows =
    serviceRows.length > 0
      ? await db
          .select({
            id: shareSubmissionLines.id,
            submissionServiceId: shareSubmissionLines.submissionServiceId,
            label: shareSubmissionLines.label,
            quantity: shareSubmissionLines.quantity,
            basis: shareSubmissionLines.basis,
            unitPricePaise: shareSubmissionLines.unitPricePaise,
            indicativePaise: shareSubmissionLines.indicativePaise,
          })
          .from(shareSubmissionLines)
          .where(
            inArray(
              shareSubmissionLines.submissionServiceId,
              serviceRows.map((service) => service.id),
            ),
          )
          .orderBy(asc(shareSubmissionLines.sortOrder))
      : []

  return rows.map((row) => ({
    id: row.id,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    message: row.message,
    status: row.status,
    indicativeTotalPaise: row.indicativeTotalPaise,
    createdAt: row.createdAt.toISOString(),
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    eventDate: row.eventDate,
    services: serviceRows
      .filter((service) => service.submissionId === row.id)
      .map((service) => ({
        key: service.serviceKey,
        label: verticalDescriptor(service.serviceKey).label,
        indicativePaise: service.indicativePaise,
        lines: lineRows
          .filter((line) => line.submissionServiceId === service.id)
          .map((line) => ({
            id: line.id,
            label: line.label,
            quantity: line.quantity,
            basis: line.basis,
            unitPricePaise: line.unitPricePaise,
            indicativePaise: line.indicativePaise,
          })),
      })),
  }))
}
