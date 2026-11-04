import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Textarea } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getPortfolio } from '@/lib/db/settings'
import { shortDate } from '@/lib/utils'
import { addPortfolioItem, setPortfolioPublished } from './actions'

export const metadata = { title: 'Portfolio' }

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
  const params = await searchParams
  const items = await getPortfolio(ctx.orgId, ctx.demo)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const publishedCount = items.filter((item) => item.published).length

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
              {publishedCount} of {items.length} published
            </p>
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="No work shown yet"
              description="Add one event you are proud of. Two honest entries beat a wall of stock photos."
            />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-card border border-hairline bg-paper p-4">
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
                  {item.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add an entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addPortfolioItem} className="space-y-4">
              <Field label="Title" htmlFor="portfolioTitle">
                <Input id="portfolioTitle" name="title" required maxLength={140} placeholder="Wedding at Malabar House" />
              </Field>
              <Field label="Date" htmlFor="portfolioDate">
                <Input id="portfolioDate" name="eventDate" type="date" />
              </Field>
              <Field label="Venue" htmlFor="portfolioVenue">
                <Input id="portfolioVenue" name="venueName" maxLength={140} placeholder="Malabar House, Kochi" />
              </Field>
              <Field label="What you did" htmlFor="portfolioDescription" hint="Guest count and format, not client names.">
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
                className="inline-flex h-11 w-full items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
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
