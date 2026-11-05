import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState, PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getEventCatering } from '@/lib/db/catering-events'
import { formatINR } from '@/lib/domain/money'
import { formatMilliQuantity } from '@/lib/domain/catering'
import { addEventSession } from './actions'
import { SessionCard } from './session-card'

export const metadata = { title: 'Event catering' }

const ERROR_COPY: Record<string, string> = {
  rule: 'That dish would break the selection rule for its category. Remove one first.',
  session: 'That session no longer exists.',
  template: 'That session template no longer exists.',
  item: 'That dish no longer exists.',
  name: 'Choose a session or type a name.',
  time: 'Times must be written as 07:00 or 19:30.',
  status: 'That status is not allowed.',
  diet: 'Choose a dietary label.',
  event: 'That event no longer exists.',
  permission: 'Only an owner or manager can plan catering.',
  demo: 'Demo mode: connect a database before planning catering.',
}

const SAVED_COPY: Record<string, string> = {
  session: 'Session saved.',
  item: 'Menu updated.',
  quantity: 'Quantity saved.',
  diet: 'Dietary counts saved.',
  removed: 'Session removed.',
}

export default async function EventCateringPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}) {
  const ctx = await requireWorkspace()
  const { id } = await params
  const query = await searchParams
  const view = await getEventCatering(ctx.orgId, id, ctx.demo)

  if (!view) notFound()

  const canEdit = canManageCommercial(ctx.role) && !ctx.demo
  const banner = query.error ? ERROR_COPY[query.error] ?? 'That change was not saved.' : null
  const saved = query.saved ? SAVED_COPY[query.saved] ?? 'Saved.' : null

  return (
    <div className="space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-forest"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to the event
      </Link>

      <PageHeader
        eyebrow="Catering plan"
        title={view.event.title}
        description="Each session carries its own guest count and its own menu. A wedding can serve 500 at lunch and 300 at dinner without the bill counting 500 twice."
      />

      {banner ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {banner}
        </div>
      ) : null}
      {saved ? (
        <div className="rounded-card border border-forest/30 bg-mint-subtle px-4 py-3 text-sm text-forest">
          {saved}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          ['Sessions', String(view.totals.sessionCount)],
          ['Guests across sessions', String(view.totals.guests)],
          ['Menu subtotal', formatINR(view.totals.subtotalPaise)],
          ['Production lines', String(view.production.length)],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="py-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                {label}
              </p>
              <p className="mt-1 font-display text-xl text-ink">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Add a session</CardTitle>
            <CardDescription>
              Copy one of your configured sessions, or add a one-off with no template rules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view.templates.length === 0 ? (
              <p className="mb-3 text-xs text-ink-muted">
                No sessions configured yet. Add them on the{' '}
                <Link href="/catering" className="text-forest underline-offset-2 hover:underline">
                  Catering page
                </Link>
                , or type a name below.
              </p>
            ) : null}
            <form action={addEventSession} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input type="hidden" name="eventId" value={id} />
              <Field label="From a session">
                <Select name="templateId" defaultValue="">
                  <option value="">— none —</option>
                  {view.templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Or a name">
                <Input name="name" maxLength={80} placeholder="Reception dinner" />
              </Field>
              <Field label="Date">
                <Input type="date" name="sessionDate" defaultValue={view.event.eventDate ?? ''} />
              </Field>
              <Field label="Guests">
                <Input
                  name="guestCount"
                  inputMode="numeric"
                  defaultValue={view.event.guests || 0}
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" variant="primary">
                  Add session
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {view.sessions.length === 0 ? (
        <EmptyState
          title="No catering sessions yet"
          description="Add breakfast, lunch or dinner above; each one is priced on its own guest count."
        />
      ) : (
        view.sessions.map((session) => (
          <SessionCard key={session.id} eventId={id} session={session} view={view} canEdit={canEdit} />
        ))
      )}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Kitchen production sheet</CardTitle>
            <CardDescription>
              Recipes multiplied by each session&apos;s own guest count, with wastage shown separately.
            </CardDescription>
          </div>
          <Badge tone="mint">{view.production.length} lines</Badge>
        </CardHeader>
        <CardContent>
          {view.production.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No recipes yet. Enter ingredient quantities against a dish on the{' '}
              <Link href="/catering/recipes" className="text-forest underline-offset-2 hover:underline">
                recipes page
              </Link>{' '}
              and this sheet fills itself.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-[0.12em] text-ink-muted">
                    <th className="py-2 pr-3 font-medium">Ingredient</th>
                    <th className="py-2 pr-3 font-medium">Required</th>
                    <th className="py-2 pr-3 font-medium">Wastage</th>
                    <th className="py-2 font-medium">Buy</th>
                  </tr>
                </thead>
                <tbody>
                  {view.production.map((line) => (
                    <tr key={line.key} className="border-b border-hairline/60">
                      <td className="py-2 pr-3 text-ink">{line.name}</td>
                      <td className="py-2 pr-3 text-ink-muted">
                        {formatMilliQuantity(line.requiredMilli, line.unit)}
                      </td>
                      <td className="py-2 pr-3 text-ink-muted">
                        {formatMilliQuantity(line.wastageMilli, line.unit)}
                      </td>
                      <td className="py-2 font-medium text-ink">
                        {formatMilliQuantity(line.totalMilli, line.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
