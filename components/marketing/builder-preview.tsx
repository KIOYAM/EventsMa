import { Check } from 'lucide-react'
import { formatINR } from '@/lib/domain/money'
import { marketingGroups, marketingSample, PreviewChrome } from './product-preview'

export function BuilderPreview() {
  return (
    <PreviewChrome path="eventsma.app/quotes/new">
      <div className="grid md:grid-cols-[0.78fr_1.22fr]">
        <aside className="border-b border-[#dce8df] bg-white p-4 md:border-b-0 md:border-r">
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            Event
          </p>
          <p className="mt-1 text-xs font-medium text-forest">Sample wedding lunch</p>
          <p className="text-[9px] text-ink-muted">350 guests · 12 Nov 2026</p>

          <p className="mt-4 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            Services
          </p>
          <div className="mt-2 space-y-1.5">
            {[
              ['Catering', true],
              ['Decor', true],
              ['Photography', true],
              ['Specialist', false],
            ].map(([label, selected]) => (
              <div
                key={String(label)}
                className={
                  selected
                    ? 'flex items-center justify-between rounded-md bg-mint-subtle px-2 py-1.5 text-[10px] text-forest'
                    : 'flex items-center justify-between rounded-md border border-dashed border-[#dce8df] px-2 py-1.5 text-[10px] text-ink-muted'
                }
              >
                <span>{label}</span>
                {selected ? (
                  <Check className="h-3 w-3 text-positive" aria-hidden />
                ) : (
                  <span className="text-[9px]">Add</span>
                )}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Quote lines
              </p>
              <p className="mt-0.5 font-display text-lg text-forest">Build the document</p>
            </div>
            <span className="rounded-full bg-mint px-2 py-1 text-[9px] font-medium text-forest">
              4 lines
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            {marketingGroups.map((group) =>
              group.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#e2ebe4] bg-white px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] text-ink">{line.label}</p>
                    <p className="text-[8px] text-ink-muted">
                      {group.label} · {line.basis} {line.basis === 1 ? 'unit' : 'units'}
                    </p>
                  </div>
                  <p className="tabular shrink-0 text-[10px] font-medium text-forest">
                    {formatINR(line.grossPaise)}
                  </p>
                </div>
              )),
            )}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#e2ebe4] pt-3">
            <div className="text-[9px] leading-relaxed text-ink-muted">
              Tax and round-off are added on the server.
              <br />
              The customer never sees margin or cost.
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-[0.1em] text-ink-muted">Total</p>
              <p className="tabular text-base font-semibold text-forest">
                {formatINR(marketingSample.totalPaise)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="inline-flex h-7 flex-1 items-center justify-center rounded-md border border-[#dce8df] text-[9px] text-ink-muted">
              Save draft
            </span>
            <span className="inline-flex h-7 flex-1 items-center justify-center rounded-md bg-forest text-[9px] font-medium text-white">
              Review &amp; send
            </span>
          </div>
        </div>
      </div>
    </PreviewChrome>
  )
}
