import Link from 'next/link'
import { Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, Select } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/page-header'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'
import type { EventDetail } from '@/lib/domain/ops'
import { attachEventService, createEventShareLink } from '../../actions'

/** Services attached to the event, plus the customer link that feeds submissions. */
export function ServicesTab({
  event,
  availableServices,
  shareLink,
  demo,
  locale,
}: {
  event: EventDetail
  availableServices: { key: string; label: string }[]
  shareLink: { token: string; expiresAt: Date | null } | null
  demo: boolean
  locale: Locale
}) {
  const t = createTranslator(locale)
  const [attachedBefore, attachedAfter = ''] = t('events.detail.allServicesAttached').split(
    '{services}',
  )

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.servicesOnEvent')}</CardTitle>
          <Badge tone="outline">{event.services.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.services.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-6 w-6" aria-hidden />}
              title={t('events.detail.noServicesTitle')}
              description={t('events.detail.noServicesBody')}
            />
          ) : (
            <div className="divide-y divide-hairline">
              {event.services.map((svc) => (
                <div key={svc.key} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{svc.label}</p>
                    <p className="text-xs text-ink-muted">
                      {svc.key} · {svc.status}
                    </p>
                  </div>
                  <Badge tone="outline" className="text-[10px] px-2 py-1">
                    {svc.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('events.detail.addService')}</CardTitle>
          <CardDescription>{t('events.detail.addServiceBody')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableServices.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {attachedBefore}
              <Link href="/services" className="text-forest underline underline-offset-2">
                {t('nav.services')}
              </Link>
              {attachedAfter}
            </p>
          ) : (
            <form action={attachEventService} className="space-y-3">
              <input type="hidden" name="eventId" value={event.id} />
              <Field label={t('events.detail.service')} htmlFor="attachService">
                <Select id="attachService" name="serviceKey" required defaultValue="">
                  <option value="" disabled>
                    {t('events.detail.chooseService')}
                  </option>
                  {availableServices.map((service) => (
                    <option key={service.key} value={service.key}>
                      {service.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <button
                type="submit"
                disabled={demo}
                className="btn btn-md btn-primary w-full disabled:opacity-50"
              >
                {t('events.detail.attachService')}
              </button>
            </form>
          )}

          <div className="border-t border-hairline pt-4">
            <p className="text-sm font-medium text-ink">{t('events.detail.shareLink')}</p>
            <p className="mt-1 text-xs text-ink-muted">{t('events.detail.shareLinkBody')}</p>
            {shareLink ? (
              <div className="mt-3 space-y-2">
                <input
                  readOnly
                  value={`/share/${shareLink.token}`}
                  aria-label={t('events.detail.shareLinkPath')}
                  className="h-10 w-full rounded-control border border-hairline bg-canvas px-3 text-xs text-ink"
                />
                <Link
                  href={`/share/${shareLink.token}`}
                  target="_blank"
                  className="inline-flex h-9 items-center rounded-control border border-hairline px-3 text-xs text-ink hover:bg-mint-subtle"
                >
                  {t('events.detail.openCustomerView')}
                </Link>
              </div>
            ) : (
              <form action={createEventShareLink} className="mt-3">
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  disabled={demo}
                  className="inline-flex h-9 items-center rounded-control border border-hairline px-3 text-xs text-ink hover:bg-mint-subtle disabled:opacity-50"
                >
                  {t('events.detail.createShareLink')}
                </button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
