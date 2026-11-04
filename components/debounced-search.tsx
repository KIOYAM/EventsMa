'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'

/**
 * 300 ms debounce, one in-flight navigation at a time, and no request when the
 * query is unchanged. The URL stays the source of truth so a result is
 * shareable and the back button works.
 */
export function DebouncedSearch({
  placeholder = 'Search',
  param = 'q',
}: {
  placeholder?: string
  param?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get(param) ?? '')
  const [pending, startTransition] = useTransition()
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const next = value.trim()
      if (next) params.set(param, next)
      else params.delete(param)
      params.delete('page')

      if (params.toString() === searchParams.toString()) return
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [value, param, pathname, router, searchParams])

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        className="h-10 w-full rounded-control border border-hairline bg-paper pl-9 pr-9 text-sm text-ink placeholder:text-ink-muted/70"
      />
      {pending ? (
        <Loader2
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted"
          aria-hidden
        />
      ) : null}
    </div>
  )
}
