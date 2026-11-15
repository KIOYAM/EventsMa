import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getRecipesBoard } from '@/lib/db/catering-recipes'
import { formatMilliQuantity, INGREDIENT_UNITS, type IngredientUnit } from '@/lib/domain/catering'
import { createTranslator } from '@/lib/i18n'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import {
  ingredientUnitLabel,
  unitClassLabelLocalised,
} from '@/lib/i18n/ops-copy'
import {
  addRecipeIngredient,
  assignDishCategory,
  removeRecipeIngredient,
  unassignDishCategory,
} from '../recipes-actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('catering.recipes.title') }
}

/** `?error=` codes are machine values; the sentence comes from the catalogue. */
const ERROR_KEYS: Record<string, string> = {
  recipe: 'catering.errors.recipe',
  assign: 'catering.errors.assign',
  permission: 'catering.errors.recipePermission',
  demo: 'catering.errors.recipeDemo',
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ dish?: string; saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const query = await searchParams
  const board = await withWorkspace(ctx, () => getRecipesBoard(ctx.orgId, ctx.demo))

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const dish = board.dishes.find((row) => row.id === query.dish) ?? board.dishes[0] ?? null
  const banner = query.error ? t(ERROR_KEYS[query.error] ?? 'catering.errorFallback') : null

  return (
    <div className="space-y-6">
      <Link
        href="/catering"
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-forest"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('catering.recipes.back')}
      </Link>

      <PageHeader
        eyebrow={t('catering.recipes.eyebrow')}
        title={t('catering.recipes.heading')}
        description={t('catering.recipes.intro')}
      />

      {banner ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {banner}
        </div>
      ) : null}
      {query.saved ? (
        <div className="rounded-card border border-forest/30 bg-mint-subtle px-4 py-3 text-sm text-forest">
          {t('catering.recipes.saved')}
        </div>
      ) : null}

      {board.dishes.length === 0 ? (
        <EmptyState
          title={t('catering.recipes.emptyTitle')}
          description={t('catering.recipes.emptyBody')}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('catering.recipes.pickDish')}</CardTitle>
              <CardDescription>
                {t('catering.recipes.dishCount', { count: board.dishes.length })}
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
                      {t('catering.recipes.priceLine', {
                        price: formatPaiseLocalised(dish.pricePaise, locale),
                        unit: unitClassLabelLocalised(t, dish.unitClass),
                      })}
                    </CardDescription>
                  </div>
                  <Badge tone="mint">
                    {t('catering.recipes.ingredientsCount', { count: dish.ingredients.length })}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dish.ingredients.length === 0 ? (
                    <p className="text-sm text-ink-muted">{t('catering.recipes.noRows')}</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                          <th className="py-2 pr-3 font-medium">{t('catering.recipes.ingredient')}</th>
                          <th className="py-2 pr-3 font-medium">{t('catering.recipes.perServing')}</th>
                          <th className="py-2 pr-3 font-medium">{t('catering.recipes.wastage')}</th>
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
                                    aria-label={t('catering.recipes.removeIngredient', { name: row.name })}
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
                      className="grid gap-3 card-flat bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-5"
                    >
                      <input type="hidden" name="itemId" value={dish.id} />
                      <Field label={t('catering.recipes.ingredient')} className="lg:col-span-2">
                        <Input
                          name="name"
                          required
                          maxLength={120}
                          placeholder={t('catering.recipes.ingredientPlaceholder')}
                        />
                      </Field>
                      <Field label={t('catering.recipes.perServing')}>
                        <Input
                          name="perServing"
                          inputMode="decimal"
                          required
                          placeholder={t('catering.recipes.perServingPlaceholder')}
                        />
                      </Field>
                      <Field label={t('catering.recipes.unit')}>
                        <Select name="unit" defaultValue="g">
                          {INGREDIENT_UNITS.map((unit) => (
                            <option key={unit.key} value={unit.key}>
                              {ingredientUnitLabel(t, unit.key)}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label={t('catering.recipes.wastagePct')}>
                        <Input name="wastagePct" inputMode="decimal" defaultValue="5" />
                      </Field>
                      <div className="sm:col-span-2 lg:col-span-5">
                        <Button type="submit" variant="secondary">
                          {t('catering.recipes.addIngredient')}
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('catering.recipes.categories')}</CardTitle>
                  <CardDescription>{t('catering.recipes.categoriesIntro')}</CardDescription>
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
                                {assigned
                                  ? t('catering.recipes.removeFromCategory')
                                  : t('catering.recipes.addToCategory')}
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
