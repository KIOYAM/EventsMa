'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Field measurement without a vendor SDK: two PerformanceObservers, one
 * beacon per visit. It measures LCP and CLS only, sends no identifiers, and
 * does nothing if the browser lacks the APIs. Dev is skipped so local numbers
 * never pollute the production sample.
 */
export function PerfMonitor() {
  const pathname = usePathname()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof PerformanceObserver === 'undefined') return

    let lcp = 0
    let cls = 0
    let sent = false

    const observers: PerformanceObserver[] = []

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) lcp = last.startTime
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      observers.push(lcpObserver)

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value?: number
          hadRecentInput?: boolean
        })[]) {
          if (!entry.hadRecentInput) cls += entry.value ?? 0
        }
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      observers.push(clsObserver)
    } catch {
      return
    }

    const report = () => {
      if (sent) return
      sent = true
      const body = JSON.stringify({
        path: pathname,
        lcp: Math.round(lcp),
        cls: Math.round(cls * 1000) / 1000,
      })
      navigator.sendBeacon(
        '/api/vitals',
        new Blob([body], { type: 'application/json' }),
      )
    }

    const onHidden = () => {
      if (document.visibilityState === 'hidden') report()
    }

    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', report)

    return () => {
      report()
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', report)
      for (const observer of observers) observer.disconnect()
    }
  }, [pathname])

  return null
}
