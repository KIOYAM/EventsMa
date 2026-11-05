import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { Stat } from '@/components/ui/stat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { requireWorkspace } from '@/lib/auth/session'
import { getPlatformOrgs, getServiceAdoption, getServiceQuotes, getNotifications } from '@/lib/db/admin'

function platformAdmins(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

interface ServiceAdoptionRow {
  verticalKey: string
  label: string
  enabledOrgs: number
  totalOrgs: number
  itemCount: number
}

interface ServiceQuoteRow {
  verticalKey: string
  label: string
  quoteCount: number
  acceptedCount: number
  totalValuePaise: number
}

interface NotificationRow {
  id: string
  orgId: string
  kind: string
  channel: string
  status: string
  attempts: number
  createdAt: string
}

const VERTICAL_COLORS: Record<string, string> = {
  catering: 'bg-forest',
  decor: 'bg-mint-bright/20 text-forest border border-forest/30',
  makeup: 'bg-terracotta-soft text-terracotta border border-terracotta/30',
  photography: 'bg-[rgb(99,102,241)/20] text-[rgb(99,102,241)] border border-[rgb(99,102,241)/30]',
  specialist: 'bg-[rgb(107,114,128)/20] text-[rgb(107,114,128)] border border-[rgb(107,114,128)/30]',
}

export const metadata = { title: 'Platform' }

export default async function AdminPage() {
  const ctx = await requireWorkspace()
  const allowed =
    ctx.demo || platformAdmins().includes((ctx.email ?? '').toLowerCase())

  if (!allowed) notFound()

  const [orgs, adoption, quotes, notifications] = await Promise.all([
    getPlatformOrgs(ctx.demo),
    getServiceAdoption(ctx.demo),
    getServiceQuotes(ctx.demo),
    getNotifications(ctx.demo),
  ])

  const totalMembers = orgs.reduce((sum, org) => sum + org.members, 0)
  const totalEvents = orgs.reduce((sum, org) => sum + org.eventCount, 0)
  const paid = orgs.filter((org) => org.plan !== 'trial').length
  const totalQuotes = quotes.reduce((sum, q) => sum + q.quoteCount, 0)
  const totalAccepted = quotes.reduce((sum, q) => sum + q.acceptedCount, 0)
  const totalValue = quotes.reduce((sum, q) => sum + q.totalValuePaise, 0)
  const pendingNotifications = notifications.filter((n) => n.status === 'queued').length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Platform overview"
        description="Read-only cross-tenant monitoring. Access comes from PLATFORM_ADMIN_EMAILS, not from a role inside a tenant."
      />

      {ctx.demo ? (
        <div className="rounded-card border border-gold bg-gold-subtle px-4 py-3 text-sm text-ink">
          Showing sample data. The real metrics appear once a database and the allowlist are configured.
        </div>
      ) : null}

      {/* Top-level stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Organisations" value={String(orgs.length)} hint="All time" />
        <Stat label="People" value={String(totalMembers)} hint="Memberships" />
        <Stat label="Events" value={String(totalEvents)} hint="Across tenants" />
        <Stat label="Paying" value={String(paid)} hint={`${orgs.length - paid} on trial`} />
        <Stat label="Quotes sent" value={String(totalQuotes)} hint={`${Math.round((totalAccepted / Math.max(totalQuotes, 1)) * 100)}% accepted`} />
        <Stat label="Gross quote value" value={`₹${(totalValue / 100).toLocaleString('en-IN')}`} hint="All quotes" />
      </section>

      {/* Service adoption charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardWithTitle title="Service adoption by organisation" subtitle="How many organisations have each service enabled">
          <div className="space-y-3">
            {adoption.map((row) => {
              const pct = Math.round((row.enabledOrgs / Math.max(row.totalOrgs, 1)) * 100)
              return (
                <div key={row.verticalKey} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink">{row.label}</span>
                    <span className="text-xs text-ink-muted">{row.enabledOrgs}/{row.totalOrgs}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-mint-subtle overflow-hidden">
                    <div
                      className={`h-full ${VERTICAL_COLORS[row.verticalKey] || 'bg-mint'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-ink-muted">
                    {row.itemCount} active catalogue items
                  </p>
                </div>
              )
            })}
          </div>
        </CardWithTitle>

        <CardWithTitle title="Quote volume & value by service" subtitle="Quotes created and accepted, per service vertical">
          <div className="space-y-4">
            {quotes.map((row) => {
              const pct = Math.round((row.acceptedCount / Math.max(row.quoteCount, 1)) * 100)
              return (
                <div key={row.verticalKey} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink">{row.label}</span>
                    <span className="text-xs text-ink-muted">₹${(row.totalValuePaise / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-end gap-2 h-12">
                    <div className="h-6 w-full rounded-full bg-mint-subtle overflow-hidden relative">
                      <div className={`absolute bottom-0 ${VERTICAL_COLORS[row.verticalKey] || 'bg-mint'}`} style={{ width: `${pct}%`, height: '100%' }} />
                      <span className="absolute bottom-full right-0 text-[9px] text-ink-muted mb-1">{pct}%</span>
                    </div>
                    <span className="text-[10px] text-ink-muted">{row.acceptedCount}/{row.quoteCount}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardWithTitle>
      </section>

      {/* Notifications */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardWithTitle title="Notification queue" subtitle="Outbound emails and in-app messages">
          <div className="overflow-hidden rounded-card border border-hairline bg-paper">
            <div className="grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-hairline px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] text-ink-muted sm:grid">
              <span>Kind</span>
              <span>Channel</span>
              <span>Status</span>
              <span>Attempts</span>
              <span>Created</span>
            </div>
            {notifications.slice(0, 12).map((n) => (
              <div key={n.id} className="grid gap-2 border-b border-hairline px-4 py-2.5 text-sm last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-3">
                <div className="min-w-0 truncate text-ink">{n.kind}</div>
                <span className="text-ink-muted">{n.channel}</span>
                <Badge tone={n.status === 'sent' ? 'mint' : n.status === 'queued' ? 'gold' : 'accent'}>
                  {n.status}
                </Badge>
                <span className="tabular text-ink-muted">{n.attempts}</span>
                <span className="text-xs text-ink-muted">{n.createdAt.slice(0, 16).replace('T', ' ')}</span>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-ink-muted">
                No notifications queued.
              </div>
            )}
          </div>
          {pendingNotifications > 0 && (
            <p className="mt-2 text-sm text-terracotta">
              {pendingNotifications} notification(s) waiting to be sent. Configure RESEND_API_KEY to enable email delivery.
            </p>
          )}
        </CardWithTitle>

        <CardWithTitle title="Organisation list" subtitle="All tenant organisations on the platform">
          <div className="overflow-hidden rounded-card border border-hairline bg-paper">
            <div className="grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-hairline px-4 py-2.5 text-[10px] uppercase tracking-[0.12em] text-ink-muted sm:grid">
              <span>Organisation</span>
              <span>Plan</span>
              <span>Members</span>
              <span>Events</span>
              <span>Joined</span>
            </div>
            {orgs.map((org) => (
              <div key={org.id} className="grid gap-2 border-b border-hairline px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-3">
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
        </CardWithTitle>
      </section>

      <p className="text-xs leading-relaxed text-ink-muted">
        This screen reads names and counts only. It never opens a customer&apos;s events, money or
        contacts; support work that needs that access should be a timed, audited impersonation
        flow, not a bypass built into a dashboard.
      </p>
    </div>
  )
}

function CardWithTitle({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden rounded-card border border-hairline bg-paper">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm">{title}</CardTitle>
            <p className="text-[10px] text-ink-muted">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  )
}
