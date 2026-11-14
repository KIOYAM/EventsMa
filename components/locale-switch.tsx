'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALES, SHIPPED_LOCALES, type Locale } from '@/lib/i18n/locales'
import { setUiLocale } from '@/lib/i18n/set-locale'

/**
 * Language choice in the workspace shell.
 *
 * Switching writes the cookie through a server action and refreshes the server
 * tree only, so a half-filled form in a client component keeps its state. Each
 * label is written in its own script, so someone who cannot read English can
 * still find their language.
 */
export function LocaleSwitch({
  locale,
  label,
  className,
}: {
  locale: Locale
  label: string
  className?: string
}) {
  const [pending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useState<Locale>(locale)
  const router = useRouter()

  const choices = LOCALES.filter((entry) => SHIPPED_LOCALES.includes(entry.code))

  const choose = (code: Locale) => {
    if (code === optimistic) return
    setOptimistic(code)
    // The layout declares `lang` on its content wrapper, which the refresh
    // re-renders with the new locale, so nothing here touches the document.
    startTransition(() => {
      void setUiLocale(code).then(() => router.refresh())
    })
  }

  return (
    <div
      role="group"
      aria-label={label}
      aria-busy={pending}
      className={`inline-flex items-center gap-0.5 rounded-full border border-hairline bg-paper p-0.5 ${className ?? ''}`}
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
            className={`h-8 shrink-0 rounded-full px-2.5 text-xs transition ${
              active ? 'bg-forest font-medium text-white' : 'text-ink hover:bg-mint-subtle'
            }`}
          >
            {entry.native}
          </button>
        )
      })}
    </div>
  )
}
