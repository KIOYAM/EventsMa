import Link from 'next/link'
import { ArrowRight, FileText, IndianRupee, CalendarDays } from 'lucide-react'
import type { AttentionItem } from '@/lib/domain/ops'
import { createTranslator, type TranslateVars } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/locales'

const ICON = {
  quote: FileText,
  event: CalendarDays,
  invoice: IndianRupee,
} as const

const TONE = {
  mint: 'border-mint bg-mint-subtle text-forest',
  gold: 'border-gold/40 bg-gold-subtle text-ink',
  accent: 'border-terracotta/30 bg-terracotta-soft text-terracotta',
} as const

/**
 * The row's detail line is built from the item's `code`, so the sentence is in
 * the reader's language. Items without a code (older callers) keep their
 * English detail rather than showing a key.
 */
function detailFor(
  t: (key: string, vars?: TranslateVars) => string,
  item: AttentionItem,
): string {
  const params = item.params
  switch (item.code) {
    case 'quoteStale':
      return t('dashboard.attention.quoteStale', params)
    case 'eventTasks':
      return Number(params?.count) === 1
        ? t('dashboard.attention.eventTasksOne', params)
        : t('dashboard.attention.eventTasksMany', params)
    case 'invoiceOverdue':
      return t('dashboard.attention.invoiceOverdue', params)
    case 'invoiceOverdueSince':
      return t('dashboard.attention.invoiceOverdueSince', params)
    case 'demoEvent':
      return t('dashboard.attention.demoEvent')
    case 'demoInvoice':
      return t('dashboard.attention.demoInvoice', params)
    case 'demoQuote':
      return t('dashboard.attention.demoQuote')
    default:
      return item.detail
  }
}

/** The dashboard's "do this next" list. Rows are query-capped, not scrolled. */
export function AttentionList({ items, locale }: { items: AttentionItem[]; locale: Locale }) {
  const t = createTranslator(locale)

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-hairline bg-paper p-5 text-sm text-ink-muted">
        {t('dashboard.attention.clear')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = ICON[item.kind]
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 rounded-card border px-4 py-3 transition-colors hover:brightness-[0.98] ${TONE[item.tone]}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper/70">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              <span className="block truncate text-xs opacity-80">{detailFor(t, item)}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          </Link>
        )
      })}
    </div>
  )
}
