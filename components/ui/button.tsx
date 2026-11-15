import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * One action language.
 *
 * 43 hand-rolled buttons in the app meant the same job could be 40 or 44 tall, with
 * four different hovers. Every action should come from here: `<Button>` for a
 * mutation, `<LinkButton>` for navigation.
 *
 * `secondary` is the default-driven middle weight; `primary` is for the single
 * most important action on a screen, not for every action.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
  {
    variants: {
      variant: {
        primary: 'bg-forest text-white hover:bg-forest-hover',
        secondary: 'bg-mint text-forest hover:bg-mint-subtle',
        outline: 'border border-hairline bg-paper text-ink hover:bg-mint-subtle',
        ghost: 'text-ink hover:bg-mint-subtle',
        danger: 'bg-terracotta text-white hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-5 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Variant = VariantProps<typeof buttonVariants>

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Variant {}

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}

/**
 * The same action, as a link.
 *
 * Next prefetches on hover, so navigation stays instant while the visual language
 * matches every other button on the page.
 */
export function LinkButton({
  href,
  className,
  variant,
  size,
  children,
  ...props
}: {
  href: string
  className?: string
  children: React.ReactNode
} & Variant &
  Omit<React.ComponentProps<typeof Link>, 'href' | 'className' | 'children'>) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  )
}

/** A row of actions that wraps instead of overflowing on a narrow screen. */
export function ActionGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>
  )
}

export { buttonVariants }
