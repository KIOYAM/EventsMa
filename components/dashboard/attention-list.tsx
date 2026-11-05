import Link from 'next/link'
import { ArrowRight, FileText, IndianRupee, CalendarDays } from 'lucide-react'
import type { AttentionItem } from '@/lib/domain/ops'

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

/** The dashboard's "do this next" list. Rows are query-capped, not scrolled. */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-card border border-hairline bg-paper p-5 text-sm text-ink-muted">
        Nothing needs attention. Sent quotes, upcoming events and open invoices are all clear.
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
              <span className="block truncate text-xs opacity-80">{item.detail}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
          </Link>
        )
      })}
    </div>
  )
}
