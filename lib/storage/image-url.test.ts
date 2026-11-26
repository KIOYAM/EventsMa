import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  imageWindowEnd,
  isImagePath,
  storefrontImageUrl,
  verifyImageRequest,
} from './image-url'

const ORG = '11111111-1111-4111-8111-111111111111'
const PATH = `${ORG}/storefront/22222222-2222-4222-8222-222222222222.webp`
const NOW = Date.UTC(2026, 10, 20, 12, 0, 0)
const WEEK = 7 * 24 * 60 * 60

function parts(url: string | null): URLSearchParams {
  expect(url).not.toBeNull()
  return new URL(url as string, 'https://example.test').searchParams
}

describe('storefront image URLs', () => {
  beforeEach(() => {
    process.env.STOREFRONT_IMAGE_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.STOREFRONT_IMAGE_SECRET
  })

  it('signs a tenant object path into the proxy route', () => {
    const url = storefrontImageUrl(PATH, NOW)
    expect(url?.startsWith('/api/storefront/image?')).toBe(true)
    const search = parts(url)
    expect(search.get('p')).toBe(PATH)
    expect(Number(search.get('e'))).toBe(imageWindowEnd(NOW))
    expect(search.get('s')?.length).toBeGreaterThan(20)
  })

  it('produces the same URL for every render inside the same week', () => {
    expect(storefrontImageUrl(PATH, NOW)).toBe(storefrontImageUrl(PATH, NOW + 60_000))
    expect(storefrontImageUrl(PATH, NOW)).not.toBe(storefrontImageUrl(PATH, NOW + WEEK * 1000))
  })

  it('verifies its own token', () => {
    const search = parts(storefrontImageUrl(PATH, NOW))
    expect(
      verifyImageRequest(search.get('p'), search.get('e'), search.get('s'), NOW + 1000),
    ).toBe(PATH)
  })

  it('rejects a tampered signature, a foreign path and an expired window', () => {
    const search = parts(storefrontImageUrl(PATH, NOW))
    const sig = search.get('s') ?? ''
    const tampered = `${sig.slice(0, -1)}${sig.endsWith('A') ? 'B' : 'A'}`

    expect(verifyImageRequest(search.get('p'), search.get('e'), tampered, NOW)).toBeNull()
    expect(
      verifyImageRequest(`${ORG}/storefront/other.webp`, search.get('e'), sig, NOW),
    ).toBeNull()
    expect(
      verifyImageRequest(search.get('p'), search.get('e'), sig, NOW + WEEK * 1000),
    ).toBeNull()
  })

  it('refuses paths that could escape the tenant prefix', () => {
    expect(isImagePath(PATH)).toBe(true)
    expect(isImagePath('../secret.webp')).toBe(false)
    expect(isImagePath(`${ORG}/../../secret.webp`)).toBe(false)
    expect(isImagePath(`/${ORG}/storefront/a.webp`)).toBe(false)
    expect(isImagePath('not-a-uuid/storefront/a.webp')).toBe(false)
    expect(isImagePath(`${ORG}\\storefront\\a.webp`)).toBe(false)
  })

  it('returns null when no signing key is configured', () => {
    delete process.env.STOREFRONT_IMAGE_SECRET
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(storefrontImageUrl(PATH, NOW)).toBeNull()
  })

  it('aligns the window to a seven-day boundary', () => {
    const end = imageWindowEnd(NOW)
    expect(end % WEEK).toBe(0)
    expect(end).toBeGreaterThan(Math.floor(NOW / 1000))
  })
})
