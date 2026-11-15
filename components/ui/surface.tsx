import { cn } from '@/lib/utils'

/**
 * Three surfaces, because 64 identical bordered boxes is why the app reads flat.
 *
 *   sunken   — a quiet grouping inside a page. No border, no shadow.
 *   section  — a grouping that needs a edge: hairline rule, no shadow.
 *   raised   — a real card: white, hairline, one soft shadow.
 *
 * Pick by the relationship the information has, not by habit. If two things are
 * merely nearby, `sunken` is enough; if one can be acted on separately, `raised`.
 */
export function Surface({
  level = 'raised',
  className,
  children,
}: {
  level?: 'sunken' | 'section' | 'raised'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        level === 'sunken' && 'rounded-card bg-sunken p-5',
        level === 'section' && 'rounded-card border border-hairline p-5',
        level === 'raised' && 'rounded-card border border-hairline bg-paper p-5 shadow-card',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * A titled section: heading, one-line explanation, optional action.
 *
 * Replaces the per-page `<div className="flex items-end justify-between">` +
 * `<h2 className="text-sm font-semibold">` duplet that every list page repeats.
 */
export function SectionHeader({
  title,
  hint,
  action,
  className,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-1', className)}>
      <div className="min-w-0">
        <h2 className="t-section">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0 text-sm">{action}</div> : null}
    </div>
  )
}
