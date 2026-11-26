'use client'

import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'

export interface ShareLabels {
  address: string
  copy: string
  copied: string
  copyFailedHint: string
  copiedHint: string
  hint: string
  whatsapp: string
  open: string
}

interface Props {
  url: string
  /** Pre-formatted `Hi, here is …: <url>` text for the WhatsApp link. */
  message: string
  labels: ShareLabels
}

/**
 * The one thing an owner does after designing the page: send it to a client.
 *
 * Clipboard access is the only reason this is a client component — the URL itself
 * is rendered server-side, so the link is readable and selectable even if the
 * browser refuses the clipboard (in-app browsers on iOS do).
 */
export function ShareLinks({ url, message, labels }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
      window.setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs text-ink-muted">{labels.address}</span>
        <input
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="mt-1 h-11 w-full rounded-control border border-hairline bg-canvas px-3 text-sm text-ink"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-11 items-center gap-2 rounded-control bg-forest px-4 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5"
        >
          {state === 'copied' ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {state === 'copied' ? labels.copied : labels.copy}
        </button>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 items-center gap-2 rounded-control border border-hairline bg-paper px-4 text-sm font-medium text-ink transition-transform duration-200 hover:-translate-y-0.5"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          {labels.whatsapp}
        </a>

        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 items-center gap-2 rounded-control border border-hairline bg-paper px-4 text-sm font-medium text-ink"
        >
          {labels.open}
        </a>
      </div>

      <p aria-live="polite" className="text-xs text-ink-muted">
        {state === 'copied'
          ? labels.copiedHint
          : state === 'failed'
            ? labels.copyFailedHint
            : labels.hint}
      </p>
    </div>
  )
}
