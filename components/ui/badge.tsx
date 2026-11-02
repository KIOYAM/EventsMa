import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-mint-subtle text-forest',
        mint: 'bg-mint text-forest',
        accent: 'bg-terracotta-soft text-terracotta',
        gold: 'bg-[#fbf2df] text-[#8a6524]',
        success: 'bg-[#e6f4ea] text-positive',
        warning: 'bg-[#fdf0e2] text-warning',
        outline: 'border border-hairline text-ink-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
