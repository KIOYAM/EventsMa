import { describe, expect, it } from 'vitest'
import { getDb } from './client'

/**
 * The fail-closed half of runtime tenancy needs no database: a query with no
 * scope must throw instead of falling back to the owner connection.
 */
describe('getDb outside a workspace scope', () => {
  it('throws instead of running as the table owner', () => {
    expect(() => getDb()).toThrow(/outside a workspace scope/)
  })
})
