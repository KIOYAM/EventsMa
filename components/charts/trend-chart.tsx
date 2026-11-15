import { cn } from '@/lib/utils'

/**
 * A trend line, drawn by hand.
 *
 * There is no chart library in this project and we are not adding one: a line
 * through six points is arithmetic, not a dependency.
 *
 * The geometry lives in an SVG stretched with `preserveAspectRatio="none"`, and
 * the stroke carries `vector-effect="non-scaling-stroke"` so it stays 2px at every
 * width instead of fattening on a wide screen. Labels, dots and the zero rule are
 * HTML, so type stays crisp and does not scale with the viewport.
 *
 * The domain always includes zero: pipeline is never negative, but a margin can
 * be, and a chart that silently clips losses is worse than no chart.
 */

export type TrendPoint = { key: string; label: string; value: number }

export function TrendChart({
  points,
  id,
  formatValue,
  tone = 'forest',
  height = 'h-40',
  ariaLabel,
  caption,
  className,
}: {
  points: TrendPoint[]
  /** Unique per page: gradient ids must not collide between two charts. */
  id: string
  formatValue: (value: number) => string
  tone?: 'forest' | 'terracotta'
  height?: string
  /** The whole series as a sentence, for anyone who cannot see the shape. */
  ariaLabel: string
  caption?: string
  className?: string
}) {
  const values = points.map((point) => point.value)
  const domainMax = Math.max(0, ...values)
  const domainMin = Math.min(0, ...values)
  const span = domainMax - domainMin || 1

  const y = (value: number) => ((domainMax - value) / span) * 100
  const x = (index: number) =>
    points.length <= 1 ? 50 : (index / (points.length - 1)) * 100

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(2)},${y(point.value).toFixed(2)}`).join(' ')
  const zero = y(0)
  const area = points.length
    ? `M${x(0).toFixed(2)},${zero.toFixed(2)} ${line.replace(/^M/, 'L')} L${x(points.length - 1).toFixed(2)},${zero.toFixed(2)} Z`
    : ''

  const stroke = tone === 'terracotta' ? 'text-terracotta' : 'text-forest'
  const gradientId = `trend-${id}`

  return (
    <figure className={cn('w-full', className)}>
      <div className={cn('relative', height)}>
        {/* Grid rules: top, middle, zero. The zero rule is the one that matters. */}
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-x-0 top-0 border-t border-hairline" />
          <div className="absolute inset-x-0 top-1/2 border-t border-hairline" />
          <div
            className="absolute inset-x-0 border-t border-ink-muted/40"
            style={{ top: `${zero}%` }}
          />
        </div>

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={cn('absolute inset-0 h-full w-full', stroke)}
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {points.length > 1 ? (
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {/* Dots are HTML so they stay round however the SVG is stretched. */}
        <div aria-hidden className="absolute inset-0">
          {points.map((point, index) => (
            <span
              key={point.key}
              className={cn(
                'absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-current',
                stroke,
              )}
              style={{ left: `${x(index)}%`, top: `${y(point.value)}%` }}
              title={`${point.label}: ${formatValue(point.value)}`}
            />
          ))}
        </div>
      </div>

      <div aria-hidden className="mt-2 flex justify-between gap-1">
        {points.map((point) => (
          <span key={point.key} className="text-[11px] text-ink-muted">
            {point.label}
          </span>
        ))}
      </div>

      {caption ? <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption> : null}
    </figure>
  )
}
