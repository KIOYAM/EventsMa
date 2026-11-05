import { cn } from '@/lib/utils'

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div className={cn(align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl', className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mint-bright/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl leading-[1.08] tracking-[-0.025em] text-cream sm:text-4xl lg:text-[2.8rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-[15px] leading-relaxed text-white/60 sm:text-base">{description}</p>
      ) : null}
    </div>
  )
}

export function SectionShell({
  id,
  children,
  className,
  tone = 'night',
}: {
  id?: string
  children: React.ReactNode
  className?: string
  tone?: 'night' | 'soft' | 'plain'
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 border-t border-white/10 py-16 sm:py-20 lg:py-28',
        tone === 'night' && 'bg-night',
        tone === 'soft' && 'bg-night-soft',
        tone === 'plain' && 'bg-night',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">{children}</div>
    </section>
  )
}
