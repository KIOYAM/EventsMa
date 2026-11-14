import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { createTranslator } from '@/lib/i18n'
import { formatNumberLocalised } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/locales'
import { pageCount, pageHref } from '@/lib/pagination'

export function Pagination({
  basePath,
  page,
  total,
  pageSize,
  params = {},
  locale = 'en',
}: {
  basePath: string
  page: number
  total: number
  pageSize: number
  params?: Record<string, string | undefined>
  /** The interface language; defaults to English for surfaces not yet translated. */
  locale?: Locale
}) {
  const pages = pageCount(total, pageSize)
  if (pages <= 1) return null

  const t = createTranslator(locale)
  const previous = pageHref(basePath, { ...params, page: String(page - 1) })
  const next = pageHref(basePath, { ...params, page: String(page + 1) })

  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label={t('common.pagination')}>
      <p className="text-xs text-ink-muted">
        {t('common.pageSummary', {
          page,
          pages,
          count: formatNumberLocalised(total, locale),
        })}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={previous}
            rel="prev"
            className="inline-flex h-9 items-center gap-1.5 rounded-control border border-hairline bg-paper px-3 text-xs text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {t('common.previous')}
          </Link>
        ) : null}
        {page < pages ? (
          <Link
            href={next}
            rel="next"
            className="inline-flex h-9 items-center gap-1.5 rounded-control border border-hairline bg-paper px-3 text-xs text-ink"
          >
            {t('common.next')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
