'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CopyPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { reviseQuotation, type ReviseError } from '@/app/(app)/quotes/revision-actions'
import { createTranslator } from '@/lib/i18n'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales'

/**
 * Revision button.
 *
 * The action returns a code, never a sentence: the sentence is chosen here, in the
 * reader's language. English wording is unchanged.
 */
const ERROR_KEYS: Record<ReviseError, string> = {
  not_allowed: 'quotes.errors.notAllowed',
  demo: 'quotes.errors.demo',
  unknown: 'quotes.errors.unknown',
  no_version: 'quotes.errors.noVersion',
  read_failed: 'quotes.errors.readFailed',
  failed: 'quotes.errors.failed',
}

export function ReviseButton({
  quotationId,
  locale = DEFAULT_LOCALE,
}: {
  quotationId: string
  locale?: Locale
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const t = createTranslator(locale)

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await reviseQuotation(quotationId)
          if (!result.ok) {
            toast.error(t(ERROR_KEYS[result.code]))
            return
          }
          toast.success(
            t('quotes.revise.created', {
              version: result.version,
              previous: result.version - 1,
            }),
          )
          router.refresh()
        })
      }
      className="inline-flex h-11 items-center gap-2 rounded-control border border-hairline bg-paper px-4 text-sm text-ink disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <CopyPlus className="h-4 w-4" aria-hidden />
      )}
      {t('quotes.revise.button')}
    </button>
  )
}
