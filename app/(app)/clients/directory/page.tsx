import { Suspense } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { DebouncedSearch } from '@/components/debounced-search'
import { Pagination } from '@/components/pagination'
import { requireWorkspace } from '@/lib/auth/session'
import { getClientPage } from '@/lib/db/crm'
import { PAGE_SIZE, parsePage } from '@/lib/pagination'
import { shortDate } from '@/lib/utils'

export const metadata = { title: 'Client directory' }

export default async function ClientDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const page = parsePage(params.page)
  const data = await getClientPage(ctx.orgId, ctx.demo, { q: params.q, page })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationships"
        title="Client directory"
        description="One row per real client. Phone numbers are deduped at the database, so a public enquiry and a manual event entry cannot silently create two people."
        actions={
          <Link
            href="/clients"
            className="inline-flex h-11 items-center rounded-control border border-hairline bg-paper px-4 text-sm text-ink"
          >
            Enquiries
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          {data.total} client{data.total === 1 ? '' : 's'}
          {params.q ? ` matching "${params.q}"` : ''}
        </p>
        <div className="w-full sm:max-w-xs">
          <Suspense fallback={<div className="h-10 rounded-control border border-hairline bg-paper" />}>
            <DebouncedSearch placeholder="Search name, phone or email" />
          </Suspense>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden />}
          title="No clients match"
          description="A client is created when an enquiry arrives or an event is saved with a new phone number."
          action={
            <Link href="/clients/directory" className="text-sm text-forest underline underline-offset-4">
              Clear search
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-hairline bg-paper">
          <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-hairline bg-canvas/60 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted sm:grid">
            <span>Client</span>
            <span>Contact</span>
            <span>Enquiries</span>
            <span>Events</span>
            <span>Last activity</span>
          </div>
          {data.rows.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="grid gap-2 border-b border-hairline px-4 py-3 text-sm last:border-0 hover:bg-canvas sm:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.8fr] sm:items-center sm:gap-3"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{client.name}</span>
                <span className="text-xs text-ink-muted">{client.source ?? 'manual'}</span>
              </span>
              <span className="min-w-0 text-xs text-ink-muted">
                <span className="block truncate">{client.phone ?? 'No phone'}</span>
                <span className="block truncate">{client.email ?? 'No email'}</span>
              </span>
              <span className="text-xs text-ink-muted">
                <Badge tone="outline">{client.enquiries}</Badge>
              </span>
              <span className="text-xs text-ink-muted">
                <Badge tone="outline">{client.events}</Badge>
              </span>
              <span className="text-xs text-ink-muted">{shortDate(client.lastActivity)}</span>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        basePath="/clients/directory"
        page={data.page}
        total={data.total}
        pageSize={PAGE_SIZE}
        params={{ q: params.q }}
      />
    </div>
  )
}
