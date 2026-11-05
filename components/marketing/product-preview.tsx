import { Check, TrendingUp } from 'lucide-react'
import { computeQuote } from '@/lib/domain/pricing'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { verticalDescriptor } from '@/lib/domain/verticals'

/*
 * The marketing preview runs the same pure pricing function as the product.
 * It is a labelled sample, not a customer record. Keeping it computed means the
 * hero cannot drift from the real tax/round-off rules.
 */
const preview = computeQuote({
  guests: 350,
  lines: [
    {
      id: 'sample-catering',
      serviceKey: 'catering',
      label: 'Traditional vegetarian meal',
      unitClass: 'PER_GUEST',
      unitRatePaise: 45_000,
      quantity: 0,
      minQuantity: 100,
      taxRateBp: 500,
      costPerUnitPaise: 30_000,
    },
    {
      id: 'sample-counter',
      serviceKey: 'catering',
      label: 'Live dosa counter',
      unitClass: 'PER_GUEST',
      unitRatePaise: 12_000,
      quantity: 0,
      taxRateBp: 500,
      costPerUnitPaise: 5_000,
    },
    {
      id: 'sample-decor',
      serviceKey: 'decor',
      label: 'Stage backdrop & arch',
      unitClass: 'FLAT',
      unitRatePaise: 6_500_000,
      quantity: 1,
      taxRateBp: 1800,
      costPerUnitPaise: 3_800_000,
    },
    {
      id: 'sample-photo',
      serviceKey: 'photography',
      label: 'Full-day wedding coverage',
      unitClass: 'FLAT',
      unitRatePaise: 3_500_000,
      quantity: 1,
      taxRateBp: 1800,
      costPerUnitPaise: 1_800_000,
    },
  ],
  orderDiscount: { kind: 'percent', value: 2, reason: 'Repeat client' },
})

const groups = preview.lines.reduce<
  { serviceKey: string; label: string; lines: typeof preview.lines; subtotalPaise: number }[]
>((all, line) => {
  const existing = all.find((group) => group.serviceKey === line.serviceKey)
  if (existing) {
    existing.lines = [...existing.lines, line]
    existing.subtotalPaise += line.grossPaise
    return all
  }
  all.push({
    serviceKey: line.serviceKey,
    label: verticalDescriptor(line.serviceKey).label,
    lines: [line],
    subtotalPaise: line.grossPaise,
  })
  return all
}, [])

/** Numbers shared by the finance section, all from the same sample calculation. */
export const marketingSample = {
  subtotalPaise: preview.subtotalPaise,
  taxPaise: preview.taxPaise,
  totalPaise: preview.totalPaise,
  costPaise: preview.costPaise,
  marginPaise: preview.marginPaise,
  marginBp: preview.marginBp,
}

/** Grouped sample lines shared by the builder preview. */
export const marketingGroups = groups

export function PreviewChrome({ children, path }: { children: React.ReactNode; path: string }) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[1.35rem] border border-white/15 bg-[#f4f8f5] text-ink shadow-[0_30px_100px_-20px_rgba(0,0,0,0.7)]">
      <div className="flex items-center gap-2 border-b border-[#dce8df] bg-white px-3 py-2.5 sm:px-4">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-[#e8b4a6]" />
          <span className="h-2 w-2 rounded-full bg-[#e6d29a]" />
          <span className="h-2 w-2 rounded-full bg-[#a9d4b8]" />
        </span>
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-[#f1f5f2] px-2 py-1 text-[10px] text-ink-muted">
          {path}
        </span>
        <span className="rounded-full bg-mint px-2 py-0.5 text-[9px] font-medium text-forest">
          Sample
        </span>
      </div>
      {children}
    </div>
  )
}

function PreviewSidebar() {
  return (
    <aside className="hidden w-32 shrink-0 border-r border-[#dce8df] bg-white p-3 md:block">
      <div className="flex items-center gap-1.5">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-forest text-[10px] font-semibold text-white">
          E
        </span>
        <span className="font-display text-sm text-forest">EventsMa</span>
      </div>
      <div className="mt-5 space-y-1">
        {['Dashboard', 'Events', 'Quotes', 'Clients', 'Finance'].map((item, index) => (
          <div
            key={item}
            className={
              index === 2
                ? 'rounded-md bg-mint-subtle px-2 py-1.5 text-[10px] font-medium text-forest'
                : 'rounded-md px-2 py-1.5 text-[10px] text-ink-muted'
            }
          >
            {item}
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-md bg-canvas p-2">
        <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-ink-muted">Services</p>
        <p className="mt-1 text-[10px] text-ink">Catering Â· Decor Â· Photo</p>
      </div>
    </aside>
  )
}

export function QuotePreview() {
  return (
    <figure className="relative min-w-0" aria-label="Illustrative EventsMa quotation preview">
      <div
        className="absolute -inset-4 rounded-[2rem] bg-mint/10 blur-3xl"
        aria-hidden
      />
      <PreviewChrome path="eventsma.app/quotes/QT-2026-0041">
        <div className="flex">
          <PreviewSidebar />
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                  Quotation
                </p>
                <p className="mt-0.5 font-display text-lg leading-tight text-forest sm:text-xl">
                  Sample wedding lunch
                </p>
                <p className="mt-0.5 text-[10px] text-ink-muted">350 guests Â· 12 Nov 2026</p>
              </div>
              <span className="rounded-full bg-mint px-2 py-1 text-[9px] font-medium text-forest">
                Draft
              </span>
            </div>

            <div className="mt-4 divide-y divide-[#e2ebe4] border-y border-[#e2ebe4]">
              {groups.map((group) => (
                <div key={group.serviceKey} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                      {group.label}
                    </p>
                    <p className="tabular text-[10px] text-ink-muted">{formatINR(group.subtotalPaise)}</p>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {group.lines.map((line) => (
                      <div key={line.id} className="flex justify-between gap-2 text-[10px]">
                        <span className="truncate text-ink">{line.label}</span>
                        <span className="tabular shrink-0 text-ink">{formatINR(line.grossPaise)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <dl className="mt-3 ml-auto max-w-[15rem] space-y-1 text-[10px]">
              <div className="flex justify-between text-ink-muted">
                <dt>Subtotal</dt>
                <dd className="tabular">{formatINR(preview.subtotalPaise)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Tax</dt>
                <dd className="tabular">{formatINR(preview.taxPaise)}</dd>
              </div>
              <div className="flex justify-between border-t border-[#e2ebe4] pt-1.5 text-xs font-semibold text-forest">
                <dt>Total</dt>
                <dd className="tabular">{formatINR(preview.totalPaise)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-forest px-3 py-2 text-white">
              <span className="flex items-center gap-1.5 text-[10px]">
                <TrendingUp className="h-3 w-3 text-mint-bright" aria-hidden />
                Internal margin
              </span>
              <span className="tabular text-[11px] font-medium text-mint-bright">
                {formatPercentBp(preview.marginBp)}
              </span>
            </div>
          </div>
        </div>
      </PreviewChrome>
      <figcaption className="mt-3 text-center text-[11px] text-white/55">
        Illustrative product preview. Sample data, real pricing logic.
      </figcaption>
    </figure>
  )
}

export function DashboardPreview() {
  return (
    <PreviewChrome path="eventsma.app/dashboard">
      <div className="flex">
        <PreviewSidebar />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                This week
              </p>
              <p className="mt-0.5 font-display text-lg text-forest">Know what you quoted</p>
            </div>
            <span className="rounded-full bg-forest px-2.5 py-1 text-[9px] font-medium text-white">
              New quote
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {[
              ['Open pipeline', formatINR(preview.subtotalPaise, { compact: true }), 'Draft and sent'],
              ['Awaiting reply', '4', 'Sent, not accepted'],
              ['Upcoming events', '3', 'Dated today or later'],
              ['Average margin', formatPercentBp(preview.marginBp), 'After cost'],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-lg border border-[#dce8df] bg-white p-2.5">
                <p className="text-[8px] font-medium uppercase tracking-[0.1em] text-ink-muted">
                  {label}
                </p>
                <p className="tabular mt-1 text-sm font-semibold text-forest">{value}</p>
                <p className="mt-0.5 text-[8px] text-ink-muted">{hint}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-[#dce8df] bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                Needs attention
              </p>
              <span className="rounded-full bg-mint px-2 py-0.5 text-[8px] text-forest">3 items</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {[
                ['Quote QT-2026-0041', 'Sent 4 days ago'],
                ['Sample wedding Â· 12 Nov', '12 days away'],
                ['Invoice INV-2026-0018', 'Due today'],
              ].map(([title, detail]) => (
                <div key={title} className="flex items-center justify-between gap-3 text-[9px]">
                  <span className="truncate text-ink">{title}</span>
                  <span className="shrink-0 text-ink-muted">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PreviewChrome>
  )
}

export function MarginPreview() {
  const marginWidth = Math.max(8, Math.min(100, Math.round(preview.marginBp / 100)))
  return (
    <PreviewChrome path="eventsma.app/quotes/QT-2026-0041/margin">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Financial intelligence
            </p>
            <p className="mt-0.5 font-display text-lg text-forest">Margin before you send</p>
          </div>
          <span className="rounded-full bg-[#e6f4ea] px-2 py-1 text-[9px] font-medium text-positive">
            Healthy
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
          {[
            ['Quote value', formatINR(preview.totalPaise, { compact: true })],
            ['Delivered cost', formatINR(preview.costPaise, { compact: true })],
            ['Margin', formatINR(preview.marginPaise, { compact: true })],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[#f1f6f2] p-2.5">
              <p className="text-[8px] uppercase tracking-[0.1em] text-ink-muted">{label}</p>
              <p className="tabular mt-1 text-sm font-semibold text-forest">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[9px] text-ink-muted">
            <span>Margin</span>
            <span className="tabular">{formatPercentBp(preview.marginBp)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e6eee8]">
            <div
              className="h-full rounded-full bg-forest"
              style={{ width: `${marginWidth}%` }}
              aria-hidden
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-[#dce8df] bg-white p-3">
          <p className="flex items-center gap-1.5 text-[9px] font-medium text-ink">
            <Check className="h-3 w-3 text-positive" aria-hidden />
            Every rupee is server-computed
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-ink-muted">
            Line tax, order discount and round-off are calculated in integer paise. The customer
            link never shows cost or margin.
          </p>
        </div>
      </div>
    </PreviewChrome>
  )
}
