import { cn } from '@/lib/utils'

/**
 * Form controls: 44px tall, one hairline, one focus treatment.
 *
 * The focus ring is not optional — `focus-visible` alone leaves a text field with
 * no visible focus while it is being typed into, which is exactly when a keyboard
 * user needs to see where they are.
 */
const CONTROL =
  'w-full rounded-control border border-hairline bg-paper px-3 text-sm text-ink placeholder:text-ink-muted/70 transition-colors hover:border-ink-muted/40 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger-ink aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger-bg'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-11', CONTROL, className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('min-h-24 py-2', CONTROL, className)} {...props} />
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('h-11', CONTROL, className)} {...props}>
      {children}
    </select>
  )
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: string
  /** Shown in place of the hint, in the danger colour, announced as an alert. */
  error?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}
