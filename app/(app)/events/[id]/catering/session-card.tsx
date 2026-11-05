import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { formatINR } from '@/lib/domain/money'
import { describeRule, validateSelection } from '@/lib/domain/catering'
import type { EventCateringView, EventSessionView } from '@/lib/db/catering-events'
import {
  addSessionItem,
  removeEventSession,
  removeSessionItem,
  setSessionDietaryCount,
  setSessionItemQuantity,
  updateEventSession,
} from './actions'

const STATUSES = ['planned', 'confirmed', 'served', 'cancelled'] as const

/** One event session: guests, the menu chosen inside the rules, and its money. */
export function SessionCard({
  eventId,
  session,
  view,
  canEdit,
}: {
  eventId: string
  session: EventSessionView
  view: EventCateringView
  canEdit: boolean
}) {
  const rules = view.rulesBySession[session.id] ?? []
  const selectedByCategory = new Map<string, number>()
  for (const item of session.items) {
    if (!item.categoryId) continue
    selectedByCategory.set(item.categoryId, (selectedByCategory.get(item.categoryId) ?? 0) + 1)
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {session.name}
            <Badge tone={session.status === 'confirmed' ? 'success' : 'neutral'}>
              {session.status}
            </Badge>
            {session.templateId ? null : <Badge tone="warning">No template rules</Badge>}
          </CardTitle>
          <p className="mt-1 text-xs text-ink-muted">
            {session.sessionDate ?? 'No date'} · {session.startTime ?? '—'}–{session.endTime ?? '—'} ·{' '}
            {session.guestCount} guests · {formatINR(session.totals.subtotalPaise)} before tax
          </p>
        </div>
        {canEdit ? (
          <form action={removeEventSession}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="id" value={session.id} />
            <Button type="submit" variant="ghost" size="sm" aria-label={`Remove ${session.name}`}>
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </form>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5">
        {canEdit ? (
          <form
            action={updateEventSession}
            className="grid gap-3 rounded-card border border-hairline bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="id" value={session.id} />
            <label className="text-xs text-ink-muted">
              Guests
              <Input
                name="guestCount"
                defaultValue={session.guestCount}
                inputMode="numeric"
                className="mt-1 h-9"
              />
            </label>
            <label className="text-xs text-ink-muted">
              Date
              <Input type="date" name="sessionDate" defaultValue={session.sessionDate ?? ''} className="mt-1 h-9" />
            </label>
            <label className="text-xs text-ink-muted">
              Starts
              <Input name="startTime" defaultValue={session.startTime ?? ''} className="mt-1 h-9" />
            </label>
            <label className="text-xs text-ink-muted">
              Ends
              <Input name="endTime" defaultValue={session.endTime ?? ''} className="mt-1 h-9" />
            </label>
            <label className="text-xs text-ink-muted">
              Status
              <Select name="status" defaultValue={session.status} className="mt-1 h-9">
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex items-end">
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </div>
          </form>
        ) : null}

        {session.items.length === 0 ? (
          <p className="text-sm text-ink-muted">No dishes chosen yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {session.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 py-2">
                <div className="min-w-[140px] flex-1">
                  <p className="text-sm text-ink">{item.name}</p>
                  <p className="text-xs text-ink-muted">
                    {formatINR(item.unitPricePaise)} · {item.unitClass.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
                {canEdit ? (
                  <>
                    <form action={setSessionItemQuantity} className="flex items-center gap-1">
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="id" value={item.id} />
                      <Input
                        name="quantity"
                        defaultValue={item.quantity}
                        inputMode="numeric"
                        className="h-8 w-16"
                        aria-label={`Quantity for ${item.name}`}
                      />
                      <Button type="submit" variant="ghost" size="sm">
                        Set
                      </Button>
                    </form>
                    <form action={removeSessionItem}>
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="ghost" size="sm" aria-label={`Remove ${item.name}`}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </form>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {rules.length === 0 ? (
          <p className="text-xs text-ink-muted">
            No categories are configured yet. Add them on the Catering page.
          </p>
        ) : (
          <div className="space-y-4">
            {rules.map(({ categoryId, rule, pricingMode }) => {
              const category = view.categories.find((row) => row.id === categoryId)
              if (!category) return null
              const dishes = view.dishesByCategory[categoryId] ?? []
              const selected = selectedByCategory.get(categoryId) ?? 0
              const verdict = rule ? validateSelection(rule, selected) : { ok: true as const, count: selected }
              return (
                <div key={categoryId} className="rounded-card border border-hairline p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">
                      {category.name}{' '}
                      <span className="text-xs font-normal text-ink-muted">
                        {rule ? describeRule(rule) : 'Any number'} · {selected} chosen · {pricingMode.replace('_', ' ')}
                      </span>
                    </p>
                    {!verdict.ok ? (
                      <Badge tone="warning">{verdict.message}</Badge>
                    ) : null}
                  </div>

                  {dishes.length === 0 ? (
                    <p className="mt-2 text-xs text-ink-muted">
                      No dishes assigned to this category yet.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dishes.map((dish) => {
                        const chosen = session.items.some((item) => item.itemId === dish.id)
                        return (
                          <span
                            key={dish.id}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                              chosen
                                ? 'border-forest bg-mint-subtle text-forest'
                                : 'border-hairline bg-paper text-ink'
                            }`}
                          >
                            {dish.name}
                            <span className="text-ink-muted">{formatINR(dish.pricePaise)}</span>
                            {canEdit ? (
                              chosen ? (
                                <form action={removeSessionItem}>
                                  <input type="hidden" name="eventId" value={eventId} />
                                  <input type="hidden" name="sessionId" value={session.id} />
                                  <input type="hidden" name="itemId" value={dish.id} />
                                  <button
                                    type="submit"
                                    className="text-ink-muted underline-offset-2 hover:text-clay hover:underline"
                                  >
                                    remove
                                  </button>
                                </form>
                              ) : (
                                <form action={addSessionItem}>
                                  <input type="hidden" name="eventId" value={eventId} />
                                  <input type="hidden" name="sessionId" value={session.id} />
                                  <input type="hidden" name="itemId" value={dish.id} />
                                  <input type="hidden" name="categoryId" value={categoryId} />
                                  <button
                                    type="submit"
                                    className="text-forest underline-offset-2 hover:underline"
                                  >
                                    add
                                  </button>
                                </form>
                              )
                            ) : null}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {canEdit ? (
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {view.diets.map((diet) => (
              <form key={diet.key} action={setSessionDietaryCount} className="flex items-end gap-1">
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="sessionId" value={session.id} />
                <input type="hidden" name="profileKey" value={diet.key} />
                <label className="flex-1 text-[11px] text-ink-muted">
                  {diet.label}
                  <Input
                    name="count"
                    defaultValue={session.dietaryCounts[diet.key] ?? 0}
                    inputMode="numeric"
                    className="mt-1 h-8"
                  />
                </label>
                <Button type="submit" variant="ghost" size="sm">
                  Set
                </Button>
              </form>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
