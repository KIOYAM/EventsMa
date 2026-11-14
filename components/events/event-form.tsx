import Link from 'next/link'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EVENT_STATUSES } from '@/lib/domain/ops'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import { eventStatusKey } from '@/lib/i18n/ops-copy'

export interface EventFormDefaults {
  title?: string
  clientId?: string | null
  clientName?: string | null
  eventType?: string | null
  eventDate?: string
  guests?: number
  venueName?: string | null
  venueAddress?: string | null
  startTime?: string | null
  endTime?: string | null
  status?: string
  notes?: string | null
}

/**
 * One form for create and edit. The action is passed in, so the page owns the
 * permission and demo checks while the field layout stays identical.
 */
export function EventForm({
  action,
  defaults,
  clients,
  submitLabel,
  cancelHref,
  locale,
}: {
  action: (formData: FormData) => void | Promise<void>
  defaults?: EventFormDefaults
  clients: { id: string; name: string }[]
  submitLabel: string
  cancelHref: string
  locale: Locale
}) {
  const t = createTranslator(locale)

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('events.form.eventTitle')} htmlFor="title" className="md:col-span-2">
          <Input
            id="title"
            name="title"
            defaultValue={defaults?.title ?? ''}
            maxLength={160}
            placeholder={t('events.form.eventTitlePlaceholder')}
          />
        </Field>

        <Field
          label={t('events.form.client')}
          htmlFor="clientId"
          hint={t('events.form.clientHint')}
        >
          <Select id="clientId" name="clientId" defaultValue={defaults?.clientId ?? ''}>
            <option value="">{t('events.form.noExistingClient')}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('events.form.eventType')} htmlFor="eventType">
          <Input
            id="eventType"
            name="eventType"
            defaultValue={defaults?.eventType ?? ''}
            maxLength={80}
            placeholder={t('events.form.eventTypePlaceholder')}
          />
        </Field>

        <Field
          label={t('events.form.newClientName')}
          htmlFor="clientName"
          hint={t('events.form.newClientHint')}
        >
          <Input id="clientName" name="clientName" maxLength={120} />
        </Field>

        <Field
          label={t('events.form.clientPhone')}
          htmlFor="clientPhone"
          hint={t('events.form.clientPhoneHint')}
        >
          <Input id="clientPhone" name="clientPhone" maxLength={24} inputMode="tel" />
        </Field>

        <Field label={t('events.form.eventDate')} htmlFor="eventDate">
          <Input
            id="eventDate"
            name="eventDate"
            type="date"
            defaultValue={defaults?.eventDate ?? ''}
            required
          />
        </Field>

        <Field label={t('events.form.guests')} htmlFor="guests">
          <Input
            id="guests"
            name="guests"
            type="number"
            min={0}
            max={100000}
            defaultValue={defaults?.guests ?? 0}
            required
          />
        </Field>

        <Field label={t('events.form.startTime')} htmlFor="startTime">
          <Input id="startTime" name="startTime" type="time" defaultValue={defaults?.startTime ?? ''} />
        </Field>

        <Field label={t('events.form.endTime')} htmlFor="endTime">
          <Input id="endTime" name="endTime" type="time" defaultValue={defaults?.endTime ?? ''} />
        </Field>

        <Field label={t('events.form.venue')} htmlFor="venueName">
          <Input id="venueName" name="venueName" defaultValue={defaults?.venueName ?? ''} maxLength={160} />
        </Field>

        <Field label={t('events.form.venueAddress')} htmlFor="venueAddress">
          <Input
            id="venueAddress"
            name="venueAddress"
            defaultValue={defaults?.venueAddress ?? ''}
            maxLength={240}
          />
        </Field>

        <Field label={t('events.form.status')} htmlFor="status">
          <Select id="status" name="status" defaultValue={defaults?.status ?? 'enquiry'}>
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(eventStatusKey(status))}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t('events.form.notes')} htmlFor="notes" className="md:col-span-2">
          <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ''} maxLength={2000} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-control bg-forest px-5 text-sm font-medium text-white"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center justify-center rounded-control border border-hairline px-5 text-sm text-ink"
        >
          {t('events.form.cancel')}
        </Link>
      </div>
    </form>
  )
}
