import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { eventStatusKey, occasionGroupKey, occasionKey } from '@/lib/i18n/ops-copy'
import { EVENT_STATUSES, groupEventTypes } from '@/lib/domain/ops'
import { createEvent } from '../actions'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * The create form, extracted so the list page stays readable and so a keystroke
 * in one client surface cannot re-render the whole event list.
 *
 * Occasion names are stored identifiers and stay as written; only the group
 * headings and the descriptions under each option are interface copy.
 */
export function CreateEventForm({
  clients,
  canEdit,
  demo,
  locale,
}: {
  clients: { id: string; name: string }[]
  canEdit: boolean
  demo: boolean
  locale: Locale
}) {
  const t = createTranslator(locale)

  return (
    <Card id="new">
      <CardHeader>
        <CardTitle>{t('events.create.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createEvent} className="grid gap-4 md:grid-cols-2">
          <Field
            label={t('events.create.eventTitle')}
            htmlFor="title"
            hint={t('events.create.eventTitleHint')}
          >
            <Input
              id="title"
              name="title"
              placeholder={t('events.create.eventTitlePlaceholder')}
              maxLength={160}
            />
          </Field>
          <Field label={t('events.create.occasion')} htmlFor="eventType">
            <Select id="eventType" name="eventType" defaultValue="">
              {groupEventTypes().map((group) => {
                if (group.groupName === 'Custom') {
                  return (
                    <optgroup key="custom" label={t('events.create.customGroup')}>
                      <option value="">{t('events.create.customOption')}</option>
                    </optgroup>
                  )
                }
                return (
                  <optgroup key={group.groupName} label={t(occasionGroupKey(group.groupName))}>
                    {group.rows.map((opt) => {
                      const key = occasionKey(opt.name)
                      const description = opt.description
                        ? key
                          ? t(key)
                          : opt.description
                        : undefined
                      return (
                        <option key={opt.name} value={opt.name}>
                          {opt.name} {description && ` — ${description}`}
                        </option>
                      )
                    })}
                  </optgroup>
                )
              })}
            </Select>
          </Field>

          <Field
            label={t('events.create.client')}
            htmlFor="clientId"
            hint={t('events.create.clientHint')}
          >
            <Select id="clientId" name="clientId" defaultValue="">
              <option value="">{t('events.create.newClient')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('events.create.newClientName')} htmlFor="clientName">
              <Input id="clientName" name="clientName" maxLength={120} />
            </Field>
            <Field label={t('events.create.phone')} htmlFor="clientPhone">
              <Input id="clientPhone" name="clientPhone" inputMode="tel" maxLength={24} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('events.create.eventDate')} htmlFor="eventDate">
              <Input id="eventDate" name="eventDate" type="date" required defaultValue={today()} />
            </Field>
            <Field label={t('events.create.guests')} htmlFor="guests">
              <Input id="guests" name="guests" inputMode="numeric" defaultValue={100} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('events.create.startTime')} htmlFor="startTime">
              <Input id="startTime" name="startTime" type="time" />
            </Field>
            <Field label={t('events.create.endTime')} htmlFor="endTime">
              <Input id="endTime" name="endTime" type="time" />
            </Field>
          </div>

          <Field label={t('events.create.venue')} htmlFor="venueName">
            <Input id="venueName" name="venueName" maxLength={160} />
          </Field>
          <Field label={t('events.create.status')} htmlFor="status">
            <Select id="status" name="status" defaultValue="tentative">
              {EVENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(eventStatusKey(status))}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('events.create.venueAddress')} htmlFor="venueAddress" className="md:col-span-2">
            <Input id="venueAddress" name="venueAddress" maxLength={240} />
          </Field>
          <Field label={t('events.create.notes')} htmlFor="notes" className="md:col-span-2">
            <Textarea
              id="notes"
              name="notes"
              maxLength={2000}
              placeholder={t('events.create.notesPlaceholder')}
            />
          </Field>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={!canEdit}
              className="inline-flex h-11 items-center rounded-control bg-forest px-5 text-sm font-medium text-white disabled:opacity-50"
            >
              {t('events.create.submit')}
            </button>
            {!canEdit ? (
              <p className="mt-2 text-xs text-ink-muted">
                {demo ? t('events.create.readOnly') : t('events.create.ownerOnly')}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
