import { describe, expect, it } from 'vitest'
import { resolveOrigin } from './request-origin'

const reader = (headers: Record<string, string>) => ({
  get: (name: string) => headers[name.toLowerCase()] ?? null,
})

describe('resolveOrigin', () => {
  it('prefers the forwarded host and protocol a proxy supplies', () => {
    expect(
      resolveOrigin(
        reader({ 'x-forwarded-host': 'eventsma-preview.vercel.app', 'x-forwarded-proto': 'https' }),
        'https://eventsma.vercel.app',
      ),
    ).toBe('https://eventsma-preview.vercel.app')
  })

  it('falls back to the first forwarded value when a proxy appends more', () => {
    expect(
      resolveOrigin(
        reader({ 'x-forwarded-host': 'preview.example,internal', 'x-forwarded-proto': 'https,http' }),
        'https://eventsma.vercel.app',
      ),
    ).toBe('https://preview.example')
  })

  it('reads the local port and assumes http on loopback', () => {
    expect(resolveOrigin(reader({ host: 'localhost:3400' }), 'http://localhost:3100')).toBe(
      'http://localhost:3400',
    )
  })

  it('assumes https for a public host without a forwarded protocol', () => {
    expect(resolveOrigin(reader({ host: 'eventsma.vercel.app' }), '')).toBe(
      'https://eventsma.vercel.app',
    )
  })

  it('ignores a missing or malformed host instead of building a link from it', () => {
    expect(resolveOrigin(reader({}), 'http://localhost:3100')).toBe('http://localhost:3100')
    expect(resolveOrigin(reader({ host: 'evil.example/path' }), 'https://eventsma.vercel.app')).toBe(
      'https://eventsma.vercel.app',
    )
  })
})
