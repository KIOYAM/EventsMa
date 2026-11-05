import Link from 'next/link'
import { ArrowDown, ArrowUp, Check, Power, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getCateringConfig } from '@/lib/db/catering'
import { describeRule } from '@/lib/domain/catering'
import {
  adoptCatering,
  createCateringSession,
  createDietaryProfile,
  createMenuCategory,
  moveCateringSession,
  saveSelectionRule,
  seedCateringConfigAction,
  setCateringSessionActive,
  setMenuCategoryActive,
} from './actions'

export const metadata = { title: 'Catering' }

const ERROR_COPY: Record<string, string> = {
  name: 'A name is required.',
  duplicate: 'That name is already used in this business.',
  time: 'Times must be written as 07:00 or 19:30.',
  guests: 'The maximum guest count cannot be below the minimum.',
  rule: 'A rule needs a minimum of 0 or more, and a maximum that is not below the minimum.',
  permission: 'Only an owner or manager can change catering configuration.',
  demo: 'Demo mode: connect a database before changing configuration.',
}

const SAVED_COPY: Record<string, string> = {
  adopted: 'Catering is on. The starter sessions, categories and rules are ready to edit.',
  seeded: 'Starter configuration added.',
  session: 'Session saved.',
  category: 'Category saved.',
  rule: 'Selection rule saved.',
  diet: 'Dietary label saved.',
}

const timeLabel = (start: string | null, end: string | null) =>
  start && end ? `${start}–${end}` : start || end || 'No time set'

const guestLabel = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'No limits'
  if (max === null) return `${min}+ guests`
  if (min === null) return `Up to ${max} guests`
  return `${min}–${max} guests`
}

export default async function CateringPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const config = await getCateringConfig(ctx.orgId, ctx.demo)

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const activeSessions = config.sessions.filter((session) => session.active)
  const selectedSession =
    activeSessions.find((session) => session.id === params.session) ?? activeSessions[0] ?? null
  const activeCategories = config.categories.filter((category) => category.active)
  const ruleKey = (sessionId: string, categoryId: string) => `${sessionId}:${categoryId}`
  const ruleMap = new Map(config.rules.map((rule) => [ruleKey(rule.sessionId, rule.categoryId), rule]))
  const sessionRuleCount = config.rules.filter((rule) => rule.sessionId === selectedSession?.id).length

  const banner = params.error ? ERROR_COPY[params.error] ?? 'That change was not saved.' : null
  const saved = params.saved ? SAVED_COPY[params.saved] ?? 'Saved.' : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catering engine"
        title="Your sessions, your categories, your rules"
        description="Nothing on this page is a fixed list. Breakfast, lunch and dinner are starter rows you can rename, reorder or switch off; the selection limits are yours to set."
      />

      {banner ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">{banner}</div>
      ) : null}
      {saved ? (
        <div className="flex items-center gap-2 rounded-card border border-forest/30 bg-mint-subtle px-4 py-3 text-sm text-forest">
          <Check className="h-4 w-4" aria-hidden />
          {saved}
        </div>
      ) : null}

      {!config.enabled ? (
        <Card>
          <CardHeader>
            <CardTitle>Turn on catering</CardTitle>
            <CardDescription>
              This workspace does not offer catering yet. Turning it on unlocks the menu sections in
              the sidebar and seeds four sessions, seven categories and the dietary labels for you to
              edit — not a fixed list you are stuck with.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            {canEdit ? (
              <form action={adoptCatering}>
                <Button type="submit" variant="primary">
                  <Sparkles className="mr-1.5 h-4 w-4" aria-hidden /> Turn on catering
                </Button>
              </form>
            ) : (
              <p className="text-sm text-ink-muted">
                An owner or manager can turn this on. Demo mode cannot write configuration.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {config.enabled && config.sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Start from the starter set</CardTitle>
            <CardDescription>
              Catering is on but there is no configuration yet. Add four sessions, seven categories
              and the default selection limits, then rename anything that does not fit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={seedCateringConfigAction}>
              <Button type="submit" variant="primary" disabled={!canEdit}>
                Add starter configuration
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {config.enabled ? (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              ['Sessions', config.sessions.length],
              ['Categories', config.categories.length],
              ['Selection rules', config.rules.length],
              ['Dietary labels', config.diets.length],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                    {label}
                  </p>
                  <p className="mt-1 font-display text-2xl text-ink">{value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Meal sessions</CardTitle>
                <CardDescription>
                  Each session is booked and priced separately, with its own guest count.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.sessions.length === 0 ? (
                <EmptyState title="No sessions yet" description="Add the first one below." />
              ) : (
                <ul className="divide-y divide-hairline">
                  {config.sessions.map((session, index) => (
                    <li key={session.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-[160px] flex-1">
                        <p className="text-sm font-medium text-ink">
                          {session.name}
                          {!session.active ? (
                            <Badge tone="warning" className="ml-2">
                              Off
                            </Badge>
                          ) : null}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {timeLabel(session.startTime, session.endTime)} ·{' '}
                          {guestLabel(session.minGuests, session.maxGuests)}
                          {session.cutoffHours ? ` · count frozen ${session.cutoffHours}h before` : ''}
                        </p>
                      </div>
                      {canEdit ? (
                        <div className="flex items-center gap-1">
                          <form action={moveCateringSession}>
                            <input type="hidden" name="id" value={session.id} />
                            <input type="hidden" name="direction" value="up" />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              aria-label={`Move ${session.name} up`}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" aria-hidden />
                            </Button>
                          </form>
                          <form action={moveCateringSession}>
                            <input type="hidden" name="id" value={session.id} />
                            <input type="hidden" name="direction" value="down" />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              aria-label={`Move ${session.name} down`}
                              disabled={index === config.sessions.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" aria-hidden />
                            </Button>
                          </form>
                          <form action={setCateringSessionActive}>
                            <input type="hidden" name="id" value={session.id} />
                            <input type="hidden" name="active" value={String(!session.active)} />
                            <Button type="submit" variant="secondary" size="sm">
                              <Power className="mr-1 h-3.5 w-3.5" aria-hidden />
                              {session.active ? 'Switch off' : 'Switch on'}
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {canEdit ? (
                <form
                  action={createCateringSession}
                  className="grid gap-3 rounded-card border border-hairline bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-6"
                >
                  <Field label="Session name" className="lg:col-span-2">
                    <Input name="name" required maxLength={80} placeholder="Reception dinner" />
                  </Field>
                  <Field label="Starts">
                    <Input name="startTime" placeholder="19:00" inputMode="numeric" />
                  </Field>
                  <Field label="Ends">
                    <Input name="endTime" placeholder="22:00" inputMode="numeric" />
                  </Field>
                  <Field label="Min guests">
                    <Input name="minGuests" inputMode="numeric" placeholder="50" />
                  </Field>
                  <Field label="Max guests">
                    <Input name="maxGuests" inputMode="numeric" placeholder="600" />
                  </Field>
                  <div className="sm:col-span-2 lg:col-span-6">
                    <Button type="submit" variant="secondary">
                      Add session
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Food categories</CardTitle>
              <CardDescription>
                The headings a guest chooses from. Two businesses can have entirely different lists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {config.categories.length === 0 ? (
                  <p className="text-sm text-ink-muted">No categories yet.</p>
                ) : (
                  config.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3 py-1 text-xs text-ink"
                    >
                      {category.name}
                      {!category.active ? <span className="text-ink-muted">(off)</span> : null}
                      {canEdit ? (
                        <form action={setMenuCategoryActive}>
                          <input type="hidden" name="id" value={category.id} />
                          <input type="hidden" name="active" value={String(!category.active)} />
                          <button
                            type="submit"
                            className="text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                          >
                            {category.active ? 'hide' : 'show'}
                          </button>
                        </form>
                      ) : null}
                    </span>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createMenuCategory} className="grid gap-3 sm:grid-cols-[2fr_3fr_auto]">
                  <Field label="Category name">
                    <Input name="name" required maxLength={80} placeholder="Live counters" />
                  </Field>
                  <Field label="Description (optional)">
                    <Input name="description" maxLength={240} placeholder="Made to order at the venue" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Add category
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card id="rules">
            <CardHeader>
              <CardTitle>Selection rules</CardTitle>
              <CardDescription>
                How many dishes a guest may pick from each category, in each session. An empty maximum
                means unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSessions.length === 0 ? (
                <EmptyState title="Add a session first" description="Rules belong to a session." />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {activeSessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/catering?session=${session.id}#rules`}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          session.id === selectedSession?.id
                            ? 'border-forest bg-mint-subtle text-forest'
                            : 'border-hairline bg-paper text-ink-muted hover:text-ink'
                        }`}
                      >
                        {session.name}
                      </Link>
                    ))}
                    <span className="self-center text-xs text-ink-muted">
                      {sessionRuleCount} rule{sessionRuleCount === 1 ? '' : 's'} in this session
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                          <th className="py-2 pr-3 font-medium">Category</th>
                          <th className="py-2 pr-3 font-medium">Min</th>
                          <th className="py-2 pr-3 font-medium">Max</th>
                          <th className="py-2 pr-3 font-medium">Required</th>
                          <th className="py-2 pr-3 font-medium">Priced</th>
                          <th className="py-2 font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {activeCategories.map((category) => {
                          const rule = selectedSession
                            ? ruleMap.get(ruleKey(selectedSession.id, category.id))
                            : undefined
                          const summary = describeRule({
                            minSelections: rule?.minSelections ?? 0,
                            maxSelections: rule?.maxSelections ?? null,
                            required: rule?.required ?? false,
                          })
                          return (
                            <tr key={category.id} className="border-b border-hairline/60">
                              <td className="py-2 pr-3">
                                <p className="font-medium text-ink">{category.name}</p>
                                <p className="text-xs text-ink-muted">{summary}</p>
                              </td>
                              <td className="py-2 pr-3" colSpan={5}>
                                {canEdit && selectedSession ? (
                                  <form
                                    action={saveSelectionRule}
                                    className="flex flex-wrap items-center gap-2"
                                  >
                                    <input type="hidden" name="sessionId" value={selectedSession.id} />
                                    <input type="hidden" name="categoryId" value={category.id} />
                                    <input
                                      type="hidden"
                                      name="selectedSession"
                                      value={selectedSession.id}
                                    />
                                    <Input
                                      name="minSelections"
                                      defaultValue={rule?.minSelections ?? 0}
                                      inputMode="numeric"
                                      className="h-8 w-16"
                                      aria-label={`Minimum ${category.name}`}
                                    />
                                    <Input
                                      name="maxSelections"
                                      defaultValue={rule?.maxSelections ?? ''}
                                      inputMode="numeric"
                                      placeholder="∞"
                                      className="h-8 w-16"
                                      aria-label={`Maximum ${category.name}`}
                                    />
                                    <label className="flex items-center gap-1 text-xs text-ink-muted">
                                      <input
                                        type="checkbox"
                                        name="required"
                                        defaultChecked={rule?.required ?? false}
                                      />
                                      Required
                                    </label>
                                    <Select
                                      name="pricingMode"
                                      defaultValue={rule?.pricingMode ?? 'per_guest'}
                                      className="h-8 w-32"
                                      aria-label={`Pricing for ${category.name}`}
                                    >
                                      <option value="per_guest">Per guest</option>
                                      <option value="per_unit">Per unit</option>
                                      <option value="flat">Fixed</option>
                                    </Select>
                                    <Button type="submit" variant="secondary" size="sm">
                                      Save
                                    </Button>
                                  </form>
                                ) : (
                                  <span className="text-xs text-ink-muted">
                                    {rule
                                      ? `${rule.pricingMode.replace('_', ' ')} · rule saved`
                                      : 'No rule yet'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dietary and allergen labels</CardTitle>
              <CardDescription>
                Preferences your guest counts are recorded against. Allergens are kept separate from
                preferences because one is a safety fact.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {config.diets.map((diet) => (
                  <Badge key={diet.id} tone={diet.isAllergen ? 'warning' : 'mint'}>
                    {diet.label}
                  </Badge>
                ))}
                {config.diets.length === 0 ? (
                  <p className="text-sm text-ink-muted">No labels yet.</p>
                ) : null}
              </div>
              {canEdit ? (
                <form action={createDietaryProfile} className="flex flex-wrap items-end gap-3">
                  <Field label="New label">
                    <Input name="label" required maxLength={60} placeholder="No dairy" />
                  </Field>
                  <label className="flex items-center gap-2 pb-2 text-xs text-ink-muted">
                    <input type="checkbox" name="isAllergen" /> This is an allergen
                  </label>
                  <Button type="submit" variant="secondary">
                    Add label
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <p className="text-xs text-ink-muted">
            Next step for this engine: an event can be given several of these sessions, each with its
            own guest count, and dishes are chosen inside the limits above. Recipes entered against a
            dish will then produce the kitchen's ingredient demand.
          </p>
        </>
      ) : null}
    </div>
  )
}
