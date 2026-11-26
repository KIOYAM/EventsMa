import { headers } from 'next/headers'
import { appUrl } from '@/lib/app-url'
import { resolveOrigin, usableHost } from './request-origin'

/**
 * The origin for a link the owner is about to copy.
 *
 * Every HTTP request carries a Host, so a missing or malformed one means
 * something upstream is broken. Falling back quietly to `NEXT_PUBLIC_APP_URL` is
 * exactly how a `localhost:3100` link reached a client, so the fallback says so
 * in the server log instead of pretending the copy is safe.
 *
 * Only use this for URLs rendered back to the same requester. Emailed links,
 * auth redirects, canonicals, OG images and the sitemap keep `appUrl()`: they
 * leave the request and must not follow a Host header.
 */
export async function requestOrigin(): Promise<string> {
  const read = await headers()
  if (!usableHost(read)) {
    console.error(
      `[request-origin] No usable Host header on this request; copied links fall back to NEXT_PUBLIC_APP_URL (${appUrl()}).`,
    )
  }
  return resolveOrigin(read)
}
