/**
 * Money: quotations with their immutable versions and lines, invoices, the
 * receipts recorded against them, and event expenses.
 *
 * Totals are produced by the app's own `computeQuote`, so a quote on screen adds
 * up exactly as one saved from the quote builder would. Nothing is hard-coded.
 */
import { createHash } from 'node:crypto'
import { computeQuote, type PriceLineInput } from '../../lib/domain/pricing'
import type { UnitClass } from '../../lib/domain/units'
import type { Sql } from './context'
import { daysAgo, daysAhead } from './context'
import { EVENTS } from './events-content'
import type { EventSpec, QuoteLineSpec } from './types'

export interface MoneyCounts {
  quotations: number
  versions: number
  lines: number
  invoices: number
  payments: number
  expenses: number
}

interface ItemRow {
  id: string
  vertical_key: string
  name: string
  unit_class: UnitClass
  unit_label: string | null
  price_paise: number
  cost_paise: number | null
  tax_rate_bp: number
}

interface PackageRow {
  id: string
  vertical_key: string
  name: string
  unit_class: UnitClass
  rate_paise: number
  min_quantity: number
  tax_rate_bp: number
}

function nextSequence(existing: string[], prefix: string): number {
  let max = 0
  for (const number of existing) {
    if (!number.startsWith(prefix)) continue
    const value = Number(number.slice(prefix.length))
    if (Number.isFinite(value) && value > max) max = value
  }
  return max + 1
}

function buildQuoteLines(
  spec: QuoteLineSpec[],
  items: Map<string, ItemRow>,
  packages: Map<string, PackageRow>,
): PriceLineInput[] {
  const lines: PriceLineInput[] = []
  spec.forEach((entry, index) => {
    const key = `${entry.service}:${entry.package ?? entry.item ?? ''}`
    if (entry.package) {
      const pack = packages.get(key)
      if (!pack) return
      lines.push({
        id: `line-${index}`,
        serviceKey: pack.vertical_key,
        label: pack.name,
        unitClass: pack.unit_class,
        unitRatePaise: pack.rate_paise,
        quantity: 1,
        minQuantity: pack.min_quantity,
        includedInPackage: entry.included === true,
        taxRateBp: pack.tax_rate_bp,
        costPerUnitPaise: Math.round(pack.rate_paise * 0.62),
      })
      return
    }
    const item = items.get(key)
    if (!item) return
    lines.push({
      id: `line-${index}`,
      serviceKey: item.vertical_key,
      label: item.name,
      unitClass: item.unit_class,
      unitRatePaise: item.price_paise,
      quantity: entry.qty ?? 1,
      minQuantity: entry.minQty ?? 0,
      includedInPackage: entry.included === true,
      taxRateBp: item.tax_rate_bp,
      costPerUnitPaise: item.cost_paise ?? 0,
    })
  })
  return lines
}

async function importQuote(
  sql: Sql,
  orgId: string,
  eventId: string,
  spec: EventSpec,
  items: Map<string, ItemRow>,
  packages: Map<string, PackageRow>,
  userId: string | null,
): Promise<{ quotation: number; versions: number; lines: number }> {
  const quote = spec.quote
  if (!quote) return { quotation: 0, versions: 0, lines: 0 }

  const year = Number(spec.date.slice(0, 4))
  const existing = await sql`
    select id, number from quotations where org_id = ${orgId} and event_id = ${eventId} limit 1
  `
  if (existing[0]) return { quotation: 0, versions: 0, lines: 0 }

  const priceLines = buildQuoteLines(quote.lines, items, packages)
  if (priceLines.length === 0) return { quotation: 0, versions: 0, lines: 0 }

  const computed = computeQuote({
    guests: spec.guests,
    lines: priceLines,
    orderDiscount: quote.discountAmount
      ? { kind: 'amount', value: quote.discountAmount, reason: 'Repeat family booking' }
      : null,
  })

  const priorNumbers = (await sql`
    select number from quotations where org_id = ${orgId} and number like ${`QT-${year}-%`}
  `).map((row) => String(row.number))
  const sequence = nextSequence(priorNumbers, `QT-${year}-`)
  const number = `QT-${year}-${String(sequence).padStart(4, '0')}`

  const sentDaysAgo = quote.sentDaysAgo ?? 7
  const sentAt = quote.status === 'draft' ? null : daysAgo(sentDaysAgo)
  const validity = quote.validDays ?? 7
  const tokenExpiresAt = sentAt ? new Date(sentAt.getTime() + validity * 86_400_000) : null
  const publicToken = createHash('sha256').update(`${orgId}:${number}`).digest('hex').slice(0, 40)
  const acceptedAt = quote.status === 'accepted' ? daysAgo(Math.max(0, sentDaysAgo - 3)) : null

  const [quotation] = await sql`
    insert into quotations
      (org_id, event_id, number, status, public_token, token_expires_at, accepted_at,
       accepted_by_email, created_at, updated_at)
    values
      (${orgId}, ${eventId}, ${number}, ${quote.status}::quote_status, ${publicToken},
       ${tokenExpiresAt}, ${acceptedAt}, ${quote.acceptedBy ?? null},
       ${daysAgo(sentDaysAgo + 2)}, now())
    returning id
  `
  if (!quotation) return { quotation: 0, versions: 0, lines: 0 }

  const contentHash = createHash('sha256').update(JSON.stringify(computed.lines)).digest('hex')
  const [version] = await sql`
    insert into quotation_versions
      (org_id, quotation_id, version, subtotal_paise, discount_paise, tax_paise,
       round_off_paise, total_paise, cost_paise, margin_paise, guests, content_hash,
       snapshot, sent_at, created_by)
    values
      (${orgId}, ${quotation.id}, 1, ${computed.subtotalPaise}, ${computed.discountPaise},
       ${computed.taxPaise}, ${computed.roundOffPaise}, ${computed.totalPaise},
       ${computed.costPaise}, ${computed.marginPaise}, ${spec.guests}, ${contentHash},
       ${sql.json({ guests: spec.guests, discount: quote.discountAmount ?? 0, lines: computed.lines.length })},
       ${sentAt}, ${userId})
    returning id
  `
  if (!version) return { quotation: 0, versions: 0, lines: 0 }

  await sql`
    update quotations set current_version_id = ${version.id}, updated_at = now()
    where id = ${quotation.id}
  `

  for (const [index, line] of computed.lines.entries()) {
    await sql`
      insert into quotation_lines
        (org_id, version_id, service_key, label, unit_class, basis, unit_rate_paise,
         gross_paise, discount_paise, taxable_paise, tax_rate_bp, tax_paise, total_paise,
         cost_paise, included, min_quantity_applied, sort_order)
      values
        (${orgId}, ${version.id}, ${line.serviceKey}, ${line.label},
         ${line.unitClass}::unit_class, ${line.basis}, ${line.unitRatePaise}, ${line.grossPaise},
         ${line.discountPaise}, ${line.taxablePaise}, ${line.taxRateBp}, ${line.taxPaise},
         ${line.totalPaise}, ${line.costPaise}, ${line.included}, ${line.minQuantityApplied}, ${index})
    `
  }

  const nextValue = Math.max(sequence, priorNumbers.length + 1)
  await sql`
    insert into quote_counters (org_id, year, value)
    values (${orgId}, ${year}, ${nextValue})
    on conflict (org_id, year) do update set value = greatest(quote_counters.value, excluded.value)
  `

  return { quotation: 1, versions: 1, lines: computed.lines.length }
}

async function importInvoice(
  sql: Sql,
  orgId: string,
  eventId: string,
  spec: EventSpec,
  userId: string | null,
): Promise<{ invoices: number; payments: number }> {
  const invoice = spec.invoice
  if (!invoice) return { invoices: 0, payments: 0 }

  const [quote] = await sql`
    select q.id as quotation_id, v.total_paise, v.tax_paise
    from quotations q
    join quotation_versions v on v.id = q.current_version_id
    where q.org_id = ${orgId} and q.event_id = ${eventId}
    limit 1
  `
  if (!quote) return { invoices: 0, payments: 0 }

  const [existing] = await sql`
    select id, number from invoices where org_id = ${orgId} and event_id = ${eventId} limit 1
  `

  let invoiceId = existing?.id as string | undefined
  let invoiceNumber = existing?.number ? String(existing.number) : ''

  if (!invoiceId) {
    const year = Number(spec.date.slice(0, 4))
    const prior = (await sql`
      select number from invoices where org_id = ${orgId} and number like ${`INV-${year}-%`}
    `).map((row) => String(row.number))
    const sequence = nextSequence(prior, `INV-${year}-`)
    invoiceNumber = `INV-${year}-${String(sequence).padStart(4, '0')}`

    const [row] = await sql`
      insert into invoices
        (org_id, event_id, quotation_id, number, status, amount_paise, tax_paise,
         due_on, notes, issued_at)
      values
        (${orgId}, ${eventId}, ${quote.quotation_id}, ${invoiceNumber}, 'issued',
         ${Number(quote.total_paise)}, ${Number(quote.tax_paise)},
         ${daysAhead(invoice.dueInDays).toISOString().slice(0, 10)}::date,
         ${invoice.notes ?? null}, ${daysAgo(invoice.issuedDaysAgo)})
      returning id
    `
    invoiceId = row?.id as string | undefined
  }
  if (!invoiceId) return { invoices: 0, payments: 0 }

  const total = Number(quote.total_paise)
  let paid = 0
  let paymentsAdded = 0

  for (const [index, payment] of invoice.payments.entries()) {
    const amount = payment.pct
      ? Math.round((total * payment.pct) / 100)
      : (payment.amountPaise ?? 0)
    if (payment.status === 'captured') paid += amount

    const key = `import:${orgId}:${invoiceNumber}:${index}`
    const [inserted] = await sql`
      insert into payments
        (org_id, event_id, quotation_id, invoice_id, amount_paise, mode, gateway_ref,
         status, idempotency_key, received_at, recorded_by, created_at)
      values
        (${orgId}, ${eventId}, ${quote.quotation_id}, ${invoiceId}, ${amount},
         ${payment.mode}, ${payment.ref ?? null}, ${payment.status}::payment_status,
         ${key}, ${daysAgo(payment.receivedDaysAgo)}, ${userId}, ${daysAgo(payment.receivedDaysAgo)})
      on conflict (idempotency_key) do nothing
      returning id
    `
    if (inserted) paymentsAdded += 1
  }

  const status = paid >= total ? 'paid' : paid > 0 ? 'part_paid' : 'issued'
  await sql`update invoices set status = ${status}::invoice_status where id = ${invoiceId}`

  return { invoices: existing ? 0 : 1, payments: paymentsAdded }
}

async function importExpenses(sql: Sql, orgId: string, eventId: string, spec: EventSpec): Promise<number> {
  let added = 0
  for (const expense of spec.expenses ?? []) {
    const [existing] = await sql`
      select id from expenses
      where org_id = ${orgId} and event_id = ${eventId} and note = ${expense.note}
      limit 1
    `
    if (existing) continue
    await sql`
      insert into expenses (org_id, event_id, category, amount_paise, note, incurred_on)
      values (${orgId}, ${eventId}, ${expense.category}, ${expense.amount}, ${expense.note},
              ${expense.date}::date)
    `
    added += 1
  }
  return added
}

export async function importMoney(
  sql: Sql,
  orgId: string,
  eventIds: Map<string, string>,
  userId: string | null,
): Promise<MoneyCounts> {
  const itemRows = await sql`
    select id, vertical_key, name, unit_class, unit_label, price_paise, cost_paise, tax_rate_bp
    from service_items where org_id = ${orgId}
  `
  const items = new Map(
    (itemRows as unknown as ItemRow[]).map((row) => [`${row.vertical_key}:${row.name}`, row]),
  )

  const packageRows = await sql`
    select id, vertical_key, name, unit_class, rate_paise, min_quantity, tax_rate_bp
    from service_packages where org_id = ${orgId}
  `
  const packages = new Map(
    (packageRows as unknown as PackageRow[]).map((row) => [`${row.vertical_key}:${row.name}`, row]),
  )

  const counts: MoneyCounts = { quotations: 0, versions: 0, lines: 0, invoices: 0, payments: 0, expenses: 0 }

  for (const spec of EVENTS) {
    const eventId = eventIds.get(spec.title)
    if (!eventId) continue

    const quote = await importQuote(sql, orgId, eventId, spec, items, packages, userId)
    counts.quotations += quote.quotation
    counts.versions += quote.versions
    counts.lines += quote.lines

    const invoice = await importInvoice(sql, orgId, eventId, spec, userId)
    counts.invoices += invoice.invoices
    counts.payments += invoice.payments

    counts.expenses += await importExpenses(sql, orgId, eventId, spec)
  }

  return counts
}
