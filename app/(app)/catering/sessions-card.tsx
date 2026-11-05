import { ArrowDown, ArrowUp, Power } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import type { CateringSessionView } from '@/lib/db/catering'
import {
  createCateringSession,
  moveCateringSession,
  setCateringSessionActive,
} from './actions'

const timeLabel = (start: string | null, end: string | null) =>
  start && end ? `${start}–${end}` : start || end || 'No time set'

const guestLabel = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'No guest limits'
  if (max === null) return `${min}+ guests`
  if (min === null) return `Up to ${max} guests`
  return `${min}–${max} guests`
}

/** The owner's service periods, in their own order. */
export function SessionsCard({
  sessions,
  canEdit,
}: {
  sessions: readonly CateringSessionView[]
  canEdit: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal sessions</CardTitle>
        <CardDescription>
          Each session is booked and priced separately, with its own guest count. Rename them, reorder
          them, or switch off the ones this business does not serve.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState title="No sessions yet" description="Add the first one below." />
        ) : (
          <ul className="divide-y divide-hairline">
            {sessions.map((session, index) => (
              <li key={session.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-medium text-ink">
                    {session.name}
                    {!session.active ? (
                      <Badge tone="warning" className="ml-2">
                        Off
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {timeLabel(session.startTime, session.endTime)} ·{' '}
                    {guestLabel(session.minGuests, session.maxGuests)}
                    {session.cutoffHours ? ` · count frozen ${session.cutoffHours}h before` : ''}
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-1">
                    <form action={moveCateringSession}>
                      <input type="hidden" name="id" value={session.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${session.name} up`}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </Button>
                    </form>
                    <form action={moveCateringSession}>
                      <input type="hidden" name="id" value={session.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${session.name} down`}
                        disabled={index === sessions.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </Button>
                    </form>
                    <form action={setCateringSessionActive}>
                      <input type="hidden" name="id" value={session.id} />
                      <input type="hidden" name="active" value={String(!session.active)} />
                      <Button type="submit" variant="secondary" size="sm">
                        <Power className="mr-1 h-3.5 w-3.5" aria-hidden />
                        {session.active ? 'Switch off' : 'Switch on'}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canEdit ? (
          <form
            action={createCateringSession}
            className="grid gap-3 rounded-card border border-hairline bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <Field label="Session name" className="lg:col-span-2">
              <Input name="name" required maxLength={80} placeholder="Reception dinner" />
            </Field>
            <Field label="Starts">
              <Input name="startTime" placeholder="19:00" inputMode="numeric" />
            </Field>
            <Field label="Ends">
              <Input name="endTime" placeholder="22:00" inputMode="numeric" />
            </Field>
            <Field label="Min guests">
              <Input name="minGuests" inputMode="numeric" placeholder="50" />
            </Field>
            <Field label="Max guests">
              <Input name="maxGuests" inputMode="numeric" placeholder="600" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-6">
              <Button type="submit" variant="secondary">
                Add session
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
