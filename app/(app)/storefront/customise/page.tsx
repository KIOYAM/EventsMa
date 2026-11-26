import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { PublishPanel } from '@/components/storefront/publish-panel'
import { SectionBuilder } from '@/components/storefront/section-builder'
import { ShareLinks } from '@/components/storefront/share-links'
import { PreviewLinkCard } from '@/components/storefront/preview-link'
import { SeoForm } from '@/components/storefront/seo-form'
import { DesignForm } from '@/components/storefront/design-form'
import { ThemePicker } from '@/components/storefront/theme-picker'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getSettings } from '@/lib/db/settings'
import {
  getStorefrontBrand,
  getStorefrontDesign,
  getStorefrontSections,
  getStorefrontSeo,
  getStorefrontServiceChoices,
} from '@/lib/db/storefront'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { setServiceVisible } from '../section-actions'
import { getPublishState, listStorefrontVersions } from '@/lib/db/storefronts'
import { requestOrigin } from '@/lib/http/request-origin.server'
import { createPreviewToken } from '@/lib/security/storefront-preview-token'
import { BRAND_COLOURS, BRAND_FONTS, BUILDER_NOTICE, fontClass } from '@/lib/domain/storefront'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { isPortfolioStorageConfigured } from '@/lib/storage/portfolio-images'
import { signedStorefrontImage } from '@/lib/storage/storefront-image'
import { clearLogo, resetLayout, saveBrand, saveIdentity, uploadLogo } from '../actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('storefront.title') }
}

/** Initials wordmark, used while no logo image is uploaded. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

const FIELD =
  'mt-1 h-11 w-full rounded-control border border-hairline bg-paper px-3 text-sm text-ink disabled:opacity-60'
const LABEL = 'text-xs text-ink-muted'
const SAVE = 'btn btn-sm btn-primary h-11 disabled:opacity-40'

/**
 * The brand studio: everything an owner can change about their public page, in the
 * order they think about it — who I am, what I look like, how it is laid out, and
 * how I send it to a client.
 */
export default async function CustomiseStorefrontPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = translatorFor(locale)
  const [settings, brand, design, sections, publishState, versions, serviceChoices, seo] =
    await Promise.all([
      withWorkspace(ctx, () => getSettings(ctx.orgId, ctx.demo)),
      withWorkspace(ctx, () => getStorefrontBrand(ctx.orgId, ctx.demo)),
      withWorkspace(ctx, () => getStorefrontDesign(ctx.orgId, ctx.demo)),
      withWorkspace(ctx, () => getStorefrontSections(ctx.orgId, ctx.demo)),
      withWorkspace(ctx, () => getPublishState(ctx.orgId, ctx.demo)),
      withWorkspace(ctx, () => listStorefrontVersions(ctx.orgId)),
      withWorkspace(ctx, () => getStorefrontServiceChoices(ctx.orgId, ctx.demo)),
      withWorkspace(ctx, () => getStorefrontSeo(ctx.orgId, ctx.demo)),
    ])

  const { saved, error } = await searchParams
  const notice = saved
    ? saved === 'publish'
      ? BUILDER_NOTICE.published
      : saved === 'restore'
        ? BUILDER_NOTICE.restored
        : saved === 'services'
          ? BUILDER_NOTICE.services
          : BUILDER_NOTICE.saved
    : error
      ? BUILDER_NOTICE[error]
      : null
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  // Liveness is a version, not a flag: a page marked published with no version
  // 404s, and calling it "Live" here would hide that from its owner.
  const isLive = publishState.publishedVersion !== null
  const storageReady = isPortfolioStorageConfigured()
  // The link must open the page the owner is looking at, so it follows the address
  // bar rather than the deploy's configured app URL (stale locally and on previews).
  const origin = await requestOrigin()
  const publicUrl = `${origin}/p/${settings.slug}`
  // Draft links are signed, not stored. A demo tenant has no organisation row to
  // preview, so it gets the explanatory text instead of a link that would 404.
  const previewToken = ctx.demo
    ? null
    : createPreviewToken({ orgId: ctx.orgId, slug: settings.slug })
  const previewUrl = previewToken ? `${publicUrl}/preview/${previewToken}` : null
  const displayName = brand.name || t('storefront.preview.initials')
  const mark = initials(displayName)
  // Signed here rather than in the data layer: the object is private, and the
  // preview needs the same short-lived URL the public page uses.
  const logoUrl = await signedStorefrontImage(brand.logoPath)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('storefront.eyebrow')}
        title={t('storefront.title')}
        description={t('storefront.description')}
        actions={
          <>
            <Link href="/storefront" className="btn btn-md btn-outline hover:bg-mint-subtle">
              {t('storefront.action.overview')}
            </Link>
            <Link
              href={`/p/${settings.slug}/preview`}
              className="btn btn-md btn-outline hover:bg-mint-subtle"
            >
              {t('storefront.action.preview')}
            </Link>
            <Link href={`/p/${settings.slug}`} target="_blank" className="btn btn-md btn-primary">
              {t('storefront.action.open')}
            </Link>
          </>
        }
      />

      {notice ? (
        <div className="card-flat bg-mint-subtle px-4 py-3 text-sm text-forest" role="status">
          {notice}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: brand.primary }} />
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-12 w-auto max-w-[120px] rounded-card object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="grid h-12 w-12 place-items-center rounded-card border border-hairline bg-paper text-sm font-semibold"
                style={{ color: brand.primary }}
              >
                {mark}
              </span>
            )}
            <div className="min-w-0">
              <p className={`text-2xl leading-tight text-forest ${fontClass(brand.font)}`}>
                {displayName}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-muted">
                {brand.subtitle ?? t('storefront.preview.noSubtitle')}
                {brand.city ? ` · ${brand.city}` : ''}
              </p>
            </div>
            <Badge tone={isLive ? 'success' : 'warning'}>
              {isLive ? t('storefront.preview.live') : t('storefront.preview.draft')}
            </Badge>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
            {brand.about ?? brand.tagline ?? t('storefront.preview.noIntro')}
          </p>
        </CardContent>
      </Card>

      <PublishPanel
        state={publishState}
        versions={versions}
        canEdit={canEdit}
        labels={{
          title: t('storefront.publish.title'),
          body: t('storefront.publish.body'),
          hasChanges: t('storefront.publish.hasChanges'),
          upToDate: t('storefront.publish.upToDate'),
          neverPublished: t('storefront.publish.neverPublished'),
          action: t('storefront.publish.action'),
          republish: t('storefront.publish.republish'),
          history: t('storefront.publish.history'),
          live: t('storefront.publish.live'),
          restore: t('storefront.publish.restore'),
          empty: t('storefront.publish.empty'),
          version: t('storefront.publish.version'),
          restoreHint: t('storefront.publish.restoreHint'),
          missingVersion: t('storefront.publish.missingVersion'),
        }}
      />

      <SeoForm
        seo={seo}
        defaults={{
          title: brand.name,
          description:
            brand.tagline ?? `${brand.name}${brand.city ? ` in ${brand.city}` : ''}`,
        }}
        canEdit={canEdit}
        labels={{
          title: t('storefront.seo.title'),
          body: t('storefront.seo.body'),
          titleField: t('storefront.seo.titleField'),
          titlePlaceholder: t('storefront.seo.titlePlaceholder'),
          descriptionField: t('storefront.seo.descriptionField'),
          descriptionPlaceholder: t('storefront.seo.descriptionPlaceholder'),
          noindex: t('storefront.seo.noindex'),
          noindexHint: t('storefront.seo.noindexHint'),
          save: t('storefront.seo.save'),
          hint: t('storefront.seo.hint'),
        }}
      />

      <DesignForm
        design={design}
        canEdit={canEdit}
        labels={{
          title: t('storefront.design.title'),
          body: t('storefront.design.body'),
          look: t('storefront.design.look'),
          accent: t('storefront.design.accent'),
          accentHint: t('storefront.design.accentHint'),
          themeAccent: t('storefront.design.themeAccent'),
          surface: t('storefront.design.surface'),
          surfaceTheme: t('storefront.design.surfaceTheme'),
          surfaceCanvas: t('storefront.design.surfaceCanvas'),
          surfacePaper: t('storefront.design.surfacePaper'),
          corners: t('storefront.design.corners'),
          cornersSharp: t('storefront.design.cornersSharp'),
          cornersSoft: t('storefront.design.cornersSoft'),
          cornersRound: t('storefront.design.cornersRound'),
          spacing: t('storefront.design.spacing'),
          spacingCompact: t('storefront.design.spacingCompact'),
          spacingRegular: t('storefront.design.spacingRegular'),
          spacingAiry: t('storefront.design.spacingAiry'),
          heroHeight: t('storefront.design.heroHeight'),
          heroShort: t('storefront.design.heroShort'),
          heroMedium: t('storefront.design.heroMedium'),
          heroTall: t('storefront.design.heroTall'),
          cta: t('storefront.design.cta'),
          ctaPlaceholder: t('storefront.design.ctaPlaceholder'),
          announcement: t('storefront.design.announcement'),
          announcementPlaceholder: t('storefront.design.announcementPlaceholder'),
          channels: t('storefront.design.channels'),
          channelsBody: t('storefront.design.channelsBody'),
          whatsapp: t('storefront.design.whatsapp'),
          whatsappPlaceholder: t('storefront.design.whatsappPlaceholder'),
          instagram: t('storefront.design.instagram'),
          instagramPlaceholder: t('storefront.design.instagramPlaceholder'),
          email: t('storefront.design.email'),
          emailPlaceholder: t('storefront.design.emailPlaceholder'),
          save: t('storefront.design.save'),
          hint: t('storefront.design.hint'),
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('storefront.services.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-muted">{t('storefront.services.body')}</p>
          {serviceChoices.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('storefront.services.empty')}</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {serviceChoices.map((choice) => (
                <li
                  key={choice.verticalKey}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">
                      {verticalDescriptor(choice.verticalKey).label}
                    </p>
                    <Badge tone={choice.visible ? 'success' : 'outline'}>
                      {choice.visible
                        ? t('storefront.services.shown')
                        : t('storefront.services.hidden')}
                    </Badge>
                  </div>
                  <form action={setServiceVisible}>
                    <input type="hidden" name="verticalKey" value={choice.verticalKey} />
                    <input type="hidden" name="visible" value={choice.visible ? '0' : '1'} />
                    <button
                      type="submit"
                      disabled={!canEdit}
                      className="h-11 rounded-control border border-hairline bg-paper px-3 text-xs font-medium text-ink disabled:opacity-40"
                    >
                      {choice.visible
                        ? t('storefront.services.hide')
                        : t('storefront.services.show')}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('storefront.identity.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={saveIdentity} className="space-y-3">
              <label className="block">
                <span className={LABEL}>{t('storefront.identity.name')}</span>
                <input
                  name="name"
                  defaultValue={brand.name}
                  required
                  maxLength={120}
                  disabled={!canEdit}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{t('storefront.identity.tagline')}</span>
                <input
                  name="tagline"
                  defaultValue={brand.tagline ?? ''}
                  maxLength={200}
                  disabled={!canEdit}
                  placeholder={t('storefront.identity.taglinePlaceholder')}
                  className={FIELD}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={LABEL}>{t('storefront.identity.city')}</span>
                  <input
                    name="city"
                    defaultValue={brand.city ?? ''}
                    maxLength={80}
                    disabled={!canEdit}
                    className={FIELD}
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>{t('storefront.identity.phone')}</span>
                  <input
                    name="phone"
                    defaultValue={brand.phone ?? ''}
                    maxLength={24}
                    disabled={!canEdit}
                    className={FIELD}
                  />
                </label>
              </div>
              <button type="submit" disabled={!canEdit} className={SAVE}>
                {t('storefront.identity.save')}
              </button>
            </form>

            <div className="rounded-control border border-hairline bg-canvas/60 p-3">
              <form action={uploadLogo} className="flex flex-wrap items-end gap-2">
                <label className="min-w-0 flex-1">
                  <span className={LABEL}>{t('storefront.logo.label')}</span>
                  <input
                    type="file"
                    name="logo"
                    accept="image/webp,image/jpeg,image/png"
                    disabled={!canEdit || !storageReady}
                    className="mt-1 block w-full text-xs text-ink-muted file:mr-3 file:rounded-control file:border file:border-hairline file:bg-paper file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink disabled:opacity-60"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canEdit || !storageReady}
                  className="btn btn-sm btn-outline h-11 disabled:opacity-40"
                >
                  {t('storefront.logo.upload')}
                </button>
              </form>
              {brand.logoPath ? (
                <form action={clearLogo} className="mt-2">
                  <button
                    type="submit"
                    disabled={!canEdit}
                    className="h-11 rounded-control px-2 text-xs text-ink-muted underline-offset-2 hover:underline disabled:opacity-40"
                  >
                    {t('storefront.logo.remove')}
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-xs text-ink-muted">
                  {t('storefront.logo.initialsHint', { mark })}
                </p>
              )}
              {!storageReady ? (
                <p className="mt-2 text-xs text-ink-muted">{t('storefront.logo.storageOff')}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('storefront.brand.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={saveBrand} className="space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className={LABEL}>{t('storefront.brand.colour')}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      name="primary"
                      defaultValue={brand.primary}
                      disabled={!canEdit}
                      aria-label={t('storefront.brand.colour')}
                      className="h-11 w-14 cursor-pointer rounded-control border border-hairline bg-paper p-1 disabled:opacity-60"
                    />
                    <span className="text-xs text-ink-muted">{brand.primary}</span>
                  </span>
                </label>
                <label className="block min-w-[180px] flex-1">
                  <span className={LABEL}>{t('storefront.brand.font')}</span>
                  <select
                    name="font"
                    defaultValue={brand.font}
                    disabled={!canEdit}
                    className={FIELD}
                  >
                    {BRAND_FONTS.map((font) => (
                      <option key={font.key} value={font.key}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {BRAND_COLOURS.map((colour) => (
                  <span
                    key={colour.hex}
                    title={colour.label}
                    className="h-5 w-5 rounded-full border border-hairline"
                    style={{ backgroundColor: colour.hex }}
                  />
                ))}
                <span className="ml-1 text-xs text-ink-muted">
                  {t('storefront.brand.suggestions')}
                </span>
              </div>

              <label className="block">
                <span className={LABEL}>{t('storefront.brand.subtitle')}</span>
                <input
                  name="subtitle"
                  defaultValue={brand.subtitle ?? ''}
                  maxLength={120}
                  disabled={!canEdit}
                  placeholder={t('storefront.brand.subtitlePlaceholder')}
                  className={FIELD}
                />
              </label>

              <label className="block">
                <span className={LABEL}>{t('storefront.brand.about')}</span>
                <textarea
                  name="about"
                  defaultValue={brand.about ?? ''}
                  maxLength={600}
                  rows={3}
                  disabled={!canEdit}
                  placeholder={t('storefront.brand.aboutPlaceholder')}
                  className="mt-1 w-full rounded-control border border-hairline bg-paper px-3 py-2 text-sm text-ink disabled:opacity-60"
                />
              </label>

              <button type="submit" disabled={!canEdit} className={SAVE}>
                {t('storefront.brand.save')}
              </button>
            </form>

            <div className="border-t border-hairline pt-4">
              <p className="mb-2 text-xs text-ink-muted">{t('storefront.brand.layout')}</p>
              <ThemePicker current={brand.theme} canEdit={canEdit} brandPrimary={brand.primary} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('storefront.sections.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-ink-muted">{t('storefront.sections.body')}</p>
          <SectionBuilder
            sections={sections}
            canEdit={canEdit}
            storageReady={storageReady}
            labels={{
              faqQuestion: t('storefront.sections.labels.faqQuestion'),
              faqAnswer: t('storefront.sections.labels.faqAnswer'),
              teamName: t('storefront.sections.labels.teamName'),
              teamRole: t('storefront.sections.labels.teamRole'),
              testimonialName: t('storefront.sections.labels.testimonialName'),
              testimonialQuote: t('storefront.sections.labels.testimonialQuote'),
              testimonialContext: t('storefront.sections.labels.testimonialContext'),
              add: t('storefront.sections.labels.add'),
              save: t('storefront.sections.labels.save'),
              remove: t('storefront.sections.labels.remove'),
              empty: t('storefront.sections.labels.empty'),
              limit: t('storefront.sections.labels.limit'),
              faqQuestionExample: t('storefront.sections.labels.faqQuestionExample'),
              faqAnswerExample: t('storefront.sections.labels.faqAnswerExample'),
              teamNameExample: t('storefront.sections.labels.teamNameExample'),
              teamRoleExample: t('storefront.sections.labels.teamRoleExample'),
              testimonialNameExample: t('storefront.sections.labels.testimonialNameExample'),
              testimonialQuoteExample: t('storefront.sections.labels.testimonialQuoteExample'),
              testimonialContextExample: t('storefront.sections.labels.testimonialContextExample'),
            }}
          />
          <form action={resetLayout}>
            <button
              type="submit"
              disabled={!canEdit}
              className="h-11 rounded-control border border-hairline bg-paper px-3 text-xs font-medium text-ink disabled:opacity-40"
            >
              {t('storefront.sections.reset')}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('storefront.share.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLive ? (
            <ShareLinks
              url={publicUrl}
              message={t('storefront.share.message', {
                business: displayName,
                url: publicUrl,
              })}
              labels={{
                address: t('storefront.share.address'),
                copy: t('storefront.share.copy'),
                copied: t('storefront.share.copied'),
                copiedHint: t('storefront.share.copiedHint'),
                copyFailedHint: t('storefront.share.copyFailedHint'),
                hint: t('storefront.share.hint'),
                whatsapp: t('storefront.share.whatsapp'),
                open: t('storefront.share.open'),
              }}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-ink-muted">
                {t('storefront.share.draftBody')}
              </p>
              <Link href="/storefront" className="btn btn-sm btn-primary h-11">
                {t('storefront.share.draftAction')}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <PreviewLinkCard
        url={previewUrl}
        message={t('storefront.previewLink.message', {
          business: brand.name || t('storefront.preview.initials'),
          url: previewUrl ?? '',
        })}
        labels={{
          title: t('storefront.previewLink.title'),
          body: t('storefront.previewLink.body'),
          unavailable: t('storefront.previewLink.unavailable'),
          address: t('storefront.previewLink.address'),
          copy: t('storefront.previewLink.copy'),
          copied: t('storefront.previewLink.copied'),
          copiedHint: t('storefront.share.copiedHint'),
          copyFailedHint: t('storefront.share.copyFailedHint'),
          hint: t('storefront.previewLink.hint'),
          whatsapp: t('storefront.previewLink.whatsapp'),
          open: t('storefront.previewLink.open'),
        }}
      />
    </div>
  )
}
