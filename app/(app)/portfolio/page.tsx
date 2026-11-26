import { ArrowDown, ArrowUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { PhotoUpload } from '@/components/portfolio/photo-upload'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getPortfolio } from '@/lib/db/settings'
import { createTranslator } from '@/lib/i18n'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { signedPortfolioUrls } from '@/lib/storage/portfolio-images'
import { shortDate } from '@/lib/utils'
import { addPortfolioItem, movePortfolioItem, removePortfolioPhoto, setPortfolioPublished } from './actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('portfolio.title') }
}

const ERROR_COPY: Record<string, string> = {
  permission: 'Only an owner or manager can change the portfolio.',
  demo: 'Demo mode: connect a database to publish work.',
  title: 'Give the entry a title.',
  missing: 'That entry no longer exists.',
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams
  const items = await withWorkspace(ctx, () => getPortfolio(ctx.orgId, ctx.demo))
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const publishedCount = items.filter((item) => item.published).length

  // Signed, expiring URLs: the bucket is private, so the page never leaks a
  // permanent public path to a client's event.
  const signed = await signedPortfolioUrls(items.map((item) => item.coverPath))
  const withPhoto = items.filter((item) => item.coverPath && signed.has(item.coverPath)).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Proof of work"
        title="Events you are allowed to show"
        description="Only published entries reach the public page. Client names stay out unless you type them, because a portfolio is marketing, not a database export."
      />

      {params.error && ERROR_COPY[params.error] ? (
        <div className="rounded-card border border-terracotta/30 bg-terracotta-soft px-4 py-3 text-sm text-terracotta">
          {ERROR_COPY[params.error]}
        </div>
      ) : null}
      {params.saved ? (
        <div className="rounded-card border border-mint bg-mint-subtle px-4 py-3 text-sm text-forest">
          Portfolio updated.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Entries</h2>
            <p className="text-xs text-ink-muted">
              {publishedCount} of {items.length} published · {withPhoto} with a photo
            </p>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="No work shown yet"
              description="Add one event you are proud of. Two honest entries beat a wall of stock photos."
            />
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const photo = item.coverPath ? signed.get(item.coverPath) : undefined
                return (
                  <article key={item.id} className="card-surface p-4">
                    <div className="flex flex-wrap gap-4">
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          loading="lazy"
                          className="h-20 w-28 shrink-0 rounded-control object-cover"
                        />
                      ) : (
                        <div className="grid h-20 w-28 shrink-0 place-items-center rounded-control border border-dashed border-hairline px-3 text-center text-[11px] text-ink-muted">
                          No photo
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink">{item.title}</p>
                            <p className="mt-0.5 text-xs text-ink-muted">
                              {item.eventDate ? shortDate(item.eventDate) : 'Undated'}
                              {item.venueName ? ` · ${item.venueName}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={item.published ? 'success' : 'outline'}>
                              {item.published ? 'Public' : 'Hidden'}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <form action={movePortfolioItem}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="direction" value="up" />
                                <button
                                  type="submit"
                                  disabled={!canEdit || index === 0}
                                  aria-label={`${t('portfolio.order.up')} — ${item.title}`}
                                  className="grid h-9 w-9 place-items-center rounded-control border border-hairline text-ink-muted hover:bg-mint-subtle disabled:opacity-40"
                                >
                                  <ArrowUp className="h-4 w-4" aria-hidden />
                                </button>
                              </form>
                              <form action={movePortfolioItem}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="direction" value="down" />
                                <button
                                  type="submit"
                                  disabled={!canEdit || index === items.length - 1}
                                  aria-label={`${t('portfolio.order.down')} — ${item.title}`}
                                  className="grid h-9 w-9 place-items-center rounded-control border border-hairline text-ink-muted hover:bg-mint-subtle disabled:opacity-40"
                                >
                                  <ArrowDown className="h-4 w-4" aria-hidden />
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>

                        {item.description ? (
                          <p className="text-sm leading-relaxed text-ink-muted">{item.description}</p>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-3">
                          <PhotoUpload
                            itemId={item.id}
                            hasPhoto={Boolean(item.coverPath)}
                            disabled={!canEdit}
                            locale={locale}
                          />
                          {item.coverPath ? (
                            <form action={removePortfolioPhoto}>
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                disabled={!canEdit}
                                className="text-xs text-terracotta underline underline-offset-2 disabled:opacity-50"
                              >
                                {t('portfolio.photo.remove')}
                              </button>
                            </form>
                          ) : null}
                          <form action={setPortfolioPublished}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="published" value={item.published ? '0' : '1'} />
                            <button
                              type="submit"
                              disabled={!canEdit}
                              className="text-xs text-forest underline-offset-2 hover:underline disabled:opacity-50"
                            >
                              {item.published ? 'Hide' : 'Publish'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add an entry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs leading-relaxed text-ink-muted">
              {t('portfolio.photo.hint')}
            </p>
            <form action={addPortfolioItem} className="space-y-4">
              <Field label="Title" htmlFor="portfolioTitle">
                <Input
                  id="portfolioTitle"
                  name="title"
                  required
                  maxLength={140}
                  placeholder="Wedding at Malabar House"
                />
              </Field>
              <Field label="Date" htmlFor="portfolioDate">
                <Input id="portfolioDate" name="eventDate" type="date" />
              </Field>
              <Field label="Venue" htmlFor="portfolioVenue">
                <Input
                  id="portfolioVenue"
                  name="venueName"
                  maxLength={140}
                  placeholder="Malabar House, Kochi"
                />
              </Field>
              <Field
                label="What you did"
                htmlFor="portfolioDescription"
                hint="Guest count and format, not client names."
              >
                <Textarea
                  id="portfolioDescription"
                  name="description"
                  className="min-h-24"
                  maxLength={400}
                  placeholder="180 guests, sadya service, live counters."
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="published" className="h-4 w-4 rounded border-hairline" />
                Show on the public page
              </label>
              <button
                type="submit"
                disabled={!canEdit}
                className="btn btn-md btn-primary w-full disabled:opacity-50"
              >
                Add entry
              </button>
              {!canEdit ? (
                <p className="text-xs text-ink-muted">
                  {ctx.demo ? 'Demo mode is read-only.' : 'Owner or manager only.'}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
