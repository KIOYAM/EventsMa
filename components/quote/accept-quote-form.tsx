'use client'

import { useFormStatus } from 'react-dom'
import { Field, Input } from '@/components/ui/input'
import { acceptQuote } from '@/app/q/[token]/actions'
import { createTranslator } from '@/lib/i18n'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-md btn-primary w-full disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export function AcceptQuoteForm({ token, locale = DEFAULT_LOCALE }: { token: string; locale?: Locale }) {
  const t = createTranslator(locale)

  return (
    <form action={acceptQuote} className="card-surface p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
        {t('quotes.accept.eyebrow')}
      </p>
      <h2 className="mt-1 text-base font-semibold text-ink">{t('quotes.accept.title')}</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t('quotes.accept.body')}</p>

      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="accepted" value="yes" />

      <div className="mt-4">
        <Field label={t('quotes.accept.emailLabel')} htmlFor="acceptEmail" hint={t('quotes.accept.emailHint')}>
          <Input
            id="acceptEmail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={200}
          />
        </Field>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-hairline" />
        <span>{t('quotes.accept.terms')}</span>
      </label>

      <div className="mt-4">
        <Submit label={t('quotes.accept.submit')} pendingLabel={t('quotes.accept.submitting')} />
      </div>
    </form>
  )
}
