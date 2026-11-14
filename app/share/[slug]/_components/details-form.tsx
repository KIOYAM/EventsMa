'use client'

import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'

/**
 * The only thing the customer has to type.
 *
 * Split out of the portal form to keep that file under the size the repo allows,
 * and because these four fields are the one part of the link that must feel like
 * a normal, familiar form in any language.
 */
export function DetailsForm({
  locale,
  name,
  phone,
  email,
  message,
  onName,
  onPhone,
  onEmail,
  onMessage,
}: {
  locale: Locale
  name: string
  phone: string
  email: string
  message: string
  onName: (value: string) => void
  onPhone: (value: string) => void
  onEmail: (value: string) => void
  onMessage: (value: string) => void
}) {
  const t = createTranslator(locale)

  return (
    <section className="rounded-2xl border border-hairline bg-paper p-4 sm:p-6">
      <h2 className="font-display text-xl text-forest">{t('share.yourDetails')}</h2>
      <p className="mt-1 text-sm text-ink-muted">{t('share.detailsHelp')}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink">{t('share.name')}</span>
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            required
            maxLength={120}
            autoComplete="name"
            className="h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm text-ink"
            placeholder={t('share.namePlaceholder')}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{t('share.phone')}</span>
          <input
            value={phone}
            onChange={(e) => onPhone(e.target.value)}
            type="tel"
            maxLength={24}
            autoComplete="tel"
            inputMode="tel"
            className="h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm text-ink"
            placeholder={t('share.phonePlaceholder')}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{t('share.emailLabel')}</span>
          <input
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            type="email"
            maxLength={160}
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-sm text-ink"
            placeholder={t('share.emailPlaceholder')}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {t('share.anythingElse')}
          </span>
          <textarea
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink"
            placeholder={t('share.messagePlaceholder')}
          />
        </label>
      </div>
    </section>
  )
}
