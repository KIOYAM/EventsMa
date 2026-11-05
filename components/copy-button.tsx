'use client'

import { useState } from 'react'

export function CopyButton({
  value,
  label = 'Copy link',
  copiedLabel = 'Copied',
  className,
}: {
  value: string
  label?: string
  copiedLabel?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={
        className ??
        'inline-flex h-9 items-center rounded-control border border-hairline bg-paper px-3 text-xs text-ink hover:bg-mint-subtle'
      }
    >
      {copied ? copiedLabel : label}
    </button>
  )
}
