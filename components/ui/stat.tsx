import { cn } from '@/lib/utils'

/**
 * A KPI: one number, its label, its context.
 *
 * `emphasis="hero"` makes the primary metric on a screen distinguishable from the
 * three that support it — the dashboard previously rendered four equal cards, so
 * nothing told the eye where to start.
 */
export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  emphasis = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning'
  icon?: React.ReactNode
  emphasis?: 'default' | 'hero'
}) {
  const valueTone =
    tone === 'positive' ? 'text-positive' : tone === 'warning' ? 'text-terracotta' : 'text-forest'

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-card p-4 sm:p-5',
        emphasis === 'hero'
          ? 'bg-forest text-white shadow-card'
          : 'border border-hairline bg-paper shadow-card',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn('t-eyebrow', emphasis === 'hero' && 'text-mint')}>{label}</p>
        {icon ? (
          <span
            aria-hidden
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-full',
              emphasis === 'hero' ? 'bg-white/15 text-mint' : 'bg-mint-subtle text-forest',
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>

      <p className={cn('t-metric', emphasis === 'hero' ? 'text-white' : valueTone)}>{value}</p>

      {hint ? (
        <p className={cn('text-xs leading-relaxed', emphasis === 'hero' ? 'text-mint/90' : 'text-ink-muted')}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
