import { describe, expect, it, vi } from 'vitest'
import { storefrontImageResponse } from './image-route'
import { storefrontImageUrl } from './image-url'

const ORG = '11111111-1111-4111-8111-111111111111'
const PATH = `${ORG}/storefront/22222222-2222-4222-8222-222222222222.webp`
const NOW = Date.UTC(2026, 10, 20, 12, 0, 0)
process.env.STOREFRONT_IMAGE_SECRET = 'test-secret'

function searchFor(path = PATH): URLSearchParams {
  const url = storefrontImageUrl(path, NOW)
  return new URL(url as string, 'https://example.test').searchParams
}

function upstream(
  body: BodyInit | null,
  status = 200,
  headers: Record<string, string> = {
    'content-type': 'image/webp',
    'content-length': '5',
  },
): Response {
  return new Response(body, { status, headers })
}

describe('storefront image proxy', () => {
  it('streams the object with immutable cache headers', async () => {
    const resolveSignedUrl = vi.fn(async () => 'https://storage.test/object?token=t')
    const fetchImpl = vi.fn(async () => upstream('hello'))

    const response = await storefrontImageResponse(searchFor(), {
      resolveSignedUrl,
      fetchImpl: fetchImpl as typeof fetch,
      now: () => NOW,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/webp')
    expect(response.headers.get('cache-control')).toContain('immutable')
    expect(response.headers.get('cache-control')).toContain('max-age=604800')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('content-length')).toBe('5')
    expect(await response.text()).toBe('hello')
    expect(resolveSignedUrl).toHaveBeenCalledWith(PATH)
    expect(fetchImpl).toHaveBeenCalledWith('https://storage.test/object?token=t', {
      cache: 'no-store',
      redirect: 'follow',
    })
  })

  it('answers 404 without touching storage when the signature is bad', async () => {
    const resolveSignedUrl = vi.fn(async () => 'https://storage.test/object')
    const search = searchFor()
    const sig = search.get('s') ?? ''
    search.set('s', `${sig.slice(0, -1)}${sig.endsWith('A') ? 'B' : 'A'}`)

    const response = await storefrontImageResponse(search, {
      resolveSignedUrl,
      now: () => NOW,
    })

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(resolveSignedUrl).not.toHaveBeenCalled()
  })

  it('answers 404 when storage cannot sign the object', async () => {
    const response = await storefrontImageResponse(searchFor(), {
      resolveSignedUrl: async () => null,
      now: () => NOW,
    })
    expect(response.status).toBe(404)
  })

  it('answers 404 when the object is missing or is not an image', async () => {
    const missing = await storefrontImageResponse(searchFor(), {
      resolveSignedUrl: async () => 'https://storage.test/missing',
      fetchImpl: (async () => upstream(null, 404, {})) as typeof fetch,
      now: () => NOW,
    })
    expect(missing.status).toBe(404)

    const html = await storefrontImageResponse(searchFor(), {
      resolveSignedUrl: async () => 'https://storage.test/html',
      fetchImpl: (async () =>
        upstream('<html>error</html>', 200, { 'content-type': 'text/html' })) as typeof fetch,
      now: () => NOW,
    })
    expect(html.status).toBe(404)
  })

  it('answers 404 when the storage fetch throws', async () => {
    const response = await storefrontImageResponse(searchFor(), {
      resolveSignedUrl: async () => 'https://storage.test/object',
      fetchImpl: (async () => {
        throw new Error('network down')
      }) as typeof fetch,
      now: () => NOW,
    })
    expect(response.status).toBe(404)
  })
})
