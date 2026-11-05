import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getRecipesBoard } from '@/lib/db/catering-recipes'
import { formatMilliQuantity, INGREDIENT_UNITS, type IngredientUnit } from '@/lib/domain/catering'
import { formatINR } from '@/lib/domain/money'
import {
  addRecipeIngredient,
  assignDishCategory,
  removeRecipeIngredient,
  unassignDishCategory,
} from '../recipes-actions'

export const metadata = { title: 'Recipes' }

const ERROR_COPY: Record<string, string> = {
  recipe: 'A recipe row needs a name and a quantity above zero.',
  assign: 'Choose a dish and a category.',
  permission: 'Only an owner or manager can edit recipes.',
  demo: 'Demo mode: connect a database first.',
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ dish?: string; saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const query = await searchParams
  const board = await getRecipesBoard(ctx.orgId, ctx.demo)

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const dish = board.dishes.find((row) => row.id === query.dish) ?? board.dishes[0] ?? null
  const banner = query.error ? ERROR_COPY[query.error] ?? 'That change was not saved.' : null

  return (
    <div className="space-y-6">
      <Link
        href="/catering"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-forest"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to catering
      </Link>

      <PageHeader
        eyebrow="Recipes"
        title="What one portion consumes"
        description="A recipe row turns a dish into an ingredient demand: quantity per serving, the unit, and the trim loss you allow. The event sheet multiplies it by each session's own guest count."
      />

      {banner ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {banner}
        </div>
      ) : null}
      {query.saved ? (
        <div className="rounded-card border border-forest/30 bg-mint-subtle px-4 py-3 text-sm text-forest">
          Saved.
        </div>
      ) : null}

      {board.dishes.length === 0 ? (
        <EmptyState
          title="No dishes yet"
          description="Add dishes on the Menu page first; recipes hang off them."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Pick a dish</CardTitle>
              <CardDescription>
                {board.dishes.length} dishes in the catalogue. Use the menu below to switch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {board.dishes.slice(0, 24).map((row) => (
                  <Link
                    key={row.id}
                    href={`/catering/recipes?dish=${row.id}`}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      row.id === dish?.id
                        ? 'border-forest bg-mint-subtle text-forest'
                        : 'border-hairline bg-paper text-ink-muted hover:text-ink'
                    }`}
                  >
                    {row.name}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {dish ? (
            <>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{dish.name}</CardTitle>
                    <CardDescription>
                      {formatINR(dish.pricePaise)} · {dish.unitClass.replace('_', ' ').toLowerCase()}
                    </CardDescription>
                  </div>
                  <Badge tone="mint">{dish.ingredients.length} ingredients</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dish.ingredients.length === 0 ? (
                    <p className="text-sm text-ink-muted">No recipe rows yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                          <th className="py-2 pr-3 font-medium">Ingredient</th>
                          <th className="py-2 pr-3 font-medium">Per serving</th>
                          <th className="py-2 pr-3 font-medium">Wastage</th>
                          <th className="py-2 font-medium" />
                        </tr>
                      </thead>
                      <tbody>
                        {dish.ingredients.map((row) => (
                          <tr key={row.id} className="border-b border-hairline/60">
                            <td className="py-2 pr-3 text-ink">{row.name}</td>
                            <td className="py-2 pr-3 text-ink-muted">
                              {formatMilliQuantity(row.quantityMilliPerServing, row.unit as IngredientUnit)}
                            </td>
                            <td className="py-2 pr-3 text-ink-muted">{(row.wastageBp / 100).toFixed(1)}%</td>
                            <td className="py-2">
                              {canEdit ? (
                                <form action={removeRecipeIngredient}>
                                  <input type="hidden" name="id" value={row.id} />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    aria-label={`Remove ${row.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                  </Button>
                                </form>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {canEdit ? (
                    <form
                      action={addRecipeIngredient}
                      className="grid gap-3 rounded-card border border-hairline bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-5"
                    >
                      <input type="hidden" name="itemId" value={dish.id} />
                      <Field label="Ingredient" className="lg:col-span-2">
                        <Input name="name" required maxLength={120} placeholder="Sona masoori rice" />
                      </Field>
                      <Field label="Per serving">
                        <Input name="perServing" inputMode="decimal" required placeholder="180" />
                      </Field>
                      <Field label="Unit">
                        <Select name="unit" defaultValue="g">
                          {INGREDIENT_UNITS.map((unit) => (
                            <option key={unit.key} value={unit.key}>
                              {unit.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Wastage %">
                        <Input name="wastagePct" inputMode="decimal" defaultValue="5" />
                      </Field>
                      <div className="sm:col-span-2 lg:col-span-5">
                        <Button type="submit" variant="secondary">
                          Add ingredient
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>
                    A dish can sit in more than one category. Only assigned dishes appear when
                    choosing a menu for an event.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {board.categories.map((category) => {
                      const assigned = dish.categoryIds.includes(category.id)
                      return (
                        <span
                          key={category.id}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                            assigned
                              ? 'border-forest bg-mint-subtle text-forest'
                              : 'border-hairline bg-paper text-ink'
                          }`}
                        >
                          {category.name}
                          {canEdit ? (
                            <form action={assigned ? unassignDishCategory : assignDishCategory}>
                              <input type="hidden" name="itemId" value={dish.id} />
                              <input type="hidden" name="categoryId" value={category.id} />
                              <button
                                type="submit"
                                className="text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                              >
                                {assigned ? 'remove' : 'add'}
                              </button>
                            </form>
                          ) : null}
                        </span>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
