import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getCateringConfig } from '@/lib/db/catering'
import { createDietaryProfile, createMenuCategory, setMenuCategoryActive } from './actions'
import { adoptCatering, seedCateringConfigAction } from './seed'
import { RulesCard } from './rules-card'
import { SessionsCard } from './sessions-card'

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

  const banner = params.error ? ERROR_COPY[params.error] ?? 'That change was not saved.' : null
  const saved = params.saved ? SAVED_COPY[params.saved] ?? 'Saved.' : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catering engine"
        title="Your sessions, your categories, your rules"
        description="Nothing on this page is a fixed list. Breakfast, lunch and dinner are starter rows you can rename, reorder or switch off; the selection limits are yours to set."
        actions={
          <Link
            href="/catering/recipes"
            className="inline-flex h-9 items-center rounded-control border border-hairline bg-paper px-3 text-sm font-medium text-ink hover:bg-mint-subtle"
          >
            Dishes, categories and recipes
          </Link>
        }
      />

      {banner ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {banner}
        </div>
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
          <CardContent>
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

          <SessionsCard sessions={config.sessions} canEdit={canEdit} />

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
                    <Input
                      name="description"
                      maxLength={240}
                      placeholder="Made to order at the venue"
                    />
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

          <RulesCard
            sessions={activeSessions}
            categories={activeCategories}
            rules={config.rules}
            selectedSession={selectedSession}
            canEdit={canEdit}
          />

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
            dish will then produce the kitchen&apos;s ingredient demand.
          </p>
        </>
      ) : null}
    </div>
  )
}
