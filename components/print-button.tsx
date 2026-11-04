'use client'

import { Printer } from 'lucide-react'

export function PrintButton({ label = 'Print' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-control border border-hairline bg-paper px-4 text-sm text-ink print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden />
      {label}
    </button>
  )
}
