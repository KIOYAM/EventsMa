import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPreviewToken, verifyPreviewToken } from './storefront-preview-token'

const KEY = 'test-service-role-key'
const ORG = '00000000-0000-4000-8000-000000000001'
let previous: string | undefined

beforeEach(() => {
  previous = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY = KEY
})

afterEach(() => {
  if (previous === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = previous
})

describe('createPreviewToken', () => {
  it('round-trips the claims it signed', () => {
    const token = createPreviewToken({ orgId: ORG, slug: 'kannan-events' })
    expect(token).toBeTruthy()
    expect(verifyPreviewToken(token as string)).toEqual({
      orgId: ORG,
      slug: 'kannan-events',
      exp: expect.any(Number),
    })
  })

  it('produces the same token twice on the same UTC day, so a copied link does not move', () => {
    const now = new Date('2026-11-19T04:00:00Z')
    const first = createPreviewToken({ orgId: ORG, slug: 'kannan-events', now })
    const later = createPreviewToken({
      orgId: ORG,
      slug: 'kannan-events',
      now: new Date('2026-11-19T20:00:00Z'),
    })
    expect(first).toBe(later)
  })

  it('refuses to sign when no service key is configured', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(createPreviewToken({ orgId: ORG, slug: 'kannan-events' })).toBeNull()
  })
})

describe('verifyPreviewToken', () => {
  it('rejects an expired token', () => {
    const token = createPreviewToken({
      orgId: ORG,
      slug: 'kannan-events',
      now: new Date('2020-01-01T00:00:00Z'),
    })
    expect(token).toBeTruthy()
    expect(verifyPreviewToken(token as string)).toBeNull()
  })

  it('rejects a token signed with another key', () => {
    const token = createPreviewToken({ orgId: ORG, slug: 'kannan-events' }) as string
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'rotated-key'
    expect(verifyPreviewToken(token)).toBeNull()
  })

  it('rejects a tampered payload even with the original signature', () => {
    const token = createPreviewToken({ orgId: ORG, slug: 'kannan-events' }) as string
    const [payload, signature] = token.split('.')
    const forged = Buffer.from(
      JSON.stringify({
        orgId: '00000000-0000-4000-8000-000000000002',
        slug: 'kannan-events',
        exp: Math.floor(Date.now() / 1000) + 86_400,
      }),
    ).toString('base64url')
    expect(verifyPreviewToken(`${forged}.${signature}`)).toBeNull()
    // The untouched token still verifies, so the test is about the mismatch, not
    // about an invalid original.
    expect(verifyPreviewToken(`${payload}.${signature}`)).not.toBeNull()
  })

  it('rejects malformed input instead of throwing', () => {
    expect(verifyPreviewToken('')).toBeNull()
    expect(verifyPreviewToken('not-a-token')).toBeNull()
    expect(verifyPreviewToken('a.b.c')).toBeNull()
  })

  it('rejects an oversized token without hashing it', () => {
    expect(verifyPreviewToken(`${'a'.repeat(600)}.b`)).toBeNull()
  })
})
