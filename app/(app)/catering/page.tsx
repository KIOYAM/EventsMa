import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getCateringConfig } from '@/lib/db/catering'
import { createTranslator } from '@/lib/i18n'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { createDietaryProfile, createMenuCategory, setMenuCategoryActive } from './actions'
import { adoptCatering, seedCateringConfigAction } from './seed'
import { RulesCard } from './rules-card'
import { SessionsCard } from './sessions-card'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('catering.title') }
}

/** `?error=` codes are machine values; the sentence comes from the catalogue. */
const ERROR_KEYS: Record<string, string> = {
  name: 'catering.errors.name',
  duplicate: 'catering.errors.duplicate',
  time: 'catering.errors.time',
  guests: 'catering.errors.guests',
  rule: 'catering.errors.rule',
  permission: 'catering.errors.permission',
  demo: 'catering.errors.demo',
}

const SAVED_KEYS: Record<string, string> = {
  adopted: 'catering.saved.adopted',
  seeded: 'catering.saved.seeded',
  session: 'catering.saved.session',
  category: 'catering.saved.category',
  rule: 'catering.saved.rule',
  diet: 'catering.saved.diet',
}

export default async function CateringPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams
  const config = await withWorkspace(ctx, () => getCateringConfig(ctx.orgId, ctx.demo))

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const activeSessions = config.sessions.filter((session) => session.active)
  const selectedSession =
    activeSessions.find((session) => session.id === params.session) ?? activeSessions[0] ?? null
  const activeCategories = config.categories.filter((category) => category.active)

  const banner = params.error
    ? t(ERROR_KEYS[params.error] ?? 'catering.errorFallback')
    : null
  const saved = params.saved ? t(SAVED_KEYS[params.saved] ?? 'catering.savedFallback') : null

  const stats = [
    t('catering.stats.sessions'),
    t('catering.stats.categories'),
    t('catering.stats.rules'),
    t('catering.stats.diets'),
  ]
  const values = [
    config.sessions.length,
    config.categories.length,
    config.rules.length,
    config.diets.length,
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('catering.eyebrow')}
        title={t('catering.heading')}
        description={t('catering.intro')}
        actions={
          <Link
            href="/catering/recipes"
            className="inline-flex h-9 items-center rounded-control border border-hairline bg-paper px-3 text-sm font-medium text-ink hover:bg-mint-subtle"
          >
            {t('catering.recipesLink')}
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
            <CardTitle>{t('catering.enable.title')}</CardTitle>
            <CardDescription>{t('catering.enable.body')}</CardDescription>
          </CardHeader>
          <CardContent>
            {canEdit ? (
              <form action={adoptCatering}>
                <Button type="submit" variant="primary">
                  <Sparkles className="mr-1.5 h-4 w-4" aria-hidden /> {t('catering.enable.action')}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-ink-muted">{t('catering.enable.locked')}</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {config.enabled && config.sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('catering.seed.title')}</CardTitle>
            <CardDescription>{t('catering.seed.body')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={seedCateringConfigAction}>
              <Button type="submit" variant="primary" disabled={!canEdit}>
                {t('catering.seed.action')}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {config.enabled ? (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            {stats.map((label, index) => (
              <Card key={label}>
                <CardContent className="py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                    {label}
                  </p>
                  <p className="mt-1 font-display text-2xl text-ink">{values[index]}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <SessionsCard sessions={config.sessions} canEdit={canEdit} locale={locale} />

          <Card>
            <CardHeader>
              <CardTitle>{t('catering.categories.title')}</CardTitle>
              <CardDescription>{t('catering.categories.intro')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {config.categories.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t('catering.categories.empty')}</p>
                ) : (
                  config.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-2 rounded-full border border-hairline bg-paper px-3 py-1 text-xs text-ink"
                    >
                      {category.name}
                      {!category.active ? (
                        <span className="text-ink-muted">{t('catering.categories.off')}</span>
                      ) : null}
                      {canEdit ? (
                        <form action={setMenuCategoryActive}>
                          <input type="hidden" name="id" value={category.id} />
                          <input type="hidden" name="active" value={String(!category.active)} />
                          <button
                            type="submit"
                            className="text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                          >
                            {category.active
                              ? t('catering.categories.hide')
                              : t('catering.categories.show')}
                          </button>
                        </form>
                      ) : null}
                    </span>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createMenuCategory} className="grid gap-3 sm:grid-cols-[2fr_3fr_auto]">
                  <Field label={t('catering.categories.name')}>
                    <Input
                      name="name"
                      required
                      maxLength={80}
                      placeholder={t('catering.categories.namePlaceholder')}
                    />
                  </Field>
                  <Field label={t('catering.categories.description')}>
                    <Input
                      name="description"
                      maxLength={240}
                      placeholder={t('catering.categories.descriptionPlaceholder')}
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      {t('catering.categories.add')}
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
            locale={locale}
          />

          <Card>
            <CardHeader>
              <CardTitle>{t('catering.diets.title')}</CardTitle>
              <CardDescription>{t('catering.diets.intro')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {config.diets.map((diet) => (
                  <Badge key={diet.id} tone={diet.isAllergen ? 'warning' : 'mint'}>
                    {diet.label}
                  </Badge>
                ))}
                {config.diets.length === 0 ? (
                  <p className="text-sm text-ink-muted">{t('catering.diets.empty')}</p>
                ) : null}
              </div>
              {canEdit ? (
                <form action={createDietaryProfile} className="flex flex-wrap items-end gap-3">
                  <Field label={t('catering.diets.newLabel')}>
                    <Input
                      name="label"
                      required
                      maxLength={60}
                      placeholder={t('catering.diets.newLabelPlaceholder')}
                    />
                  </Field>
                  <label className="flex items-center gap-2 pb-2 text-xs text-ink-muted">
                    <input type="checkbox" name="isAllergen" /> {t('catering.diets.allergen')}
                  </label>
                  <Button type="submit" variant="secondary">
                    {t('catering.diets.add')}
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <p className="text-xs text-ink-muted">{t('catering.nextStep')}</p>
        </>
      ) : null}
    </div>
  )
}
