import { describe, expect, it } from 'vitest'
import { safeNext } from './app-url'

describe('safeNext', () => {
  it('keeps a same-origin path', () => {
    expect(safeNext('/events?view=calendar')).toBe('/events?view=calendar')
  })

  it('rejects protocol-relative and absolute URLs', () => {
    expect(safeNext('//evil.example')).toBe('/dashboard')
    expect(safeNext('https://evil.example')).toBe('/dashboard')
  })

  it('rejects backslash tricks', () => {
    expect(safeNext('/\\evil.example')).toBe('/dashboard')
  })

  it('uses the supplied fallback for missing values', () => {
    expect(safeNext(undefined, '/onboarding')).toBe('/onboarding')
  })

  it('bounds the path length', () => {
    expect(safeNext(`/${'a'.repeat(600)}`).length).toBe(500)
  })
})
