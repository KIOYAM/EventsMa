import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import type { EventDetail } from '@/lib/domain/ops'
import { assignCrew, setCrewCheckIn } from '../../actions'

/** Who is working the event, and the notes the shift sheet carries. */
export function CrewTab({
  event,
  staff,
  demo,
  locale,
}: {
  event: EventDetail
  staff: { id: string; name: string }[]
  demo: boolean
  locale: Locale
}) {
  const t = createTranslator(locale)

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.assignedCrew')}</CardTitle>
          <Badge tone="outline">{event.crew.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.crew.length === 0 ? (
            <EmptyState
              title={t('events.detail.nobodyTitle')}
              description={t('events.detail.nobodyBody')}
            />
          ) : (
            <div className="divide-y divide-hairline">
              {event.crew.map((member) => (
                <div key={member.id} className="flex flex-wrap items-center gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{member.name}</p>
                    <p className="text-xs text-ink-muted">
                      {member.roleLabel ?? t('events.detail.crewFallback')}
                      {member.shiftStart ? ` · ${member.shiftStart}` : ''}
                      {member.shiftEnd ? `–${member.shiftEnd}` : ''}
                    </p>
                  </div>
                  {member.checkedInAt ? (
                    <Badge tone="success">{t('events.detail.checkedIn')}</Badge>
                  ) : null}
                  <form action={setCrewCheckIn}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="staffId" value={member.id} />
                    <input type="hidden" name="checkedIn" value={member.checkedInAt ? '0' : '1'} />
                    <button
                      type="submit"
                      disabled={demo}
                      className="text-[11px] text-forest underline underline-offset-2 disabled:opacity-40"
                    >
                      {member.checkedInAt
                        ? t('events.detail.undoCheckIn')
                        : t('events.detail.checkIn')}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <form action={assignCrew} className="grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
            <input type="hidden" name="eventId" value={event.id} />
            <Field label={t('events.detail.teammate')} htmlFor="crewMember" className="sm:col-span-2">
              <Select id="crewMember" name="membershipId" required defaultValue="">
                <option value="" disabled>
                  {t('events.detail.chooseSomeone')}
                </option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('events.detail.roleOnDay')} htmlFor="crewRole">
              <Input
                id="crewRole"
                name="roleLabel"
                maxLength={60}
                placeholder={t('events.detail.rolePlaceholder')}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('events.detail.from')} htmlFor="shiftStart">
                <Input id="shiftStart" name="shiftStart" type="time" />
              </Field>
              <Field label={t('events.detail.to')} htmlFor="shiftEnd">
                <Input id="shiftEnd" name="shiftEnd" type="time" />
              </Field>
            </div>
            <button
              type="submit"
              disabled={demo}
              className="inline-flex h-10 items-center justify-center rounded-control bg-forest px-4 text-sm font-medium text-white disabled:opacity-50 sm:col-span-2"
            >
              {t('events.detail.assign')}
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.shiftNotes')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-ink-muted">
          {event.notes ?? t('events.detail.noNotes')}
          <p className="mt-4 text-xs text-ink-muted">{t('events.detail.visibility')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
