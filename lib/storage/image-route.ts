import { verifyImageRequest } from './image-url'

/**
 * The image proxy, minus its dependencies so it can be tested without Supabase.
 *
 * Why a proxy at all: the bucket is private, and a signed Supabase URL expires and
 * changes. The proxy holds the signature server-side, returns immutable bytes to
 * the optimizer, and keeps the page's URL stable.
 */
export interface ImageRouteDeps {
  /** Creates a short-lived storage URL for one object path. */
  resolveSignedUrl: (path: string) => Promise<string | null>
  fetchImpl?: typeof fetch
  now?: () => number
}

const CACHE_SECONDS = 7 * 24 * 60 * 60

function notFound(): Response {
  return new Response(null, {
    status: 404,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}

export async function storefrontImageResponse(
  search: URLSearchParams,
  deps: ImageRouteDeps,
): Promise<Response> {
  const now = deps.now ?? Date.now
  const path = verifyImageRequest(search.get('p'), search.get('e'), search.get('s'), now())
  if (!path) return notFound()

  const signed = await deps.resolveSignedUrl(path)
  if (!signed) return notFound()

  let upstream: Response
  try {
    upstream = await (deps.fetchImpl ?? fetch)(signed, {
      cache: 'no-store',
      redirect: 'follow',
    })
  } catch {
    return notFound()
  }

  if (!upstream.ok || !upstream.body) return notFound()

  // The bucket stores photos. Anything else (a misconfigured object, an HTML error
  // page from the storage host) must not be served as an image.
  const contentType = (upstream.headers.get('content-type') ?? '').toLowerCase()
  if (!contentType.startsWith('image/')) return notFound()

  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, immutable`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline',
  })

  const length = upstream.headers.get('content-length')
  if (length) headers.set('Content-Length', length)

  return new Response(upstream.body, { status: 200, headers })
}
