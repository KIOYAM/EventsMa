import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getSettings } from '@/lib/db/settings'
import { setPublished } from '../settings/actions'

export const metadata = { title: 'Storefront' }

/**
 * The public page is a projection of settings, portfolio and menu. This screen
 * shows what a stranger sees and the one switch that puts it online, so nobody
 * has to hunt for publish inside a settings form.
 */
export default async function StorefrontPage() {
  const ctx = await requireWorkspace()
  const settings = await getSettings(ctx.orgId, ctx.demo)
  const canManage = canManageCommercial(ctx.role) && !ctx.demo
  const publicPath = `/p/${settings.slug}`

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Public page"
        title="What a stranger sees before they call"
        description="Your name, city, service areas and published work on one link you can put in a WhatsApp reply. Nothing on it reveals a client's price or contact number."
        actions={
          <Link
            href={publicPath}
            target="_blank"
            className="inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
          >
            Open public page
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="h-2 w-full" style={{ backgroundColor: settings.settings.brandPrimary }} />
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-ink">{settings.name}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {settings.tagline ?? 'No tagline yet'}
                </p>
              </div>
              <Badge tone={settings.published ? 'success' : 'warning'}>
                {settings.published ? 'Published' : 'Draft'}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">City</dt>
                <dd className="text-ink">
                  {settings.city ?? '—'}
                  {settings.district ? `, ${settings.district}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Phone</dt>
                <dd className="text-ink">{settings.phone ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-ink-muted">Service areas</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {settings.settings.serviceAreas.length === 0 ? (
                    <span className="text-ink-muted">Not set</span>
                  ) : (
                    settings.settings.serviceAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-pill border border-hairline px-2 py-0.5 text-xs text-ink-muted"
                      >
                        {area}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>

            <div className="rounded-control bg-canvas p-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                Advance policy shown on quotes
              </p>
              <p className="mt-1 text-sm text-ink">
                {settings.settings.advancePct}% to confirm ·{' '}
                {settings.settings.taxMode === 'inclusive' ? 'tax inclusive' : 'tax extra'}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Calculated on every quote from the real total, not on an example figure.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-ink-muted">
                A draft page returns 404. Published pages are readable by anyone with the link and
                are safe to share; quotes inside them still need their own token.
              </p>
              <form action={setPublished}>
                <input type="hidden" name="published" value={settings.published ? '0' : '1'} />
                <button
                  type="submit"
                  disabled={!canManage}
                  className="inline-flex h-10 w-full items-center justify-center rounded-control border border-hairline bg-paper text-sm font-medium text-ink disabled:opacity-50"
                >
                  {settings.published ? 'Unpublish page' : 'Publish page'}
                </button>
              </form>
              {!canManage ? (
                <p className="text-xs text-ink-muted">
                  {ctx.demo ? 'Demo mode is read-only.' : 'Owner or manager only.'}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit the pieces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link href="/settings" className="block rounded-control px-1 py-1.5 text-forest hover:underline">
                Business details and brand colour
              </Link>
              <Link href="/portfolio" className="block rounded-control px-1 py-1.5 text-forest hover:underline">
                Portfolio entries
              </Link>
              <Link href="/menu" className="block rounded-control px-1 py-1.5 text-forest hover:underline">
                Menu board
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
