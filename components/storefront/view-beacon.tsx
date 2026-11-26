'use client'

import { useEffect } from 'react'

/**
 * One view per tab session.
 *
 * `sendBeacon` is used because the visitor may leave immediately after the page
 * paints; a normal fetch would be cancelled. The server only keeps the referring
 * host and sanitised UTMs, and the session key stops a reload from inflating the
 * count. Storage can throw in private modes — then the beacon is skipped, not
 * the page.
 */
export function StorefrontViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const key = `storefront-view:${slug}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')

      const payload = JSON.stringify({
        slug,
        referrer: document.referrer.slice(0, 500),
        query: window.location.search.slice(0, 300),
      })

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        if (navigator.sendBeacon('/api/storefront/view', blob)) return
      }

      void fetch('/api/storefront/view', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      })
    } catch {
      // No storage, no beacon. Counting is best effort by design.
    }
  }, [slug])

  return null
}
