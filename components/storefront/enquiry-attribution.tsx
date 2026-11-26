'use client'

import { useEffect, useRef } from 'react'

/**
 * Hidden attribution fields for the enquiry form.
 *
 * The form posts a server action, so the values are set on the client just
 * before submission: the page that referred the visitor and the UTMs they landed
 * with are browser-only facts. The section is captured when they press a
 * "get a quote" link, which is the strongest available signal of what they were
 * reading. Without JavaScript the form still works; the enquiry is simply
 * recorded as unattributed.
 */
export function EnquiryAttribution() {
  const anchor = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const form = anchor.current?.closest('form')
    if (!form) return

    const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | null
    const fill = (name: string, value: string) => {
      const input = field(name)
      if (input && !input.value) input.value = value
    }

    fill('landingReferrer', document.referrer.slice(0, 500))
    fill('landingQuery', window.location.search.slice(0, 300))

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[href="#enquiry"]')
      if (!link) return

      const landmark = link.closest<HTMLElement>('section[id], header[id], [data-landing]')
      const section = landmark?.id || landmark?.dataset.landing || ''
      const input = field('landingSection')
      if (input) input.value = section.slice(0, 40)
    }

    // Capture phase: the value is set even if another handler stops propagation.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return (
    <span ref={anchor} hidden>
      <input type="hidden" name="landingSection" defaultValue="" />
      <input type="hidden" name="landingReferrer" defaultValue="" />
      <input type="hidden" name="landingQuery" defaultValue="" />
    </span>
  )
}
