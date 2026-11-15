import Link from 'next/link'
import { Inbox, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { getLocale, translatorFor } from '@/lib/i18n/server'
import { formatPaiseLocalised } from '@/lib/i18n/format'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { withWorkspace } from '@/lib/db/workspace'
import { getOwnerSubmissions } from '@/lib/db/share'
import { shortDate } from '@/lib/utils'
import { setSubmissionStatus } from './actions'

export async function generateMetadata() {
  const locale = await getLocale()
  return { title: translatorFor(locale)('submissions.title') }
}

const TONE: Record<string, 'mint' | 'gold' | 'success' | 'outline'> = {
  new: 'gold',
  reviewed: 'mint',
  quoted: 'success',
  closed: 'outline',
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const locale = await getLocale()
  const t = createTranslator(locale)
  const params = await searchParams
  const submissions = await withWorkspace(ctx, () => getOwnerSubmissions(ctx.orgId, ctx.demo))
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const openCount = submissions.filter((s) => s.status === 'new').length

  const errorKey = params.error === 'permission' ? 'submissions.errors.permission' : params.error === 'demo' ? 'submissions.errors.demo' : 'submissions.errors.fallback'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('submissions.eyebrow')}
        title={t('submissions.heading')}
        description={t('submissions.intro')}
        actions={
          <Link
            href="/events"
            className="btn btn-md btn-outline hover:bg-mint-subtle"
          >
            {t('submissions.events')}
          </Link>
        }
      />

      {params.error ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {t(errorKey)}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              {t('submissions.stats.new')}
            </p>
            <p className="mt-1 font-display text-2xl text-ink">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              {t('submissions.stats.total')}
            </p>
            <p className="mt-1 font-display text-2xl text-ink">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              {t('submissions.stats.indicative')}
            </p>
            <p className="mt-1 font-display text-2xl text-ink">
              {formatPaiseLocalised(
                submissions.reduce((sum, s) => sum + s.indicativeTotalPaise, 0),
                locale,
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<Inbox className="h-6 w-6" aria-hidden />}
              title={t('submissions.emptyTitle')}
              description={t('submissions.emptyBody')}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>{submission.clientName}</CardTitle>
                    <CardDescription>
                      {submission.eventTitle ? (
                        <>
                          <Link
                            href={`/events/${submission.eventId}`}
                            className="underline underline-offset-2 hover:text-forest"
                          >
                            {submission.eventTitle}
                          </Link>
                          {submission.eventDate ? ` · ${shortDate(submission.eventDate)}` : ''}
                          {' · '}
                        </>
                      ) : null}
                      {t('submissions.received', {
                        date: new Date(submission.createdAt).toLocaleString('en-IN'),
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={TONE[submission.status] ?? 'outline'}>
                      {t('submissions.status', { status: submission.status })}
                    </Badge>
                    <span className="tabular text-sm font-medium text-forest">
                      {formatPaiseLocalised(submission.indicativeTotalPaise, locale)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 text-xs text-ink-muted">
                  {submission.clientPhone ? (
                    <a href={`tel:${submission.clientPhone}`} className="inline-flex items-center gap-1.5 hover:text-forest">
                      <Phone className="h-3.5 w-3.5" aria-hidden /> {submission.clientPhone}
                    </a>
                  ) : null}
                  {submission.clientEmail ? (
                    <a href={`mailto:${submission.clientEmail}`} className="inline-flex items-center gap-1.5 hover:text-forest">
                      <Mail className="h-3.5 w-3.5" aria-hidden /> {submission.clientEmail}
                    </a>
                  ) : null}
                  <span>{t('submissions.indicativeOnly')}</span>
                </div>

                {submission.menuSessions.length > 0 ? (
                  <div className="rounded-control border border-hairline bg-paper p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                      {t('submissions.cateringMenuBySession')}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {submission.menuSessions.map((session) => (
                        <div key={session.id} className="rounded-control bg-canvas p-2.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-sm font-medium text-ink">{session.name}</p>
                            <span className="tabular text-xs text-ink">
                              {formatPaiseLocalised(session.indicativePaise, locale)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            {session.guests > 0 ? t('submissions.guestsCount', { count: session.guests }) : t('submissions.guestsToConfirm')}
                            {session.startTime ? ` · ${session.startTime}${session.endTime ? `–${session.endTime}` : ''}` : ''}
                            {` · ${session.dishCount} ${t('submissions.dishesCount', { count: session.dishCount })}`}
                          </p>
                          <ul className="mt-1.5 space-y-0.5 text-[11px] text-ink">
                            {session.dishes.map((dish) => (
                              <li key={dish.id} className="flex min-w-0 gap-1.5">
                                <span className="truncate">{dish.label}</span>
                                {dish.categoryName ? (
                                  <span className="shrink-0 text-ink-muted">
                                    · {dish.categoryName}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  {submission.services
                    .filter(
                      (service) =>
                        !(service.key === 'catering' && submission.menuSessions.length > 0),
                    )
                    .map((service) => (
                      <div key={service.key} className="rounded-control border border-hairline bg-canvas p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-ink">{service.label}</p>
                          <span className="tabular text-xs text-ink">
                            {formatPaiseLocalised(service.indicativePaise, locale)}
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                          {service.lines.map((line) => (
                            <li key={line.id} className="flex justify-between gap-2">
                              <span className="min-w-0 truncate">
                                {line.label}
                                {line.basis > 1 ? ` × ${line.basis}` : ''}
                              </span>
                              <span className="tabular shrink-0 text-ink">
                                {formatPaiseLocalised(line.indicativePaise, locale)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>

                {submission.message ? (
                  <p className="rounded-control bg-mint-subtle px-3 py-2 text-sm text-forest">
                    {submission.message}
                  </p>
                ) : null}

                {canEdit ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {(['reviewed', 'quoted', 'closed'] as const).map((status) => (
                      <form key={status} action={setSubmissionStatus}>
                        <input type="hidden" name="id" value={submission.id} />
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center rounded-control border border-hairline px-3 text-xs text-ink hover:bg-mint-subtle"
                        >
                          {t('submissions.mark', { status })}
                        </button>
                      </form>
                    ))}
                    {submission.eventId ? (
                      <Link
                        href="/quotes/new"
                        className="inline-flex h-9 items-center rounded-control bg-forest px-3 text-xs font-medium text-white"
                      >
                        {t('submissions.prepareQuotation')}
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
