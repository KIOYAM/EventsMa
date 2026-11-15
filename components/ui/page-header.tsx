import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">{eyebrow}</p>
        ) : null}
        {/*
          Workspace headings are sans: the serif display face belongs to marketing
          and to customer-facing documents, where it reads as ceremony. In a page a
          bookkeeper opens fifty times a day it read as decoration.
          `tracking-tight` keeps a long Tamil title on one line where it can be.
        */}
        {/*
          One step down at mobile: a Tamil heading runs 20-35% longer than its
          English source, and at 24px it took half the fold on a 390px screen.
        */}
        <h1 className="text-pretty text-xl font-semibold leading-tight tracking-tight text-forest sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </header>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-hairline bg-paper px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-forest">{icon}</div> : null}
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
