'use client'

import { useSearchParams } from 'next/navigation'

const MESSAGES: Record<string, string> = {
  sent: 'Thank you - your enquiry is with the business. They will reply on the number you gave.',
  contact: 'Please add your name and a 10-digit mobile number.',
  demo: 'Demo mode: enquiries are not delivered until a database is connected.',
  notfound: 'That business could not be found.',
}

/**
 * Keeping search params in a client leaf lets the public profile itself stay
 * cacheable. The server no longer reads `searchParams`, so ISR can do its job.
 */
export function PublicNotice() {
  const params = useSearchParams()
  const error = params.get('error')
  const sent = params.get('sent')
  const message = sent ? MESSAGES.sent : error ? MESSAGES[error] : null

  if (!message) return null

  return (
    <div
      role={error ? 'alert' : 'status'}
      className={
        error
          ? 'mt-3 rounded-control bg-[#fdf0e2] px-3 py-2 text-xs text-warning'
          : 'mt-3 rounded-control bg-[#e6f4ea] px-3 py-2 text-xs text-positive'
      }
    >
      {message}
    </div>
  )
}
