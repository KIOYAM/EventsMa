'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Boxes, FileText, Layers, LayoutGrid, Package, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/menu', label: 'Menu', icon: BookOpen },
  { href: '/catalogue', label: 'Catalogue', icon: Package },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/inventory', label: 'Stock', icon: Boxes },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/services', label: 'Services', icon: Layers },
] as const

export function NavLinks({ variant }: { variant: 'rail' | 'mobile' }) {
  const pathname = usePathname()

  if (variant === 'mobile') {
    return (
      <div className="flex w-full items-stretch justify-around gap-0.5 overflow-x-auto no-scrollbar">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-16 min-w-[54px] flex-1 flex-col items-center justify-center gap-1 text-[10px]',
                isActive ? 'text-forest' : 'text-ink-muted',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.25]')} aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </div>
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
