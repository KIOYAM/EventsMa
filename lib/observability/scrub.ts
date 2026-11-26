/**
 * What leaves the server for the error monitor.
 *
 * A storefront error carries a URL, an owner's phone number and sometimes an
 * enquiry body. Sentry may keep an event for a month, so the scrub happens here,
 * before transport: emails, Indian mobile numbers and query strings are masked,
 * and whole fields that only ever hold personal data are redacted.
 *
 * Structural on purpose: the pure test runs without the Sentry SDK.
 */
type AnyRecord = Record<string, unknown>

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
/** Indian mobiles, with or without +91, spaces or a hyphen. */
const PHONE_RE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g
/** A URL query string is the usual carrier of a token or a phone number. */
const URL_QUERY_RE = /(https?:\/\/[^\s?#]+)\?[^\s#]*/g

const REDACTED_KEYS = new Set([
  'authorization',
  'cookie',
  'cookies',
  'password',
  'phone',
  'mobile',
  'email',
  'query_string',
  'data',
  'secret',
  'token',
])

export function scrubText(value: string): string {
  return value
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(URL_QUERY_RE, '$1?[redacted]')
}

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 6) return '[truncated]'
  if (typeof value === 'string') return scrubText(value)
  if (Array.isArray(value)) return value.slice(0, 50).map((entry) => scrubValue(entry, depth + 1))
  if (!value || typeof value !== 'object') return value

  const out: AnyRecord = {}
  for (const [key, entry] of Object.entries(value as AnyRecord)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase())
      ? '[redacted]'
      : scrubValue(entry, depth + 1)
  }
  return out
}

/**
 * Returns a new event; the caller's object is untouched, which makes the function
 * safe to use in a test and impossible to misuse as an in-place mutation.
 */
export function scrubEvent<T>(event: T): T {
  if (!event || typeof event !== 'object') return event
  return scrubValue(event, 0) as T
}
