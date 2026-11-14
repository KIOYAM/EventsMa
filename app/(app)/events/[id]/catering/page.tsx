import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getEventCatering } from '@/lib/db/catering-events'
import { formatMilliQuantity } from '@/lib/domain/catering'
import { createTranslator } from '@/lib/i18n'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { addEventSession } from './actions'
import { SessionCard } from './session-card'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('catering.event.title') }
}

/** `?error=` and `?saved=` values are machine codes; the sentences live here. */
const ERROR_KEYS: Record<string, string> = {
  rule: 'catering.errors.eventRule',
  session: 'catering.errors.session',
  template: 'catering.errors.template',
  item: 'catering.errors.item',
  name: 'catering.errors.sessionName',
  time: 'catering.errors.time',
  status: 'catering.errors.status',
  diet: 'catering.errors.diet',
  event: 'catering.errors.event',
  permission: 'catering.errors.eventPermission',
  demo: 'catering.errors.eventDemo',
}

const SAVED_KEYS: Record<string, string> = {
  session: 'catering.saved.session',
  item: 'catering.saved.item',
  quantity: 'catering.saved.quantity',
  diet: 'catering.saved.dietCount',
  removed: 'catering.saved.removed',
}

export default async function EventCateringPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const { id } = await params
  const query = await searchParams
  const view = await withWorkspace(ctx, () => getEventCatering(ctx.orgId, id, ctx.demo))

  if (!view) notFound()

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const banner = query.error ? t(ERROR_KEYS[query.error] ?? 'catering.errorFallback') : null
  const saved = query.saved ? t(SAVED_KEYS[query.saved] ?? 'catering.savedFallback') : null

  const [templatesBefore, templatesAfter = ''] = t('catering.event.noTemplates').split('{link}')
  const [emptyBefore, emptyAfter = ''] = t('catering.event.productionEmpty').split('{link}')

  const stats = [
    { label: t('catering.event.stats.sessions'), value: String(view.totals.sessionCount) },
    { label: t('catering.event.stats.guests'), value: String(view.totals.guests) },
    {
      label: t('catering.event.stats.subtotal'),
      value: formatPaiseLocalised(view.totals.subtotalPaise, locale),
    },
    { label: t('catering.event.stats.lines'), value: String(view.production.length) },
  ]

  return (
    <div className="space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-forest"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('catering.event.back')}
      </Link>

      <PageHeader
        eyebrow={t('catering.event.eyebrow')}
        title={view.event.title}
        description={t('catering.event.intro')}
      />

      {banner ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {banner}
        </div>
      ) : null}
      {saved ? (
        <div className="rounded-card border border-forest/30 bg-mint-subtle px-4 py-3 text-sm text-forest">
          {saved}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                {stat.label}
              </p>
              <p className="mt-1 font-display text-xl text-ink">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('catering.event.addTitle')}</CardTitle>
            <CardDescription>{t('catering.event.addIntro')}</CardDescription>
          </CardHeader>
          <CardContent>
            {view.templates.length === 0 ? (
              <p className="mb-3 text-xs text-ink-muted">
                {templatesBefore}
                <Link href="/catering" className="text-forest underline-offset-2 hover:underline">
                  {t('catering.event.cateringPageLink')}
                </Link>
                {templatesAfter}
              </p>
            ) : null}
            <form action={addEventSession} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input type="hidden" name="eventId" value={id} />
              <Field label={t('catering.event.fromTemplate')}>
                <Select name="templateId" defaultValue="">
                  <option value="">{t('catering.event.noneOption')}</option>
                  {view.templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('catering.event.orName')}>
                <Input
                  name="name"
                  maxLength={80}
                  placeholder={t('catering.event.namePlaceholder')}
                />
              </Field>
              <Field label={t('catering.event.date')}>
                <Input type="date" name="sessionDate" defaultValue={view.event.eventDate ?? ''} />
              </Field>
              <Field label={t('catering.event.guests')}>
                <Input
                  name="guestCount"
                  inputMode="numeric"
                  defaultValue={view.event.guests || 0}
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" variant="primary">
                  {t('catering.event.add')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {view.sessions.length === 0 ? (
        <EmptyState
          title={t('catering.event.emptyTitle')}
          description={t('catering.event.emptyBody')}
        />
      ) : (
        view.sessions.map((session) => (
          <SessionCard
            key={session.id}
            eventId={id}
            session={session}
            view={view}
            canEdit={canEdit}
            locale={locale}
          />
        ))
      )}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{t('catering.event.productionTitle')}</CardTitle>
            <CardDescription>{t('catering.event.productionIntro')}</CardDescription>
          </div>
          <Badge tone="mint">
            {t('catering.event.lines', { count: view.production.length })}
          </Badge>
        </CardHeader>
        <CardContent>
          {view.production.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {emptyBefore}
              <Link
                href="/catering/recipes"
                className="text-forest underline-offset-2 hover:underline"
              >
                {t('catering.event.recipesPageLink')}
              </Link>
              {emptyAfter}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    <th className="py-2 pr-3 font-medium">{t('catering.event.ingredient')}</th>
                    <th className="py-2 pr-3 font-medium">{t('catering.event.required')}</th>
                    <th className="py-2 pr-3 font-medium">{t('catering.event.wastage')}</th>
                    <th className="py-2 font-medium">{t('catering.event.buy')}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.production.map((line) => (
                    <tr key={line.key} className="border-b border-hairline/60">
                      <td className="py-2 pr-3 text-ink">{line.name}</td>
                      <td className="py-2 pr-3 text-ink-muted">
                        {formatMilliQuantity(line.requiredMilli, line.unit)}
                      </td>
                      <td className="py-2 pr-3 text-ink-muted">
                        {formatMilliQuantity(line.wastageMilli, line.unit)}
                      </td>
                      <td className="py-2 font-medium text-ink">
                        {formatMilliQuantity(line.totalMilli, line.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
