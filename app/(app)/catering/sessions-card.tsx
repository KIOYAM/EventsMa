import { ArrowDown, ArrowUp, Power } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import type { CateringSessionView } from '@/lib/db/catering'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import {
  createCateringSession,
  moveCateringSession,
  setCateringSessionActive,
} from './actions'

type Translate = (key: string, vars?: Record<string, string | number>) => string

const timeLabel = (t: Translate, start: string | null, end: string | null) =>
  start && end ? t('catering.sessions.timeRange', { start, end }) : start || end || t('catering.sessions.noTime')

const guestLabel = (t: Translate, min: number | null, max: number | null) => {
  if (min === null && max === null) return t('catering.sessions.noGuestLimits')
  if (max === null) return t('catering.sessions.guestsFrom', { min: min ?? 0 })
  if (min === null) return t('catering.sessions.guestsUpTo', { max })
  return t('catering.sessions.guestsRange', { min, max })
}

/** The owner's service periods, in their own order. */
export function SessionsCard({
  sessions,
  canEdit,
  locale,
}: {
  sessions: readonly CateringSessionView[]
  canEdit: boolean
  locale: Locale
}) {
  const t = createTranslator(locale)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('catering.sessions.title')}</CardTitle>
        <CardDescription>{t('catering.sessions.intro')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState
            title={t('catering.sessions.emptyTitle')}
            description={t('catering.sessions.emptyBody')}
          />
        ) : (
          <ul className="divide-y divide-hairline">
            {sessions.map((session, index) => (
              <li key={session.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-medium text-ink">
                    {session.name}
                    {!session.active ? (
                      <Badge tone="warning" className="ml-2">
                        {t('catering.sessions.off')}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {timeLabel(t, session.startTime, session.endTime)} ·{' '}
                    {guestLabel(t, session.minGuests, session.maxGuests)}
                    {session.cutoffHours
                      ? ` · ${t('catering.sessions.cutoff', { hours: session.cutoffHours })}`
                      : ''}
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
                        aria-label={t('catering.sessions.moveUp', { name: session.name })}
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
                        aria-label={t('catering.sessions.moveDown', { name: session.name })}
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
                        {session.active
                          ? t('catering.sessions.switchOff')
                          : t('catering.sessions.switchOn')}
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
            className="grid gap-3 card-flat bg-canvas p-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <Field label={t('catering.sessions.name')} className="lg:col-span-2">
              <Input
                name="name"
                required
                maxLength={80}
                placeholder={t('catering.sessions.namePlaceholder')}
              />
            </Field>
            <Field label={t('catering.sessions.starts')}>
              <Input
                name="startTime"
                placeholder={t('catering.sessions.startsPlaceholder')}
                inputMode="numeric"
              />
            </Field>
            <Field label={t('catering.sessions.ends')}>
              <Input
                name="endTime"
                placeholder={t('catering.sessions.endsPlaceholder')}
                inputMode="numeric"
              />
            </Field>
            <Field label={t('catering.sessions.minGuests')}>
              <Input
                name="minGuests"
                inputMode="numeric"
                placeholder={t('catering.sessions.minGuestsPlaceholder')}
              />
            </Field>
            <Field label={t('catering.sessions.maxGuests')}>
              <Input
                name="maxGuests"
                inputMode="numeric"
                placeholder={t('catering.sessions.maxGuestsPlaceholder')}
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-6">
              <Button type="submit" variant="secondary">
                {t('catering.sessions.add')}
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  )
}
