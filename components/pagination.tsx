import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { pageCount, pageHref } from '@/lib/pagination'

export function Pagination({
  basePath,
  page,
  total,
  pageSize,
  params = {},
}: {
  basePath: string
  page: number
  total: number
  pageSize: number
  params?: Record<string, string | undefined>
}) {
  const pages = pageCount(total, pageSize)
  if (pages <= 1) return null

  const previous = pageHref(basePath, { ...params, page: String(page - 1) })
  const next = pageHref(basePath, { ...params, page: String(page + 1) })

  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <p className="text-xs text-ink-muted">
        Page {page} of {pages} · {total.toLocaleString('en-IN')} total
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={previous}
            rel="prev"
            className="inline-flex h-9 items-center gap-1.5 rounded-control border border-hairline bg-paper px-3 text-xs text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link
            href={next}
            rel="next"
            className="inline-flex h-9 items-center gap-1.5 rounded-control border border-hairline bg-paper px-3 text-xs text-ink"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
