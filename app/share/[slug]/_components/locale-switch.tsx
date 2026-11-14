'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALES, SHIPPED_LOCALES, type Locale } from '@/lib/i18n/locales'
import { setLocale } from '../actions'

/**
 * Language choice on the customer link.
 *
 * Changing language must not cost the customer their work, so the switch writes
 * the cookie and refreshes the server components only — the form state lives in
 * the client tree and survives. Each label is written in its own script, so
 * someone who cannot read English can still find their language.
 */
export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<Locale>(locale)
  const router = useRouter()

  const choices = LOCALES.filter((entry) => SHIPPED_LOCALES.includes(entry.code))

  const choose = (code: Locale) => {
    if (code === optimistic) return
    setOptimistic(code)
    // The page declares `lang` on its own subtree, which the refresh re-renders
    // with the new locale, so nothing here has to touch the document element.
    startTransition(() => {
      void setLocale(code).then(() => router.refresh())
    })
  }

  return (
    <div
      role="group"
      aria-label={label}
      aria-busy={pending}
      className="inline-flex items-center gap-0.5 rounded-full border border-hairline bg-paper p-0.5"
    >
      {choices.map((entry) => {
        const active = entry.code === optimistic
        return (
          <button
            key={entry.code}
            type="button"
            lang={entry.intl}
            aria-pressed={active}
            onClick={() => choose(entry.code)}
            className={`h-8 rounded-full px-2.5 text-xs transition ${
              active
                ? 'bg-forest font-medium text-white'
                : 'text-ink hover:bg-mint-subtle'
            }`}
          >
            {entry.native}
          </button>
        )
      })}
    </div>
  )
}
