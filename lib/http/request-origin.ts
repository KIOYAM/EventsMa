import { appUrl } from '@/lib/app-url'

/**
 * The origin the owner's browser is actually using.
 *
 * `appUrl()` is deliberately request-independent: emailed quotes and auth
 * redirects must not follow a Host header. A link *displayed* in the builder is
 * the one case where the address bar is the truth — on a preview deployment
 * `NEXT_PUBLIC_APP_URL` still names production (or, locally, the wrong port), so
 * the owner would copy a link that does not open what they are looking at.
 *
 * Safe precisely because nothing is sent: the string goes back to the requester
 * that supplied the header. It is never emailed, redirected to or cached.
 */

const HOST_RE = /^(?:[a-z0-9.-]+|\[[0-9a-f:.]+\])(?::\d{1,5})?$/i
const LOOPBACK_RE = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i

interface HeaderReader {
  get(name: string): string | null
}

/** The host a proxy or the browser actually used, or null if it is unusable. */
export function usableHost(read: HeaderReader): string | null {
  const host = (read.get('x-forwarded-host') ?? read.get('host') ?? '').split(',')[0]?.trim()
  return host && HOST_RE.test(host) ? host : null
}

/** Pure so precedence and fallback can be tested without a request. */
export function resolveOrigin(read: HeaderReader, fallback: string = appUrl()): string {
  const host = usableHost(read)
  if (!host) return fallback

  const forwardedProto = read.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const proto =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : LOOPBACK_RE.test(host)
        ? 'http'
        : 'https'

  return `${proto}://${host}`
}
