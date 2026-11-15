import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * One list, two presentations.
 *
 * Desktop gets a real `<table>` — screen readers get row/column relationships and
 * the columns line up down the page. Below `md` that table would either scroll
 * sideways or crush five columns into 360px, so it becomes a stack of cards whose
 * title, meta and trailing figure are supplied by the same column definitions.
 *
 * Deliberately not a client component: sorting, filtering and paging stay in the
 * URL where the rest of the app already keeps them, so this ships no JavaScript.
 */

export type DataTableDensity = 'comfortable' | 'compact'

export type DataTableColumn<T> = {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  /** Right-aligns the column and its header; use for money and counts. */
  align?: 'start' | 'end'
  /** Dropped from the mobile card, which only has room for what matters. */
  secondary?: boolean
  className?: string
}

export type DataTableProps<T> = {
  rows: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  /** Makes the whole row a link on desktop and the card title a link on mobile. */
  href?: (row: T) => string
  /** Accessible name for the row link; defaults to the mobile title. */
  rowLabel?: (row: T) => string
  density?: DataTableDensity
  mobileTitle?: (row: T) => React.ReactNode
  mobileMeta?: (row: T) => React.ReactNode
  mobileTrailing?: (row: T) => React.ReactNode
  /** Row-level controls that must stay reachable on the card, below the fold line. */
  mobileActions?: (row: T) => React.ReactNode
  className?: string
}

const CELL_Y: Record<DataTableDensity, string> = {
  comfortable: 'py-3.5',
  compact: 'py-2.5',
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  href,
  rowLabel,
  density = 'comfortable',
  mobileTitle,
  mobileMeta,
  mobileTrailing,
  mobileActions,
  className,
}: DataTableProps<T>) {
  const first = columns[0]
  const pad = CELL_Y[density]

  return (
    <div className={className}>
      <div className="hidden overflow-hidden card-surface md:block">
        <table>
          <thead>
            <tr className="border-b border-hairline bg-sunken/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-2.5 align-middle sm:px-5',
                    column.align === 'end' ? 'text-right' : 'text-left',
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const link = href?.(row)
              return (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'transition-colors',
                    link && 'relative hover:bg-mint-subtle/60 focus-within:bg-mint-subtle/60',
                  )}
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-4 align-middle text-sm text-ink sm:px-5',
                        pad,
                        column.align === 'end' && 'text-right',
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                      {index === 0 && link ? (
                        <Link
                          href={link}
                          className="absolute inset-0 z-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest"
                        >
                          <span className="sr-only">
                            {rowLabel?.(row) ?? mobileTitle?.(row) ?? 'Open'}
                          </span>
                        </Link>
                      ) : null}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.map((row) => {
          const link = href?.(row)
          const title = mobileTitle?.(row) ?? first?.cell(row)
          return (
            <li key={rowKey(row)} className="card-flat p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {link ? (
                    <Link
                      href={link}
                      className="block truncate text-sm font-semibold text-ink hover:text-forest"
                    >
                      {title}
                    </Link>
                  ) : (
                    <p className="truncate text-sm font-semibold text-ink">{title}</p>
                  )}
                  {mobileMeta ? (
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{mobileMeta(row)}</p>
                  ) : null}
                </div>
                {mobileTrailing ? (
                  <div className="shrink-0 text-right">{mobileTrailing(row)}</div>
                ) : null}
              </div>
              {mobileActions ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
                  {mobileActions(row)}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
