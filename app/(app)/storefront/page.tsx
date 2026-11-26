import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getSettings } from '@/lib/db/settings'
import { getStorefrontBrand } from '@/lib/db/storefront'
import { getPublishState } from '@/lib/db/storefronts'
import { getStorefrontAnalytics } from '@/lib/db/storefront-analytics'
import { SECTION_LABEL } from '@/lib/domain/storefront'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { setPublished } from '../settings/actions'
import { publishPage } from './actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('storefront.overview.title') }
}

/**
 * The storefront overview: what a stranger sees, and the one switch that puts it
 * online. Everything editable lives in `/storefront/customise`, so this screen has
 * exactly one job — show the state and let an owner publish.
 */
export default async function StorefrontPage() {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)
  const [settings, business, publishState, analytics] = await Promise.all([
    withWorkspace(ctx, () => getSettings(ctx.orgId, ctx.demo)),
    withWorkspace(ctx, () => getStorefrontBrand(ctx.orgId, ctx.demo)),
    withWorkspace(ctx, () => getPublishState(ctx.orgId, ctx.demo)),
    withWorkspace(ctx, () => getStorefrontAnalytics(ctx.orgId, ctx.demo)),
  ])
  const canManage = canManageCommercial(ctx.role) && !ctx.demo
  // A published version, not the flag: the flag alone is what left a workspace
  // claiming to be live while the public URL served an unpublished draft.
  const isLive = publishState.publishedVersion !== null
  const publicPath = `/p/${settings.slug}`

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('storefront.overview.eyebrow')}
        title={t('storefront.overview.title')}
        description={t('storefront.overview.description')}
        actions={
          <>
            <Link href="/storefront/customise" className="btn btn-md btn-primary">
              {t('storefront.overview.customise')}
            </Link>
            <Link
              href={publicPath}
              target="_blank"
              className="btn btn-md btn-outline hover:bg-mint-subtle"
            >
              {t('storefront.overview.open')}
            </Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="h-2 w-full" style={{ backgroundColor: business.primary }} />
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-ink">{settings.name}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {settings.tagline ?? t('storefront.overview.noTagline')}
                </p>
              </div>
              <Badge tone={isLive ? 'success' : 'warning'}>
                {isLive ? t('storefront.overview.published') : t('storefront.overview.draft')}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">{t('storefront.overview.city')}</dt>
                <dd className="text-ink">
                  {settings.city ?? '—'}
                  {settings.district ? `, ${settings.district}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">{t('storefront.overview.phone')}</dt>
                <dd className="text-ink">{settings.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">{t('storefront.overview.design')}</dt>
                <dd className="text-ink capitalize">{business.theme}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">{t('storefront.overview.address')}</dt>
                <dd className="truncate text-ink">{publicPath}</dd>
              </div>
            </dl>

            <div className="rounded-control bg-canvas p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                {t('storefront.overview.advance')}
              </p>
              <p className="mt-1 text-sm text-ink">
                {t('storefront.overview.advanceValue', {
                  pct: settings.settings.advancePct,
                  tax:
                    settings.settings.taxMode === 'inclusive'
                      ? t('storefront.overview.taxInclusive')
                      : t('storefront.overview.taxExtra'),
                })}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{t('storefront.overview.advanceHint')}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('storefront.overview.publishing')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-ink-muted">
                {t('storefront.overview.publishingBody')}
              </p>
              {/* Going live always publishes a snapshot; only taking the page
                  offline is a plain flag flip, so the two never disagree. */}
              {isLive ? (
                <form action={setPublished}>
                  <input type="hidden" name="published" value="0" />
                  <button
                    type="submit"
                    disabled={!canManage}
                    className="inline-flex h-11 w-full items-center justify-center rounded-control border border-hairline bg-paper text-sm font-medium text-ink disabled:opacity-50"
                  >
                    {t('storefront.overview.unpublish')}
                  </button>
                </form>
              ) : (
                <form action={publishPage}>
                  <button
                    type="submit"
                    disabled={!canManage}
                    className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest text-sm font-medium text-white disabled:opacity-50"
                  >
                    {t('storefront.overview.publish')}
                  </button>
                </form>
              )}
              {!canManage ? (
                <p className="text-xs text-ink-muted">
                  {ctx.demo
                    ? t('storefront.overview.readOnlyDemo')
                    : t('storefront.overview.readOnlyRole')}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('storefront.overview.analytics')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-control bg-canvas p-3">
                  <p className="font-display text-2xl tabular-nums text-ink">{analytics.views}</p>
                  <p className="text-xs text-ink-muted">{t('storefront.overview.views')}</p>
                </div>
                <div className="rounded-control bg-canvas p-3">
                  <p className="font-display text-2xl tabular-nums text-ink">
                    {analytics.enquiries}
                  </p>
                  <p className="text-xs text-ink-muted">{t('storefront.overview.enquiries')}</p>
                </div>
              </div>
              {analytics.sections.length > 0 ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                    {t('storefront.overview.sections')}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {analytics.sections.map((row) => (
                      <li key={row.section} className="flex items-center justify-between gap-3">
                        <span className="truncate text-ink-muted">{SECTION_LABEL[row.section]}</span>
                        <span className="tabular-nums text-ink">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-ink-muted">
                  {t('storefront.overview.noEnquiries')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('storefront.overview.pieces')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Link
                href="/storefront/customise"
                className="block rounded-control px-1 py-1.5 font-medium text-forest hover:underline"
              >
                {t('storefront.overview.brandStudio')}
              </Link>
              <Link href="/settings" className="block rounded-control px-1 py-1.5 text-forest hover:underline">
                {t('storefront.overview.details')}
              </Link>
              <Link href="/portfolio" className="block rounded-control px-1 py-1.5 text-forest hover:underline">
                {t('storefront.overview.portfolio')}
              </Link>
              <Link href="/menu" className="block rounded-control px-1 py-1.5 text-forest hover:underline">
                {t('storefront.overview.menu')}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
