'use client'

import { Check, Clock, Users, UtensilsCrossed } from 'lucide-react'
import { DishThumb } from './dish-thumb'
import {
  categoryCount,
  categoryVerdicts,
  type MenuCategory,
  type MenuSelection,
  type MenuSession,
} from '@/lib/domain/menu-selection'
import { createTranslator } from '@/lib/i18n'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/locales'
import { ruleLabelLocalised, verdictMessageLocalised } from '@/lib/i18n/rule-copy'

/**
 * The customer's menu, session by session.
 *
 * Every rule shown here was configured by the owner and is re-checked on the
 * server at submit time. The browser refuses a click past a maximum instead of
 * letting the customer build a menu that will be rejected later.
 */
export function MenuPicker({
  sessions,
  selections,
  activeId,
  onActive,
  onToggle,
  blockedCategoryId,
  locale,
}: {
  sessions: readonly MenuSession[]
  selections: Readonly<Record<string, MenuSelection>>
  activeId: string
  onActive: (sessionId: string) => void
  onToggle: (sessionId: string, category: MenuCategory, dishId: string) => void
  blockedCategoryId: string | null
  locale: Locale
}) {
  const t = createTranslator(locale)
  const session = sessions.find((row) => row.id === activeId) ?? sessions[0]
  if (!session) return null

  const selection = selections[session.id] ?? {}
  const verdicts = categoryVerdicts(session, selection)
  const chosenHere = verdicts.reduce((sum, row) => sum + row.count, 0)

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
            {t('share.cateringMenu')}
          </p>
          <h2 className="mt-1 font-display text-2xl text-forest">{t('share.chooseServed')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t('share.pickerHelp')}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-subtle px-3 py-1 text-xs font-medium text-forest">
          <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden />
          {t('share.chosen', { count: chosenHere })}
        </span>
      </div>

      {sessions.length > 1 ? (
        <div
          className="mt-5 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t('share.mealSessions')}
        >
          {sessions.map((row) => {
            const count = (selections[row.id] ? categoryCountOf(row, selections[row.id]!) : 0) ?? 0
            const active = row.id === session.id
            return (
              <button
                key={row.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onActive(row.id)}
                className={`snap-start shrink-0 rounded-xl border px-3.5 py-2 text-left transition ${
                  active
                    ? 'border-forest bg-forest text-white shadow-sm'
                    : 'border-hairline bg-canvas text-ink hover:border-forest/40'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {row.name}
                  {count > 0 ? (
                    <span
                      className={`rounded-full px-1.5 text-[10px] tabular ${
                        active ? 'bg-white/20 text-white' : 'bg-mint-subtle text-forest'
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </span>
                <span
                  className={`mt-0.5 flex items-center gap-2 text-[11px] ${
                    active ? 'text-white/75' : 'text-ink-muted'
                  }`}
                >
                  {row.startTime ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden />
                      {row.startTime}
                      {row.endTime ? `–${row.endTime}` : ''}
                    </span>
                  ) : null}
                  {row.guests > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" aria-hidden />
                      {row.guests}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="mt-5 rounded-xl bg-canvas p-3 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-paper text-forest shadow-sm">
            <UtensilsCrossed className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">{session.name}</p>
            <p className="text-[11px] text-ink-muted">
              {session.startTime
                ? `${session.startTime}${session.endTime ? `–${session.endTime}` : ''}`
                : t('share.timingToConfirm')}
              {session.serviceStyle ? ` · ${session.serviceStyle}` : ''}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink-muted sm:mt-0">
          {session.guests > 0
            ? t('share.perGuestTimes', { guests: session.guests })
            : t('share.guestsToConfirm')}
        </p>
      </div>

      <div className="mt-5 space-y-6">
        {session.categories.map((category) => {
          const row = verdicts.find((entry) => entry.categoryId === category.id)
          const count = row?.count ?? 0
          const max = category.rule.maxSelections
          const progress = max && max > 0 ? Math.min(100, (count / max) * 100) : count > 0 ? 100 : 0
          const short = row ? !row.verdict.ok && count > 0 : false
          const full = max !== null && count >= max
          const flash = blockedCategoryId === category.id

          return (
            <div key={category.id} className={flash ? 'animate-pulse' : undefined}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {category.name}
                    {category.rule.required ? (
                      <span className="rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-clay">
                        {t('share.required')}
                      </span>
                    ) : null}
                  </h3>
                  {category.description ? (
                    <p className="mt-0.5 text-xs text-ink-muted">{category.description}</p>
                  ) : null}
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    short
                      ? 'bg-clay/12 text-clay'
                      : count > 0
                        ? 'bg-mint-subtle text-forest'
                        : 'bg-canvas text-ink-muted'
                  }`}
                >
                  {ruleLabelLocalised(t, category.rule)}
                  <span className="ml-1.5 tabular opacity-70">
                    {count}
                    {max !== null ? `/${max}` : ''}
                  </span>
                </span>
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-canvas">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    short ? 'bg-clay' : 'bg-forest'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {category.dishes.map((dish) => {
                  const picked = (selection[category.id] ?? []).includes(dish.id)
                  const disabled = !picked && full
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => onToggle(session.id, category, dish.id)}
                      className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                        picked
                          ? 'border-forest bg-mint-subtle shadow-[0_10px_24px_-20px_rgba(24,45,33,0.9)]'
                          : disabled
                            ? 'border-hairline bg-canvas/60 opacity-60'
                            : 'border-hairline bg-paper hover:-translate-y-0.5 hover:border-forest/35 hover:shadow-[0_12px_24px_-22px_rgba(24,45,33,0.7)]'
                      }`}
                    >
                      <DishThumb
                        name={dish.name}
                        imagePath={dish.imagePath}
                        className="h-16 w-16 sm:h-20 sm:w-20"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-snug text-ink">
                          {dish.name}
                        </span>
                        {dish.description ? (
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-ink-muted">
                            {dish.description}
                          </span>
                        ) : null}
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-medium text-forest tabular">
                            {formatPaiseLocalised(dish.pricePaise, locale)}
                          </span>
                          <span className="text-[10px] text-ink-muted">
                            {dish.unitClass === 'PER_GUEST'
                              ? t('share.perGuest')
                              : (dish.unitLabel ?? t('share.perItem'))}
                          </span>
                          {dish.dietary ? (
                            <span className="rounded-full border border-hairline px-1.5 py-px text-[9px] uppercase tracking-wide text-ink-muted">
                              {dish.dietary}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                          picked
                            ? 'border-forest bg-forest text-white'
                            : 'border-ink-muted/30 text-transparent'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </button>
                  )
                })}
              </div>

              {short && row && !row.verdict.ok ? (
                <p className="mt-2 text-[11px] font-medium text-clay">
                  {verdictMessageLocalised(t, row.verdict, row.rule, row.count)}
                </p>
              ) : null}
              {flash ? (
                <p className="mt-2 text-[11px] font-medium text-clay">{t('rule.full')}</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function categoryCountOf(session: MenuSession, selection: MenuSelection): number {
  return session.categories.reduce((sum, category) => sum + categoryCount(category, selection), 0)
}
