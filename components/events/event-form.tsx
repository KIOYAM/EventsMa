import Link from 'next/link'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { EVENT_STATUSES, EVENT_STATUS_LABEL } from '@/lib/domain/ops'

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
}: {
  action: (formData: FormData) => void | Promise<void>
  defaults?: EventFormDefaults
  clients: { id: string; name: string }[]
  submitLabel: string
  cancelHref: string
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Event title" htmlFor="title" className="md:col-span-2">
          <Input
            id="title"
            name="title"
            defaultValue={defaults?.title ?? ''}
            maxLength={160}
            placeholder="Meera & Karthik - wedding lunch"
          />
        </Field>

        <Field label="Client" htmlFor="clientId" hint="Pick an existing client, or add one below.">
          <Select id="clientId" name="clientId" defaultValue={defaults?.clientId ?? ''}>
            <option value="">No existing client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Event type" htmlFor="eventType">
          <Input
            id="eventType"
            name="eventType"
            defaultValue={defaults?.eventType ?? ''}
            maxLength={80}
            placeholder="Wedding, reception, corporate"
          />
        </Field>

        <Field label="New client name" htmlFor="clientName" hint="Only used when no client is selected.">
          <Input id="clientName" name="clientName" maxLength={120} />
        </Field>

        <Field label="Client phone" htmlFor="clientPhone" hint="Phone is the dedupe key for new clients.">
          <Input id="clientPhone" name="clientPhone" maxLength={24} inputMode="tel" />
        </Field>

        <Field label="Event date" htmlFor="eventDate">
          <Input
            id="eventDate"
            name="eventDate"
            type="date"
            defaultValue={defaults?.eventDate ?? ''}
            required
          />
        </Field>

        <Field label="Guests" htmlFor="guests">
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

        <Field label="Start time" htmlFor="startTime">
          <Input id="startTime" name="startTime" type="time" defaultValue={defaults?.startTime ?? ''} />
        </Field>

        <Field label="End time" htmlFor="endTime">
          <Input id="endTime" name="endTime" type="time" defaultValue={defaults?.endTime ?? ''} />
        </Field>

        <Field label="Venue" htmlFor="venueName">
          <Input id="venueName" name="venueName" defaultValue={defaults?.venueName ?? ''} maxLength={160} />
        </Field>

        <Field label="Venue address" htmlFor="venueAddress">
          <Input
            id="venueAddress"
            name="venueAddress"
            defaultValue={defaults?.venueAddress ?? ''}
            maxLength={240}
          />
        </Field>

        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={defaults?.status ?? 'enquiry'}>
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {EVENT_STATUS_LABEL[status]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notes" htmlFor="notes" className="md:col-span-2">
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
          Cancel
        </Link>
      </div>
    </form>
  )
}
