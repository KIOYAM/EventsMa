import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { requireWorkspace } from '@/lib/auth/session'
import { getPlatformOrgs } from '@/lib/db/admin'

export const metadata = { title: 'Platform' }

function platformAdmins(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export default async function AdminPage() {
  const ctx = await requireWorkspace()
  const allowed =
    ctx.demo || platformAdmins().includes((ctx.email ?? '').toLowerCase())

  // 404 rather than 403: a normal tenant should not learn this route exists.
  if (!allowed) notFound()

  const orgs = await getPlatformOrgs(ctx.demo)
  const totalMembers = orgs.reduce((sum, org) => sum + org.members, 0)
  const totalEvents = orgs.reduce((sum, org) => sum + org.eventCount, 0)
  const paid = orgs.filter((org) => org.plan !== 'trial').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Who is on the product"
        description="Read-only. Access comes from PLATFORM_ADMIN_EMAILS, not from a role inside a tenant, so no customer can promote themselves into this view."
      />

      {ctx.demo ? (
        <div className="rounded-card border border-gold bg-gold-subtle px-4 py-3 text-sm text-ink">
          Showing two sample organisations. The real list appears once a database and the
          allowlist are configured.
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Organisations" value={String(orgs.length)} hint="All time" />
        <Stat label="People" value={String(totalMembers)} hint="Memberships" />
        <Stat label="Events" value={String(totalEvents)} hint="Across tenants" />
        <Stat label="Paying" value={String(paid)} hint={`${orgs.length - paid} on trial`} />
      </section>

      <div className="overflow-hidden rounded-card border border-hairline bg-paper">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-hairline px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-ink-muted sm:grid">
          <span>Organisation</span>
          <span>Plan</span>
          <span>Members</span>
          <span>Events</span>
          <span>Joined</span>
        </div>
        {orgs.map((org) => (
          <div
            key={org.id}
            className="grid gap-2 border-b border-hairline px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-ink">{org.name}</p>
              <p className="truncate text-xs text-ink-muted">/{org.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={org.plan === 'trial' ? 'warning' : 'mint'}>{org.plan}</Badge>
              {org.status !== 'active' ? <Badge tone="outline">{org.status}</Badge> : null}
            </div>
            <p className="tabular text-ink-muted sm:text-ink">{org.members}</p>
            <p className="tabular text-ink-muted sm:text-ink">{org.eventCount}</p>
            <p className="text-xs text-ink-muted">{org.createdAt}</p>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">
        This screen reads names and counts only. It never opens a customer&apos;s events, money or
        contacts; support work that needs that access should be a timed, audited impersonation
        flow, not a bypass built into a dashboard.
      </p>
    </div>
  )
}
