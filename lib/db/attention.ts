import 'server-only'
import { and, asc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import { eventTasks, events, invoices, payments, quotations } from './schema'
import type { AttentionItem } from '@/lib/domain/ops'
import { formatINR } from '@/lib/domain/money'

const ITEM_LIMIT = 3

function iso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function shiftDays(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return iso(date)
}

function demoAttention(): AttentionItem[] {
  return [
    {
      id: 'demo-attention-event',
      kind: 'event',
      title: 'Meera & Karthik - wedding lunch',
      detail: '8 days away - 3 open tasks',
      href: '/events/00000000-0000-4000-8000-0000000000a1',
      tone: 'mint',
    },
    {
      id: 'demo-attention-invoice',
      kind: 'invoice',
      title: 'INV-2026-0018',
      detail: `${formatINR(17_416_000)} balance - due 18 Nov`,
      href: '/invoices/00000000-0000-4000-8000-0000000000d1',
      tone: 'gold',
    },
    {
      id: 'demo-attention-quote',
      kind: 'quote',
      title: 'Ananya & Rohan - reception',
      detail: 'Accepted - invoice not raised yet',
      href: '/quotes',
      tone: 'accent',
    },
  ]
}

/**
 * Three small queries in parallel, each capped at three rows. The dashboard
 * shows the next action, not a data warehouse.
 */
export async function getAttentionItems(orgId: string, demo: boolean): Promise<AttentionItem[]> {
  if (demo || !isDatabaseConfigured()) return demoAttention()

  const db = getDb()
  const today = iso(new Date())
  const soon = shiftDays(14)
  const staleCutoff = new Date(Date.now() - 3 * 86_400_000)

  const [quoteRows, eventRows, invoiceRows] = await Promise.all([
    db
      .select({
        id: quotations.id,
        number: quotations.number,
        title: events.title,
        eventDate: events.eventDate,
      })
      .from(quotations)
      .innerJoin(events, eq(quotations.eventId, events.id))
      .where(
        and(
          eq(quotations.orgId, orgId),
          inArray(quotations.status, ['sent', 'viewed']),
          lt(quotations.createdAt, staleCutoff),
        ),
      )
      .orderBy(asc(quotations.createdAt))
      .limit(ITEM_LIMIT),
    db
      .select({
        id: events.id,
        title: events.title,
        eventDate: events.eventDate,
        openTasks: sql<number>`(
          select count(*)::int from ${eventTasks}
          where ${eventTasks.eventId} = ${events.id} and ${eventTasks.status} <> 'done'
        )`,
      })
      .from(events)
      .where(and(eq(events.orgId, orgId), gte(events.eventDate, today), lte(events.eventDate, soon)))
      .orderBy(asc(events.eventDate))
      .limit(20),
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        dueOn: invoices.dueOn,
        balance: sql<number>`(${invoices.amountPaise} - coalesce((
          select sum(${payments.amountPaise}) from ${payments}
          where ${payments.invoiceId} = ${invoices.id} and ${payments.status} = 'captured'
        ), 0))::int`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          inArray(invoices.status, ['issued', 'part_paid']),
          lt(invoices.dueOn, today),
        ),
      )
      .orderBy(asc(invoices.dueOn))
      .limit(ITEM_LIMIT),
  ])

  const items: AttentionItem[] = []

  for (const row of quoteRows) {
    items.push({
      id: `quote-${row.id}`,
      kind: 'quote',
      title: `${row.number} - ${row.title}`,
      detail: `Sent at least 3 days ago - event ${row.eventDate}`,
      href: `/quotes/${row.id}`,
      tone: 'gold',
    })
  }

  for (const row of eventRows.filter((item) => item.openTasks > 0).slice(0, ITEM_LIMIT)) {
    items.push({
      id: `event-${row.id}`,
      kind: 'event',
      title: row.title,
      detail: `${row.eventDate} - ${row.openTasks} open task${row.openTasks === 1 ? '' : 's'}`,
      href: `/events/${row.id}`,
      tone: 'mint',
    })
  }

  for (const row of invoiceRows.filter((item) => item.balance > 0)) {
    items.push({
      id: `invoice-${row.id}`,
      kind: 'invoice',
      title: row.number,
      detail: `${formatINR(row.balance)} overdue${row.dueOn ? ` since ${row.dueOn}` : ''}`,
      href: `/invoices/${row.id}`,
      tone: 'accent',
    })
  }

  return items.slice(0, 8)
}
