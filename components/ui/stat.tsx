import { Card, CardContent } from '@/components/ui/card'

export function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'warning'
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-ink-muted">{label}</p>
        <p
          className={
            tone === 'positive'
              ? 'tabular mt-3 text-xl font-semibold text-positive sm:text-2xl'
              : tone === 'warning'
                ? 'tabular mt-3 text-xl font-semibold text-terracotta sm:text-2xl'
                : 'tabular mt-3 text-xl font-semibold text-forest sm:text-2xl'
          }
        >
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
