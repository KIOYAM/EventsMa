'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Boxes,
  CalendarDays,
  FileText,
  Images,
  Inbox,
  LayoutGrid,
  Layers,
  Package,
  Receipt,
  Settings,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const GROUPS = [
  {
    label: 'Sell',
    items: [
      { href: '/clients', label: 'Clients', icon: Inbox },
      { href: '/events', label: 'Events', icon: CalendarDays },
      { href: '/quotes', label: 'Quotes', icon: FileText },
      { href: '/invoices', label: 'Invoices', icon: Receipt },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { href: '/menu', label: 'Menu', icon: BookOpen },
      { href: '/packages', label: 'Packages', icon: Layers },
      { href: '/catalogue', label: 'Catalogue', icon: Package },
      { href: '/inventory', label: 'Stock', icon: Boxes },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/finance', label: 'Money', icon: Wallet },
      { href: '/reports', label: 'Reports', icon: TrendingUp },
      { href: '/team', label: 'Team', icon: Users },
      { href: '/services', label: 'Services', icon: Layers },
      { href: '/portfolio', label: 'Portfolio', icon: Images },
      { href: '/storefront', label: 'Storefront', icon: Store },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
] as const

/** Four tabs, because a fifth target is a miss on a phone held one-handed. */
const MOBILE = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/clients', label: 'Clients', icon: Inbox },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
] as const

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavLinks({ variant }: { variant: 'rail' | 'mobile' }) {
  const pathname = usePathname()

  if (variant === 'mobile') {
    return (
      <div className="contents">
        {MOBILE.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-1 text-[10px]',
                active ? 'text-forest' : 'text-ink-muted',
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.25]')} aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <nav className="no-scrollbar mt-2 flex-1 space-y-4 overflow-y-auto pb-4" aria-label="Workspace">
      <Link
        href="/dashboard"
        aria-current={pathname === '/dashboard' ? 'page' : undefined}
        className={cn(
          'flex h-10 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
          pathname === '/dashboard'
            ? 'bg-mint font-medium text-forest'
            : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Dashboard
      </Link>

      {GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
                    active
                      ? 'bg-mint font-medium text-forest'
                      : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      <div className="border-t border-hairline pt-3">
        <Link
          href="/me"
          aria-current={isActive(pathname, '/me') ? 'page' : undefined}
          className={cn(
            'flex h-9 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors',
            isActive(pathname, '/me')
              ? 'bg-mint font-medium text-forest'
              : 'text-ink-muted hover:bg-mint-subtle hover:text-ink',
          )}
        >
          <Users className="h-4 w-4" aria-hidden />
          My work
        </Link>
      </div>
    </nav>
  )
}
