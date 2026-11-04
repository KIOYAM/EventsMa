import 'server-only'
import { and, desc, eq, gte, sql, type SQL } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from './client'
import {
  clients,
  events,
  expenses,
  invoices,
  payments,
  quotationVersions,
  quotations,
} from './schema'
import type {
  AcceptedQuoteOption,
  FinanceData,
  FinanceRow,
  InvoiceDetail,
  InvoicePage,
  InvoiceRow,
  InvoiceStatus,
  MonthPoint,
  ReportData,
} from '@/lib/domain/ops'
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_CATEGORIES,
  INVOICE_STATUSES,
} from '@/lib/domain/ops'
import {
  demoAcceptedQuotes,
  demoFinanceRows,
  demoInvoiceDetails,
  demoInvoices,
  demoReport,
} from '@/lib/demo/workspace'
import { PAGE_SIZE, pageOffset } from '@/lib/pagination'

function isInvoiceStatus(value: string | undefined): value is InvoiceStatus {
  return Boolean(value) && INVOICE_STATUSES.some((status) => status === value)
}

export async function getInvoicePage(
  orgId: string,
  demo: boolean,
  filters: { status?: string; page: number },
): Promise<InvoicePage> {
  if (demo || !isDatabaseConfigured()) {
    const filtered = demoInvoices.filter((row) => !filters.status || row.status === filters.status)
    return {
      rows: filtered.slice(pageOffset(filters.page), pageOffset(filters.page) + PAGE_SIZE),
      total: filtered.length,
      page: filters.page,
      pageSize: PAGE_SIZE,
      outstandingPaise: demoInvoices.reduce(
        (sum, row) => sum + Math.max(0, row.amountPaise - row.paidPaise),
        0,
      ),
    }
  }

  const db = getDb()
  const conditions: SQL[] = [eq(invoices.orgId, orgId)]
  if (isInvoiceStatus(filters.status)) conditions.push(eq(invoices.status, filters.status))
  const where = and(...conditions)

  const [rows, totals, outstanding] = await Promise.all([
    db
      .select({
        id: invoices.id,
        number: invoices.number,
        eventId: invoices.eventId,
        eventTitle: events.title,
        clientName: clients.name,
        amountPaise: invoices.amountPaise,
        status: invoices.status,
        dueOn: invoices.dueOn,
        issuedAt: invoices.issuedAt,
        paidPaise: sql<number>`(
          select coalesce(sum(${payments.amountPaise}), 0)::int
          from ${payments}
          where ${payments.invoiceId} = ${invoices.id} and ${payments.status} = 'captured'
        )`,
      })
      .from(invoices)
      .innerJoin(events, eq(invoices.eventId, events.id))
      .leftJoin(clients, eq(events.clientId, clients.id))
      .where(where)
      .orderBy(desc(invoices.issuedAt))
      .limit(PAGE_SIZE)
      .offset(pageOffset(filters.page)),
    db.select({ n: sql<number>`count(*)::int` }).from(invoices).where(where),
    db
      .select({
        n: sql<number>`coalesce(sum(${invoices.amountPaise}), 0)::int`,
        paid: sql<number>`coalesce(sum((
          select coalesce(sum(${payments.amountPaise}), 0)
          from ${payments}
          where ${payments.invoiceId} = ${invoices.id} and ${payments.status} = 'captured'
        )), 0)::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.orgId, orgId), sql`${invoices.status} <> 'void'`)),
  ])

  const outstandingTotal = Math.max(0, (outstanding[0]?.n ?? 0) - (outstanding[0]?.paid ?? 0))

  return {
    rows: rows.map((row) => ({
      ...row,
      status: row.status as InvoiceStatus,
      paidPaise: row.paidPaise ?? 0,
      issuedAt: row.issuedAt.toISOString(),
    })),
    total: totals[0]?.n ?? 0,
    page: filters.page,
    pageSize: PAGE_SIZE,
    outstandingPaise: outstandingTotal,
  }
}

export async function getInvoiceDetail(
  orgId: string,
  demo: boolean,
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  if (demo || !isDatabaseConfigured()) return demoInvoiceDetails[invoiceId] ?? null

  const db = getDb()
  const [row] = await db
    .select({
      id: invoices.id,
      number: invoices.number,
      eventId: invoices.eventId,
      eventTitle: events.title,
      clientName: clients.name,
      amountPaise: invoices.amountPaise,
      status: invoices.status,
      dueOn: invoices.dueOn,
      issuedAt: invoices.issuedAt,
      notes: invoices.notes,
      quotationId: invoices.quotationId,
      quotationNumber: quotations.number,
    })
    .from(invoices)
    .innerJoin(events, eq(invoices.eventId, events.id))
    .leftJoin(clients, eq(events.clientId, clients.id))
    .leftJoin(quotations, eq(invoices.quotationId, quotations.id))
    .where(and(eq(invoices.orgId, orgId), eq(invoices.id, invoiceId)))
    .limit(1)

  if (!row) return null

  const paymentRows = await db
    .select({
      id: payments.id,
      amountPaise: payments.amountPaise,
      mode: payments.mode,
      receivedAt: payments.receivedAt,
      status: payments.status,
    })
    .from(payments)
    .where(and(eq(payments.orgId, orgId), eq(payments.invoiceId, invoiceId)))
    .orderBy(desc(payments.receivedAt))

  const paidPaise = paymentRows
    .filter((payment) => payment.status === 'captured')
    .reduce((sum, payment) => sum + payment.amountPaise, 0)

  return {
    ...row,
    status: row.status as InvoiceStatus,
    paidPaise,
    issuedAt: row.issuedAt.toISOString(),
    payments: paymentRows.map((payment) => ({
      ...payment,
      receivedAt: payment.receivedAt ? payment.receivedAt.toISOString() : null,
    })),
  }
}

export async function getAcceptedQuoteOptions(
  orgId: string,
  demo: boolean,
): Promise<AcceptedQuoteOption[]> {
  if (demo || !isDatabaseConfigured()) return demoAcceptedQuotes

  return getDb()
    .select({
      id: quotations.id,
      number: quotations.number,
      eventTitle: events.title,
      amountPaise: quotationVersions.totalPaise,
      alreadyInvoiced: sql<boolean>`exists (
        select 1 from ${invoices}
        where ${invoices.quotationId} = ${quotations.id} and ${invoices.status} <> 'void'
      )`,
    })
    .from(quotations)
    .innerJoin(events, eq(quotations.eventId, events.id))
    .innerJoin(quotationVersions, eq(quotations.currentVersionId, quotationVersions.id))
    .where(and(eq(quotations.orgId, orgId), eq(quotations.status, 'accepted')))
    .orderBy(desc(quotations.acceptedAt))
    .limit(50)
}

/**
 * One ledger, two sources. The union is cut in SQL so page 4 is page 4, not
 * "fetch everything and slice it in Node".
 */
export async function getFinanceData(
  orgId: string,
  demo: boolean,
  page: number,
): Promise<FinanceData> {
  if (demo || !isDatabaseConfigured()) {
    const sorted = [...demoFinanceRows].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
    const income = sorted
      .filter((row) => row.kind === 'payment')
      .reduce((sum, row) => sum + row.amountPaise, 0)
    const expense = sorted
      .filter((row) => row.kind === 'expense')
      .reduce((sum, row) => sum + row.amountPaise, 0)

    return {
      rows: sorted.slice(pageOffset(page), pageOffset(page) + PAGE_SIZE),
      incomePaise: income,
      expensePaise: expense,
      netPaise: income - expense,
      page,
      pageSize: PAGE_SIZE,
      total: sorted.length,
    }
  }

  const db = getDb()
  const offset = pageOffset(page)

  const [ledger, totals, counts, expenseTotals] = await Promise.all([
    db.execute(sql`
      select id, kind, label, category, amount_paise as "amountPaise", occurred_on as "occurredOn", mode
      from (
        select p.id::text as id, 'payment' as kind,
          coalesce(e.title, 'Payment received') as label,
          coalesce(p.mode, 'other') as category,
          p.amount_paise,
          coalesce(to_char(p.received_at, 'YYYY-MM-DD'), to_char(p.created_at, 'YYYY-MM-DD')) as occurred_on,
          p.mode
        from public.payments p
        left join public.events e on e.id = p.event_id
        where p.org_id = ${orgId} and p.status = 'captured'
        union all
        select x.id::text, 'expense',
          coalesce(x.note, 'Expense'),
          x.category,
          x.amount_paise,
          to_char(x.incurred_on, 'YYYY-MM-DD'),
          'cash'
        from public.expenses x
        where x.org_id = ${orgId}
      ) ledger
      order by "occurredOn" desc, id desc
      limit ${PAGE_SIZE} offset ${offset}
    `),
    db
      .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
      .from(payments)
      .where(and(eq(payments.orgId, orgId), eq(payments.status, 'captured'))),
    db
      .select({
        payments: sql<number>`(select count(*)::int from ${payments} where ${payments.orgId} = ${orgId} and ${payments.status} = 'captured')`,
        expenses: sql<number>`(select count(*)::int from ${expenses} where ${expenses.orgId} = ${orgId})`,
      })
      .from(sql`(select 1) as one`),
    db
      .select({ n: sql<number>`coalesce(sum(${expenses.amountPaise}), 0)::int` })
      .from(expenses)
      .where(eq(expenses.orgId, orgId)),
  ])

  const income = totals[0]?.n ?? 0
  const expense = expenseTotals[0]?.n ?? 0

  return {
    rows: ledger as unknown as FinanceRow[],
    incomePaise: income,
    expensePaise: expense,
    netPaise: income - expense,
    page,
    pageSize: PAGE_SIZE,
    total: (counts[0]?.payments ?? 0) + (counts[0]?.expenses ?? 0),
  }
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year ?? 2026, (month ?? 1) - 1, 1)).toLocaleString('en-IN', {
    month: 'short',
    timeZone: 'UTC',
  })
}

export async function getReportData(orgId: string, demo: boolean): Promise<ReportData> {
  if (demo || !isDatabaseConfigured()) return demoReport

  const db = getDb()
  const since = new Date()
  since.setUTCDate(1)
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCMonth(since.getUTCMonth() - 5)

  const [revenueRows, expenseRows, eventRows, quoteRows, acceptedRows, monthRevenue, monthExpense, categories] =
    await Promise.all([
      db
        .select({ n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
        .from(payments)
        .where(and(eq(payments.orgId, orgId), eq(payments.status, 'captured'))),
      db
        .select({ n: sql<number>`coalesce(sum(${expenses.amountPaise}), 0)::int` })
        .from(expenses)
        .where(eq(expenses.orgId, orgId)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(events)
        .where(eq(events.orgId, orgId)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(quotations)
        .where(eq(quotations.orgId, orgId)),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(quotations)
        .where(and(eq(quotations.orgId, orgId), eq(quotations.status, 'accepted'))),
      db
        .select({
          key: sql<string>`to_char(${payments.receivedAt}, 'YYYY-MM')`,
          n: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.orgId, orgId),
            eq(payments.status, 'captured'),
            gte(payments.receivedAt, since),
          ),
        )
        .groupBy(sql`to_char(${payments.receivedAt}, 'YYYY-MM')`),
      db
        .select({
          key: sql<string>`to_char(${expenses.incurredOn}, 'YYYY-MM')`,
          n: sql<number>`coalesce(sum(${expenses.amountPaise}), 0)::int`,
        })
        .from(expenses)
        .where(and(eq(expenses.orgId, orgId), gte(expenses.incurredOn, since.toISOString().slice(0, 10))))
        .groupBy(sql`to_char(${expenses.incurredOn}, 'YYYY-MM')`),
      db
        .select({
          key: expenses.category,
          n: sql<number>`coalesce(sum(${expenses.amountPaise}), 0)::int`,
        })
        .from(expenses)
        .where(eq(expenses.orgId, orgId))
        .groupBy(expenses.category),
    ])

  const revenueMap = new Map(monthRevenue.map((row) => [row.key, row.n]))
  const expenseMap = new Map(monthExpense.map((row) => [row.key, row.n]))

  const months: MonthPoint[] = []
  for (let index = 5; index >= 0; index -= 1) {
    const cursor = new Date()
    cursor.setUTCDate(1)
    cursor.setUTCHours(0, 0, 0, 0)
    cursor.setUTCMonth(cursor.getUTCMonth() - index)
    const key = monthKey(cursor)
    months.push({
      key,
      label: monthLabel(key),
      revenuePaise: revenueMap.get(key) ?? 0,
      expensePaise: expenseMap.get(key) ?? 0,
    })
  }

  const revenue = revenueRows[0]?.n ?? 0
  const expense = expenseRows[0]?.n ?? 0
  const quoteCount = quoteRows[0]?.n ?? 0
  const acceptedCount = acceptedRows[0]?.n ?? 0

  const categoryMap = new Map(categories.map((row) => [row.key, row.n]))
  const categoryRows = EXPENSE_CATEGORIES.filter((key) => (categoryMap.get(key) ?? 0) > 0).map(
    (key) => ({
      key,
      label: EXPENSE_CATEGORY_LABEL[key],
      amountPaise: categoryMap.get(key) ?? 0,
    }),
  )

  return {
    revenuePaise: revenue,
    expensePaise: expense,
    marginPaise: revenue - expense,
    eventCount: eventRows[0]?.n ?? 0,
    quoteCount,
    acceptedCount,
    conversionBp: quoteCount > 0 ? Math.round((acceptedCount * 10_000) / quoteCount) : 0,
    months,
    categories: categoryRows,
  }
}

export function ledgerCsv(rows: FinanceRow[]): string {
  const header = ['date', 'kind', 'label', 'category', 'amount_inr', 'mode']
  const body = rows.map((row) => [
    row.occurredOn,
    row.kind,
    `"${row.label.replace(/"/g, '""')}"`,
    row.category,
    (row.amountPaise / 100).toFixed(2),
    row.mode,
  ])
  return [header.join(','), ...body.map((line) => line.join(','))].join('\n')
}

/** The export path is deliberately separate from the paged screen. */
export async function getFullLedger(orgId: string, demo: boolean): Promise<FinanceRow[]> {
  if (demo || !isDatabaseConfigured()) return demoFinanceRows

  const rows = await getDb().execute(sql`
    select id, kind, label, category, amount_paise as "amountPaise", occurred_on as "occurredOn", mode
    from (
      select p.id::text as id, 'payment' as kind,
        coalesce(e.title, 'Payment received') as label,
        coalesce(p.mode, 'other') as category,
        p.amount_paise,
        coalesce(to_char(p.received_at, 'YYYY-MM-DD'), to_char(p.created_at, 'YYYY-MM-DD')) as occurred_on,
        p.mode
      from public.payments p
      left join public.events e on e.id = p.event_id
      where p.org_id = ${orgId} and p.status = 'captured'
      union all
      select x.id::text, 'expense',
        coalesce(x.note, 'Expense'),
        x.category,
        x.amount_paise,
        to_char(x.incurred_on, 'YYYY-MM-DD'),
        'cash'
      from public.expenses x
      where x.org_id = ${orgId}
    ) ledger
    order by "occurredOn" desc, id desc
    limit 10000
  `)

  return rows as unknown as FinanceRow[]
}
