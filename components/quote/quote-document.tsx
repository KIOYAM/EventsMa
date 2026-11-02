import type { UnitClass } from '@/lib/domain/units'
import { unitClassLabel } from '@/lib/domain/units'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { shortDate } from '@/lib/utils'

export interface QuoteDocLine {
  label: string
  unitClass: UnitClass
  basis: number
  unitRatePaise: number
  grossPaise: number
  taxPaise: number
  totalPaise: number
  included: boolean
}

export interface QuoteDoc {
  number: string
  status: string
  title: string
  eventDate: string
  venueName: string | null
  guests: number
  businessName: string
  businessPhone: string | null
  serviceGroups: { serviceKey: string; lines: QuoteDocLine[]; subtotalPaise: number }[]
  subtotalPaise: number
  discountPaise: number
  taxPaise: number
  roundOffPaise: number
  totalPaise: number
}

/**
 * The customer-facing document. One quotation, lines grouped by the service that
 * produced them, one total. Nothing here is client-side arithmetic: every number
 * was computed by lib/domain/pricing and stored on the version.
 */
export function QuoteDocument({ doc, print = false }: { doc: QuoteDoc; print?: boolean }) {
  return (
    <article className="overflow-hidden rounded-card border border-hairline bg-paper">
      <header className="flex flex-col gap-4 border-b border-hairline p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            Quotation
          </p>
          <h2 className="font-display text-xl leading-tight text-forest sm:text-2xl">{doc.title}</h2>
          <p className="text-sm text-ink-muted">
            {doc.number} · {shortDate(doc.eventDate)} · {doc.guests} guests
          </p>
          {doc.venueName ? <p className="text-sm text-ink-muted">{doc.venueName}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-sm font-medium text-ink">{doc.businessName}</p>
          {doc.businessPhone ? <p className="text-sm text-ink-muted">{doc.businessPhone}</p> : null}
          <span className="mt-2 inline-flex rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-forest">
            {doc.status}
          </span>
        </div>
      </header>

      <div className="divide-y divide-hairline">
        {doc.serviceGroups.map((group) => {
          const descriptor = verticalDescriptor(group.serviceKey)
          return (
            <section key={group.serviceKey} className="p-5">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  {descriptor.label}
                </h3>
                <p className="tabular text-sm text-ink-muted">{formatINR(group.subtotalPaise)}</p>
              </div>

              <table className="w-full text-sm">
                <thead className="sr-only">
                  <tr>
                    <th>Item</th>
                    <th>Basis</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {group.lines.map((line, index) => (
                    <tr key={`${group.serviceKey}-${index}`} className="align-top">
                      <td className="py-1.5 pr-3">
                        <p className="text-ink">{line.label}</p>
                        <p className="text-xs text-ink-muted">
                          {unitClassLabel(line.unitClass)} · {line.basis}{' '}
                          {line.basis === 1 ? '' : 'units'} × {formatINR(line.unitRatePaise)}
                          {line.included ? ' · included in package' : ''}
                        </p>
                      </td>
                      <td className="tabular w-px whitespace-nowrap py-1.5 text-right text-ink">
                        {line.included ? 'Included' : formatINR(line.grossPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}
      </div>

      <div className="border-t border-hairline bg-canvas p-5">
        <dl className="ml-auto max-w-sm space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-muted">
            <dt>Subtotal</dt>
            <dd className="tabular">{formatINR(doc.subtotalPaise)}</dd>
          </div>
          {doc.discountPaise > 0 ? (
            <div className="flex justify-between text-ink-muted">
              <dt>Discount</dt>
              <dd className="tabular">− {formatINR(doc.discountPaise)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-ink-muted">
            <dt>Tax</dt>
            <dd className="tabular">{formatINR(doc.taxPaise)}</dd>
          </div>
          {doc.roundOffPaise !== 0 ? (
            <div className="flex justify-between text-ink-muted">
              <dt>Round-off</dt>
              <dd className="tabular">
                {doc.roundOffPaise > 0 ? '+' : '−'} {formatINR(Math.abs(doc.roundOffPaise))}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-hairline pt-2 text-base font-semibold text-forest">
            <dt>Total</dt>
            <dd className="tabular">{formatINR(doc.totalPaise)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          Quantities and service timings are reconfirmed before the event. This quotation is valid
          for seven days from issue. {print ? 'Printed from EventsMa.' : ''}
        </p>
      </div>
    </article>
  )
}

export function MarginPanel({
  marginPaise,
  marginBp,
  totalPaise,
}: {
  marginPaise: number
  marginBp: number
  totalPaise: number
}) {
  const healthy = marginBp >= 2500
  return (
    <div className="rounded-card border border-hairline bg-paper p-5">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">
        Your margin · internal
      </p>
      <p className="tabular mt-2 text-2xl font-semibold text-forest">{formatPercentBp(marginBp)}</p>
      <p className="tabular mt-1 text-sm text-ink-muted">
        {formatINR(marginPaise)} on a {formatINR(totalPaise)} quote
      </p>
      <p
        className={
          healthy
            ? 'mt-3 rounded-control bg-[#e6f4ea] px-3 py-2 text-xs text-positive'
            : 'mt-3 rounded-control bg-[#fdf0e2] px-3 py-2 text-xs text-warning'
        }
      >
        {healthy
          ? 'Above your 25% floor.'
          : 'Below your 25% target. Check the cost of the largest line before sending.'}
      </p>
      <p className="mt-3 text-[11px] text-ink-muted">
        Never shown on the customer link.
      </p>
    </div>
  )
}
