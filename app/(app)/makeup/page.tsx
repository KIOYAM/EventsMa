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
  createMakeupAppointment,
  createMakeupArtist,
  createMakeupTrial,
  approveMakeupTrial,
  toggleMakeupArtistActive,
} from './actions'
import {
  makeupAppointments,
  makeupArtists,
  makeupTrials,
} from '@/lib/db/schema-services'
import { and, eq } from 'drizzle-orm'

export const metadata = { title: 'Makeup & beauty' }

export default async function MakeupPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const ctx = await requireWorkspace()
  const params = await searchParams
  const canEdit = canManageCommercial(ctx.role) && !ctx.demo

  const db = getDb()
  const [artists, appointments, trials] = await Promise.all(
    ctx.demo || !isDatabaseConfigured()
      ? [[], [], []]
      : [
          db
            .select()
            .from(makeupArtists)
            .where(and(eq(makeupArtists.orgId, ctx.orgId), eq(makeupArtists.active, true)))
            .orderBy(makeupArtists.createdAt),
          db
            .select()
            .from(makeupAppointments)
            .where(eq(makeupAppointments.orgId, ctx.orgId))
            .orderBy(makeupAppointments.appointmentStart),
          db
            .select()
            .from(makeupTrials)
            .where(eq(makeupTrials.orgId, ctx.orgId))
            .orderBy(makeupTrials.trialDate),
        ],
  )

  const saved = params.saved
  const error = params.error

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Makeup & beauty"
        title="Your artists, your appointments, your trials"
        description="Makeup is appointment-driven. Manage artist availability, schedule trials and day-of appointments, and prevent double-booking — all per organisation."
        actions={
          <Link
            href="/services/makeup"
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
          {saved === 'artist'
            ? 'Artist saved.'
            : saved === 'appointment'
              ? 'Appointment scheduled.'
              : 'Trial saved.'}
        </div>
      ) : null}

      {!ctx.demo && !isDatabaseConfigured() ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect a database</CardTitle>
            <CardDescription>
              Makeup configuration requires a Supabase database. Set DATABASE_URL and redeploy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">
              In demo mode, makeup pages are read-only.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {ctx.demo || isDatabaseConfigured() ? (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              ['Artists', artists.length],
              ['Appointments', appointments.length],
              ['Trials', trials.length],
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
              <CardTitle>Makeup artists</CardTitle>
              <CardDescription>
                Artist profiles with skills, availability and pricing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {artists.length === 0 ? (
                  <p className="text-sm text-ink-muted">No artists yet.</p>
                ) : (
                  artists.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{artist.name}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {(artist.specializations as string[]).join(', ') || 'General'}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          ₹{(artist.ratePaisePerHour / 100).toLocaleString('en-IN')}/hr
                        </p>
                        <Badge
                          tone={artist.active ? 'success' : 'outline'}
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          {artist.active ? 'Active' : 'Off'}
                        </Badge>
                        {canEdit && artist.active ? (
                          <form action={toggleMakeupArtistActive} className="mt-2">
                            <input type="hidden" name="id" value={artist.id} />
                            <input type="hidden" name="active" value="0" />
                            <button
                              type="submit"
                              className="text-[9px] text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                            >
                              Deactivate
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createMakeupArtist} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Field label="Artist name">
                    <Input name="name" required maxLength={120} placeholder="Priya Mehra" />
                  </Field>
                  <Field label="Phone">
                    <Input name="phone" type="tel" maxLength={24} placeholder="+91 98420 11452" />
                  </Field>
                  <Field label="Rate (₹/hour)">
                    <Input name="ratePaisePerHour" type="number" inputMode="numeric" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Add artist
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Date, time, duration and artist assignment for makeup services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {appointments.length === 0 ? (
                  <p className="text-sm text-ink-muted">No appointments scheduled.</p>
                ) : (
                  appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{appt.clientName}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {appt.serviceType}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {new Date(appt.appointmentStart).toLocaleString()} →{' '}
                          {new Date(appt.appointmentEnd).toLocaleString()}
                        </p>
                        {appt.location && (
                          <p className="mt-0.5 text-xs text-ink-muted">
                            Location: {appt.location}
                          </p>
                        )}
                        <Badge
                          tone={appt.status === 'completed' ? 'success' : 'mint'}
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          {appt.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createMakeupAppointment} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                  <Field label="Client name">
                    <Input name="clientName" required maxLength={120} placeholder="Bride" />
                  </Field>
                  <Field label="Service type">
                    <Input name="serviceType" required maxLength={120} placeholder="Bridal makeup" />
                  </Field>
                  <Field label="Start">
                    <Input name="appointmentStart" type="datetime-local" required />
                  </Field>
                  <Field label="End">
                    <Input name="appointmentEnd" type="datetime-local" required />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Schedule
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Makeup trials</CardTitle>
              <CardDescription>
                Pre-event makeup trials with customer approval workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {trials.length === 0 ? (
                  <p className="text-sm text-ink-muted">No trials scheduled.</p>
                ) : (
                  trials.map((trial) => (
                    <div
                      key={trial.id}
                      className="flex items-start gap-3 rounded-lg border border-hairline bg-paper p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{trial.clientName}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {new Date(trial.trialDate).toLocaleDateString()}
                        </p>
                        {trial.makeupStyle && (
                          <p className="mt-0.5 text-xs text-ink-muted">
                            Style: {trial.makeupStyle}
                          </p>
                        )}
                        <Badge
                          tone={trial.approved ? 'success' : 'gold'}
                          className="text-[9px] px-1.5 py-0.5"
                        >
                          {trial.approved ? 'Approved' : 'Pending'}
                        </Badge>
                        {canEdit && !trial.approved ? (
                          <form action={approveMakeupTrial} className="mt-2">
                            <input type="hidden" name="id" value={trial.id} />
                            <input type="hidden" name="approved" value="1" />
                            <button
                              type="submit"
                              className="text-[9px] text-forest underline-offset-2 hover:underline"
                            >
                              Approve
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canEdit ? (
                <form action={createMakeupTrial} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Field label="Client name">
                    <Input name="clientName" required maxLength={120} placeholder="Bride" />
                  </Field>
                  <Field label="Trial date">
                    <Input name="trialDate" type="date" required />
                  </Field>
                  <Field label="Makeup style">
                    <Input name="makeupStyle" maxLength={120} placeholder="HD bridal" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Schedule trial
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
