import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, FileText, IndianRupee, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AttentionList } from '@/components/dashboard/attention-list'
import { PageHeader } from '@/components/ui/page-header'
import { StatSkeleton, TableSkeleton } from '@/components/ui/skeleton'
import { requireWorkspace, type WorkspaceContext } from '@/lib/auth/session'
import { getAttentionItems } from '@/lib/db/attention'
import { getWorkspaceSummary } from '@/lib/db/queries'
import { formatINR, formatPercentBp } from '@/lib/domain/money'
import { verticalDescriptor } from '@/lib/domain/verticals'
import { relativeDays, shortDate } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

type StatusTone = 'success' | 'mint' | 'gold' | 'accent' | 'neutral'

const STATUS_TONE: Record<string, StatusTone> = {
  accepted: 'success',
  sent: 'mint',
  draft: 'neutral',
  viewed: 'gold',
  declined: 'accent',
}

function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? 'neutral'
}

/** "dish" → "dishes", "decor element" → "decor elements". */
function pluralItem(noun: string, count: number): string {
  if (count === 1) return noun
  if (/(s|sh|ch|x|z)$/.test(noun)) return `${noun}es`
  if (/[^aeiou]y$/.test(noun)) return `${noun.slice(0, -1)}ies`
  return `${noun}s`
}

export default async function DashboardPage() {
  const ctx = await requireWorkspace()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="This week"
        title="Know what you have quoted, and what it earns"
        description="Every total below is server-computed in paise from the services this business actually offers."
        actions={
          <Link
            href="/quotes/new"
            className="inline-flex h-11 items-center gap-2 rounded-control bg-forest px-4 text-sm font-medium text-white hover:bg-forest-hover"
          >
            New quote
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody ctx={ctx} />
      </Suspense>
    </div>
  )
}

async function DashboardBody({ ctx }: { ctx: WorkspaceContext }) {
  const [data, attention] = await Promise.all([
    getWorkspaceSummary(ctx.orgId, ctx.demo),
    getAttentionItems(ctx.orgId, ctx.demo),
  ])
  const activeServices = data.services.filter((s) => s.enabled)

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Open pipeline"
          value={formatINR(data.stats.pipelinePaise, { compact: true })}
          hint="Draft and sent quotes"
          icon={<IndianRupee className="h-4 w-4" aria-hidden />}
        />
        <Stat
          label="Awaiting reply"
          value={String(data.stats.sentCount)}
          hint="Sent, not yet accepted"
          icon={<FileText className="h-4 w-4" aria-hidden />}
        />
        <Stat
          label="Upcoming events"
          value={String(data.stats.upcomingCount)}
          hint="Dated today or later"
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
        />
        <Stat
          label="Average margin"
          value={formatPercentBp(data.stats.marginBp)}
          hint="After food, crew and vendor cost"
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Needs attention</h2>
            <p className="text-xs text-ink-muted">
              Stale quotes, events inside two weeks and invoices past due.
            </p>
          </div>
        </div>
        <AttentionList items={attention} />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Services you provide</h2>
            <p className="text-xs text-ink-muted">
              Each service has its own catalogue, units and tax treatment.
            </p>
          </div>
          <Link href="/services" className="text-sm text-forest underline-offset-4 hover:underline">
            Manage
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {activeServices.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-4 text-sm text-ink-muted">
                No services enabled yet. Enable catering, decor or photography to start quoting.
              </CardContent>
            </Card>
          ) : (
            activeServices.map((service) => {
              const descriptor = verticalDescriptor(service.verticalKey)
              return (
                <div
                  key={service.verticalKey}
                  className="min-w-[168px] rounded-card border border-hairline bg-paper p-4"
                >
                  <p className="text-sm font-medium text-ink">{descriptor.label}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {service.itemCount} {pluralItem(descriptor.itemNoun, service.itemCount)}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Recent quotes</h2>
            <p className="text-xs text-ink-muted">Grouped totals across every service on the event.</p>
          </div>
          <Link href="/quotes" className="text-sm text-forest underline-offset-4 hover:underline">
            All quotes
          </Link>
        </div>

        {data.quotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-2 p-6">
              <p className="text-sm font-medium text-ink">No quotes yet</p>
              <p className="text-sm text-ink-muted">
                Add a service to your catalogue, then build the first quote. It takes about a minute.
              </p>
              <Link
                href="/quotes/new"
                className="mt-1 inline-flex h-10 items-center rounded-control bg-forest px-4 text-sm font-medium text-white"
              >
                Create a quote
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-card border border-hairline bg-paper">
            {data.quotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-4 py-3.5 last:border-b-0 hover:bg-mint-subtle/60 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{quote.title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {quote.number} · {shortDate(quote.eventDate)} ({relativeDays(quote.eventDate)}) ·{' '}
                    {quote.guests} guests
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm font-medium text-ink">
                    {formatINR(quote.totalPaise)}
                  </span>
                  <Badge tone={statusTone(quote.status)}>{quote.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {data.demo ? (
        <p className="text-xs text-ink-muted">
          Showing labelled demo data. Connect Supabase in <code>.env.local</code> to use a live
          workspace.
        </p>
      ) : null}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-ink-muted">
          {icon}
          <p className="text-xs font-medium uppercase tracking-[0.1em]">{label}</p>
        </div>
        <p className="tabular mt-3 text-xl font-semibold text-forest sm:text-2xl">{value}</p>
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={4} />
    </div>
  )
}
