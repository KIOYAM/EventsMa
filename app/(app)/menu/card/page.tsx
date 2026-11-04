import Link from 'next/link'
import { PrintButton } from '@/components/print-button'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getMenuBoard } from '@/lib/db/menu'
import { getSettings } from '@/lib/db/settings'
import { formatINR } from '@/lib/domain/money'
import { windowLabel } from '@/lib/domain/menu'

export const metadata = { title: 'Menu card' }

const UNIT_LABEL: Record<string, string> = {
  PER_GUEST: 'per guest',
  PER_UNIT: 'each',
  FLAT: 'flat',
  PER_HOUR: 'per hour',
  PER_DAY: 'per day',
}

/**
 * The card is generated from the same rows as the on-screen menu, so a price
 * edited once cannot drift between the PDF a client keeps and the quote engine.
 */
export default async function MenuCardPage() {
  const ctx = await requireWorkspace()
  const [board, settings] = await Promise.all([
    getMenuBoard(ctx.orgId, ctx.demo),
    getSettings(ctx.orgId, ctx.demo),
  ])
  const accent = canManageCommercial(ctx.role) ? settings.settings.brandPrimary : '#1f4d3a'
  const dishCount = board.sections.reduce(
    (total, section) =>
      total + section.groups.reduce((count, group) => count + group.items.length, 0),
    0,
  )

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Print"
          title="Menu card"
          description={`${dishCount} dishes across ${board.sections.length} meal periods. Prices come from the catalogue; printing never changes them.`}
          actions={
            <div className="flex gap-2">
              <PrintButton label="Print card" />
              <Link
                href="/menu"
                className="inline-flex h-10 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
              >
                Back to menu
              </Link>
            </div>
          }
        />
      </div>

      <article className="mx-auto w-full max-w-3xl rounded-card border border-hairline bg-white p-8 text-ink print:max-w-none print:border-0 print:p-0">
        <header className="border-b-2 pb-4" style={{ borderColor: accent }}>
          <p className="font-display text-3xl leading-tight">{settings.name}</p>
          {settings.tagline ? (
            <p className="mt-1 text-sm text-ink-muted">{settings.tagline}</p>
          ) : null}
          <p className="mt-2 text-xs text-ink-muted">
            {[settings.city, settings.district].filter(Boolean).join(', ')}
            {settings.phone ? ` · ${settings.phone}` : ''}
          </p>
        </header>

        {board.sections.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">
            No active menu sections. Add dishes on the menu screen first.
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {board.sections.map((section) => (
              <section key={section.id} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-xl" style={{ color: accent }}>
                    {section.name}
                  </h2>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    {windowLabel(section.windowStart, section.windowEnd)}
                  </span>
                </div>

                <div className="mt-3 space-y-4">
                  {section.groups.map((group) => (
                    <div key={group.id}>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                        {group.name}
                      </h3>
                      {group.description ? (
                        <p className="mt-0.5 text-xs text-ink-muted">{group.description}</p>
                      ) : null}
                      <ul className="mt-2 space-y-1.5">
                        {group.items.map((item) => (
                          <li key={item.id} className="flex items-baseline justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-sm">
                                {item.name}
                                {item.dietary ? (
                                  <span className="ml-2 text-[10px] uppercase tracking-wide text-ink-muted">
                                    {item.dietary.replace('_', '-')}
                                  </span>
                                ) : null}
                              </p>
                              {item.description ? (
                                <p className="text-xs leading-snug text-ink-muted">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                            <p className="tabular shrink-0 text-sm">
                              {formatINR(item.pricePaise)}
                              <span className="ml-1 text-[11px] text-ink-muted">
                                {UNIT_LABEL[item.unitClass] ?? ''}
                              </span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-8 border-t border-hairline pt-3 text-[11px] text-ink-muted">
          Prices in Indian Rupees. Taxes as applicable. Menu subject to seasonal availability.
        </footer>
      </article>
    </div>
  )
}
