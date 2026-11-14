'use client'

import { Check, Minus, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { unitClassLabel, type UnitClass } from '@/lib/domain/units'
import { basisForUnit } from '@/lib/domain/share-pricing'
import type { PortalService } from '@/lib/db/share'
import { createTranslator } from '@/lib/i18n'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/locales'

/** The non-catering catalogue: decoration, makeup, photography, specialist. */
export function ServiceSection({
  service,
  guests,
  selected,
  onToggle,
  onQuantity,
  locale,
}: {
  service: PortalService
  guests: number
  selected: Record<string, number>
  onToggle: (itemId: string, unitClass: UnitClass) => void
  onQuantity: (itemId: string, quantity: number) => void
  locale: Locale
}) {
  const t = createTranslator(locale)
  const chosenCount = service.categories
    .flatMap((category) => category.items)
    .filter((item) => selected[item.id]).length

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-forest">{service.label}</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{service.description}</p>
        </div>
        <Badge tone={chosenCount > 0 ? 'success' : 'outline'}>
          {chosenCount > 0 ? t('share.selected', { count: chosenCount }) : t('share.optional')}
        </Badge>
      </div>

      {service.notes.length > 0 ? (
        <dl className="mt-4 grid gap-2 rounded-xl bg-canvas p-3 text-xs sm:grid-cols-2">
          {service.notes.map((note) => (
            <div key={note.label}>
              <dt className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">{note.label}</dt>
              <dd className="mt-0.5 text-ink">{note.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-5 space-y-5">
        {service.categories.map((category) => (
          <div key={`${service.key}-${category.name}`}>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              {category.name}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {category.items.map((item) => {
                const quantity = selected[item.id] ?? 0
                const picked = quantity > 0
                const basis = basisForUnit(item.unitClass, guests, quantity || 1)
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      picked ? 'border-forest bg-mint-subtle' : 'border-hairline bg-canvas'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(item.id, item.unitClass)}
                      aria-pressed={picked}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                          picked ? 'border-forest bg-forest text-white' : 'border-ink-muted/40'
                        }`}
                      >
                        {picked ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">{item.name}</span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {item.description}
                          </span>
                        ) : null}
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-forest">
                            {formatPaiseLocalised(item.pricePaise, locale)}
                          </span>
                          <span className="text-[10px] text-ink-muted">
                            {item.unitLabel ??
                              (item.unitClass === 'PER_GUEST'
                                ? t('share.perGuest')
                                : unitClassLabel(item.unitClass))}
                          </span>
                          {item.dietary ? (
                            <Badge tone="outline" className="text-[9px]">
                              {item.dietary}
                            </Badge>
                          ) : null}
                        </span>
                      </span>
                    </button>

                    {picked && item.unitClass !== 'PER_GUEST' && item.unitClass !== 'FLAT' ? (
                      <div className="mt-2 flex items-center justify-between border-t border-forest/15 pt-2">
                        <span className="text-[11px] text-ink-muted">{t('share.quantity')}</span>
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onQuantity(item.id, quantity - 1)}
                            className="grid h-7 w-7 place-items-center rounded-md border border-hairline bg-paper"
                            aria-label={t('share.fewer', { name: item.name })}
                          >
                            <Minus className="h-3 w-3" aria-hidden />
                          </button>
                          <span className="w-8 text-center text-sm tabular text-ink">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => onQuantity(item.id, quantity + 1)}
                            className="grid h-7 w-7 place-items-center rounded-md border border-hairline bg-paper"
                            aria-label={t('share.more', { name: item.name })}
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </button>
                        </span>
                      </div>
                    ) : null}

                    {picked ? (
                      <p className="mt-2 border-t border-forest/15 pt-2 text-[11px] text-ink-muted">
                        {item.unitClass === 'PER_GUEST'
                          ? `${t('share.guestsCount', { count: Math.max(guests, 0) })} × ${formatPaiseLocalised(item.pricePaise, locale)} = `
                          : `${basis} × ${formatPaiseLocalised(item.pricePaise, locale)} = `}
                        <span className="font-medium text-forest">
                          {formatPaiseLocalised(Math.round(item.pricePaise * basis), locale)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
