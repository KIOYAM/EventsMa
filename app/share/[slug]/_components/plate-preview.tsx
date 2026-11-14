'use client'

import { DishThumb } from './dish-thumb'
import { formatINR } from '@/lib/domain/money'
import { menuTotals, type MenuSelection, type MenuSession } from '@/lib/domain/menu-selection'

const MAX_ON_PLATE = 7

interface ChosenDish {
  id: string
  name: string
  imagePath: string | null
  category: string
}

/**
 * What the guest has put on the plate.
 *
 * The point is not decoration: a list of forty checkboxes does not tell a customer
 * whether the menu is balanced. Arranging the chosen dishes around a plate does,
 * and it gives the owner's request screen a shape that matches the plate they serve.
 */
export function PlatePreview({
  sessions,
  selections,
  className = '',
}: {
  sessions: readonly MenuSession[]
  selections: Readonly<Record<string, MenuSelection>>
  className?: string
}) {
  const totals = menuTotals(sessions, selections)
  const chosen: ChosenDish[] = []

  for (const session of sessions) {
    const selection = selections[session.id] ?? {}
    for (const category of session.categories) {
      const ids = new Set(selection[category.id] ?? [])
      for (const dish of category.dishes) {
        if (ids.has(dish.id)) {
          chosen.push({
            id: dish.id,
            name: dish.name,
            imagePath: dish.imagePath,
            category: category.name,
          })
        }
      }
    }
  }

  const visible = chosen.slice(0, MAX_ON_PLATE)
  const hidden = chosen.length - visible.length
  const empty = chosen.length === 0

  return (
    <div
      className={`rounded-2xl border border-hairline bg-paper p-4 sm:p-5 ${className}`}
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg text-forest">Your plate</h3>
        <span className="tabular text-xs text-ink-muted">
          {totals.dishCount} dish{totals.dishCount === 1 ? '' : 'es'}
        </span>
      </div>

      <div className="relative mx-auto mt-3 aspect-square w-full max-w-[19rem]">
        {/* the plate: outer rim, well, and a soft shadow so it reads as ceramic */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_26%,#ffffff_0%,#fbf9f4_42%,#efeade_100%)] shadow-[0_18px_36px_-20px_rgba(24,45,33,0.4),inset_0_0_0_1px_rgba(24,45,33,0.06)]" />
        <div className="absolute inset-[7%] rounded-full border border-dashed border-forest/12" />
        <div className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle_at_50%_45%,#ffffff_0%,#f7f4ec_70%,#f0ebdf_100%)] shadow-[inset_0_1px_10px_rgba(24,45,33,0.06)]" />

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-3xl leading-none text-forest tabular">
              {totals.dishCount}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              {empty ? 'nothing yet' : 'on the plate'}
            </p>
          </div>
        </div>

        {visible.map((dish, index) => {
          const angle = (index / Math.max(visible.length, 1)) * Math.PI * 2 - Math.PI / 2
          const radius = visible.length === 1 ? 0 : 33
          const left = 50 + Math.cos(angle) * radius
          const top = 50 + Math.sin(angle) * radius
          return (
            <span
              key={dish.id}
              title={`${dish.name} · ${dish.category}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <DishThumb
                name={dish.name}
                imagePath={dish.imagePath}
                className="h-11 w-11 rounded-full ring-2 ring-paper/90 shadow-[0_6px_14px_-8px_rgba(24,45,33,0.6)] sm:h-12 sm:w-12"
              />
            </span>
          )
        })}

      </div>

      {hidden > 0 ? (
        <p className="mt-2 text-center text-[11px] text-ink-muted">
          +{hidden} more already on the plate
        </p>
      ) : null}

      {empty ? (
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-muted">
          Pick a few dishes and they will be laid out here, so you can see the whole menu at a glance.
        </p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {totals.sessions
            .filter((row) => row.dishCount > 0)
            .map((row) => (
              <li
                key={row.sessionId}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <span className="min-w-0 truncate text-ink">
                  {row.name}
                  {row.guests > 0 ? (
                    <span className="text-ink-muted"> · {row.guests} guests</span>
                  ) : null}
                </span>
                <span className="shrink-0 tabular text-ink-muted">
                  {row.dishCount} · {formatINR(row.paise)}
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
