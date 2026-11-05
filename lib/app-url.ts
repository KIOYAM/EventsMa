/**
 * One place that decides the public origin. Links in emails, quote shares and
 * auth redirects must never be built from the request Host header.
 */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000').replace(/\/$/, '')
}

/**
 * Accept only same-origin paths. `//evil.example` is rejected because it is a
 * protocol-relative URL, not a path.
 */
export function safeNext(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value.slice(0, 500)
}
