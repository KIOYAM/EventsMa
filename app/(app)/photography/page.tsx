import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { canManageCommercial, requireWorkspace } from '@/lib/auth/session'
import { getDb, isDatabaseConfigured } from '@/lib/db/client'
import {
  createCoverage,
  createAssignment,
  createShotListItem,
  createDeliverable,
  toggleDeliverableStatus,
  toggleShotCaptured,
} from './actions'
import {
  photographyAssignments,
  photographyCoverage,
  photographyDeliverables,
  photographyShotLists,
} from '@/lib/db/schema-services'
import { and, eq } from 'drizzle-orm'

export const metadata = { title: 'Photography' }

export default async function PhotographyPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const db = getDb()
  const [coverages, assignments, shots, deliverables] = await Promise.all(
    ctx.demo || !isDatabaseConfigured()
      ? [[], [], [], []]
      : [
          db
            .select()
            .from(photographyCoverage)
            .where(eq(photographyCoverage.orgId, ctx.orgId))
            .orderBy(photographyCoverage.coverageStart),
          db
            .select()
            .from(photographyAssignments)
            .where(eq(photographyAssignments.orgId, ctx.orgId))
            .orderBy(photographyAssignments.sortOrder),
          db
            .select()
            .from(photographyShotLists)
            .where(eq(photographyShotLists.orgId, ctx.orgId))
            .orderBy(photographyShotLists.priority),
          db
            .select()
            .from(photographyDeliverables)
            .where(eq(photographyDeliverables.orgId, ctx.orgId))
            .orderBy(photographyDeliverables.createdAt),
        ],
  )

  const saved = params.saved
  const error = params.error

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Photography & video"
        title="Your coverage, your crew, your deliverables"
        description="Plan event coverage, assign photographers, track shot lists and manage delivery — all per organisation."
        actions={
          <Link
            href="/services/photography"
            className="inline-flex h-9 items-center rounded-control border border-hairline bg-paper px-3 text-sm font-medium text-ink hover:bg-mint-subtle"
          >
            Service configuration
          </Link>
        }
      />

      {error ? (
        <div className="rounded-card border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="flex items-center gap-2 rounded-card border border-forest/30 bg-mint-subtle px-4 py-3 text-sm text-forest">
          <Check className="h-4 w-4" aria-hidden />
          {saved === 'coverage'
            ? 'Coverage saved.'
            : saved === 'assignment'
              ? 'Assignment saved.'
              : saved === 'shot'
                ? 'Shot added.'
                : 'Deliverable saved.'}
        </div>
      ) : null}

      {!ctx.demo && !isDatabaseConfigured() ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect a database</CardTitle>
            <CardDescription>
              Photography configuration requires a Supabase database. Set DATABASE_URL and redeploy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              In demo mode, photography pages are read-only.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {ctx.demo || isDatabaseConfigured() ? (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              ['Coverage', coverages.length],
              ['Assignments', assignments.length],
              ['Shot list', shots.length],
              ['Deliverables', deliverables.length],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardContent className="py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                    {label}
                  </p>
                  <p className="mt-1 font-display text-2xl text-ink">{value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Coverage schedule</CardTitle>
              <CardDescription>
                Event coverage dates, times, locations and types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {coverages.length === 0 ? (
                  <p className="text-sm text-ink-muted">No coverage scheduled yet.</p>
                ) : (
                  coverages.map((cov) => (
                    <div
                      key={cov.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{cov.coverageType}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {new Date(cov.coverageStart).toLocaleString()} →{' '}
                          {new Date(cov.coverageEnd).toLocaleString()}
                        </p>
                        {cov.location && <p className="mt-0.5 text-xs text-ink-muted">{cov.location}</p>}
                        <Badge
                          tone={cov.active ? 'mint' : 'outline'}
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          {cov.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createCoverage} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Field label="Coverage type">
                    <Input
                      name="coverageType"
                      required
                      maxLength={120}
                      placeholder="Ceremony coverage"
                    />
                  </Field>
                  <Field label="Start">
                    <Input name="coverageStart" type="datetime-local" required />
                  </Field>
                  <Field label="End">
                    <Input name="coverageEnd" type="datetime-local" required />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Schedule coverage
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photographer assignments</CardTitle>
              <CardDescription>
                Assign photographers and assistants to coverage slots.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {assignments.length === 0 ? (
                  <p className="text-sm text-ink-muted">No assignments yet.</p>
                ) : (
                  assignments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{a.photographerName}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{a.role}</p>
                        {a.equipment && <p className="mt-0.5 text-xs text-ink-muted">{a.equipment}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createAssignment} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Field label="Photographer name">
                    <Input
                      name="photographerName"
                      required
                      maxLength={120}
                      placeholder="Ravi Kumar"
                    />
                  </Field>
                  <Field label="Role">
                    <Select name="role" required>
                      <option value="photographer">Photographer</option>
                      <option value="assistant">Assistant</option>
                      <option value="second_shooter">Second shooter</option>
                    </Select>
                  </Field>
                  <Field label="Equipment">
                    <Input name="equipment" maxLength={300} placeholder="Canon R5, 24-70mm" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Assign
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shot list</CardTitle>
              <CardDescription>
                Customer-requested moments to capture during coverage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {shots.length === 0 ? (
                  <p className="text-sm text-ink-muted">No shot list items yet.</p>
                ) : (
                  shots.map((shot) => (
                    <div
                      key={shot.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{shot.moment}</p>
                        {shot.description && (
                          <p className="mt-0.5 text-xs text-ink-muted">{shot.description}</p>
                        )}
                        <Badge
                          tone={
                            shot.priority === 'must_capture'
                              ? 'accent'
                              : shot.priority === 'high'
                                ? 'gold'
                                : 'mint'
                          }
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          {shot.priority}
                        </Badge>
                        {shot.captured ? (
                          <Badge tone="success" className="text-[9px] px-1.5 py-0.5">
                            Captured
                          </Badge>
                        ) : null}
                        {canEdit ? (
                          <form action={toggleShotCaptured} className="mt-2">
                            <input type="hidden" name="id" value={shot.id} />
                            <input type="hidden" name="captured" value={String(!shot.captured)} />
                            <button
                              type="submit"
                              className="text-[9px] text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                            >
                              {shot.captured ? 'Unmark' : 'Mark captured'}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createShotListItem} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
                  <Field label="Moment">
                    <Input
                      name="moment"
                      required
                      maxLength={200}
                      placeholder="First dance"
                    />
                  </Field>
                  <Field label="Priority">
                    <Select name="priority" defaultValue="normal">
                      <option value="must_capture">Must capture</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </Select>
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Add shot
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deliverables</CardTitle>
              <CardDescription>
                Album types, page counts and delivery tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {deliverables.length === 0 ? (
                  <p className="text-sm text-ink-muted">No deliverables yet.</p>
                ) : (
                  deliverables.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{d.deliverableType}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {d.quantity} × {d.status}
                        </p>
                        {d.deliveryDate && (
                          <p className="mt-0.5 text-xs text-ink-muted">
                            Due: {new Date(d.deliveryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {canEdit ? (
                        <form action={toggleDeliverableStatus}>
                          <input type="hidden" name="id" value={d.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={
                              d.status === 'delivered' ? 'pending' : 'delivered'
                            }
                          />
                          <button
                            type="submit"
                            className="text-[9px] text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                          >
                            {d.status === 'delivered' ? 'Reopen' : 'Mark delivered'}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createDeliverable} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Field label="Deliverable type">
                    <Input
                      name="deliverableType"
                      required
                      maxLength={120}
                      placeholder="Wedding album (40 sheets)"
                    />
                  </Field>
                  <Field label="Quantity">
                    <Input name="quantity" type="number" inputMode="numeric" defaultValue={1} />
                  </Field>
                  <Field label="Delivery date">
                    <Input name="deliveryDate" type="date" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Add deliverable
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
