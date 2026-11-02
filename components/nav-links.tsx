'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Layers, LayoutGrid, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/services', label: 'Services', icon: Layers },
  { href: '/catalogue', label: 'Catalogue', icon: Package },
  { href: '/quotes', label: 'Quotes', icon: FileText },
] as const

export function NavLinks({ variant }: { variant: 'rail' | 'mobile' }) {
  const pathname = usePathname()

  if (variant === 'mobile') {
    return (
      <>
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-1 text-[11px]',
                isActive ? 'text-forest' : 'text-ink-muted',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.25]')} aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </>
    )
  }

  return (
    <nav className="mt-2 space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-10 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
              isActive
                ? 'bg-mint font-medium text-forest'
                : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
