import Link from 'next/link'
import { Inbox, Mail, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getOwnerSubmissions } from '@/lib/db/share'
import { formatINR } from '@/lib/domain/money'
import { shortDate } from '@/lib/utils'
import { setSubmissionStatus } from './actions'

export const metadata = { title: 'Submissions' }

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
  const params = await searchParams
  const submissions = await getOwnerSubmissions(ctx.orgId, ctx.demo)
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const openCount = submissions.filter((s) => s.status === 'new').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer requests"
        title="Submissions from your share links"
        description="Every request a customer sends through a public link lands here with their details and a service-wise breakdown. Nothing here is a lead promise — it is a request you choose to answer."
        actions={
          <Link
            href="/events"
            className="inline-flex h-11 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink hover:bg-mint-subtle"
          >
            Events
          </Link>
        }
      />

      {params.error ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {params.error === 'permission'
            ? 'Only an owner or manager can change a submission.'
            : params.error === 'demo'
              ? 'Demo mode is read-only.'
              : 'That request was not valid.'}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">New</p>
            <p className="mt-1 font-display text-2xl text-ink">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">Total</p>
            <p className="mt-1 font-display text-2xl text-ink">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              Indicative value
            </p>
            <p className="mt-1 font-display text-2xl text-ink">
              {formatINR(submissions.reduce((sum, s) => sum + s.indicativeTotalPaise, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<Inbox className="h-6 w-6" aria-hidden />}
              title="No submissions yet"
              description="Open an event, go to its Services tab and create a share link. Customer requests will appear here."
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
                          <Link href={`/events/${submission.eventId}`} className="underline underline-offset-2 hover:text-forest">
                            {submission.eventTitle}
                          </Link>
                          {submission.eventDate ? ` · ${shortDate(submission.eventDate)}` : ''}
                          {' · '}
                        </>
                      ) : null}
                      Received {new Date(submission.createdAt).toLocaleString('en-IN')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={TONE[submission.status] ?? 'outline'}>{submission.status}</Badge>
                    <span className="tabular text-sm font-medium text-forest">
                      {formatINR(submission.indicativeTotalPaise)}
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
                  <span>Indicative only · not a confirmed price</span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {submission.services.map((service) => (
                    <div key={service.key} className="rounded-control border border-hairline bg-canvas p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-ink">{service.label}</p>
                        <span className="tabular text-xs text-ink">
                          {formatINR(service.indicativePaise)}
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
                              {formatINR(line.indicativePaise)}
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
                  <form action={setSubmissionStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={submission.id} />
                    {(['reviewed', 'quoted', 'closed'] as const).map((status) => (
                      <button
                        key={status}
                        type="submit"
                        name="status"
                        value={status}
                        className="inline-flex h-9 items-center rounded-control border border-hairline px-3 text-xs text-ink hover:bg-mint-subtle"
                      >
                        Mark {status}
                      </button>
                    ))}
                    {submission.eventId ? (
                      <Link
                        href="/quotes/new"
                        className="inline-flex h-9 items-center rounded-control bg-forest px-3 text-xs font-medium text-white"
                      >
                        Prepare quotation
                      </Link>
                    ) : null}
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
