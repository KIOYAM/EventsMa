import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * The Drizzle handle for the current `withWorkspace` unit of work.
 *
 * Kept in its own dependency-free module so `client.ts` can read the store
 * without importing the transaction wrapper (which imports `client.ts`).
 * The value is typed at the read site; the store itself must not assume a
 * schema shape or it becomes a second source of truth for the database type.
 */
const storage = new AsyncLocalStorage<unknown>()

export function runWithScopedDb<T>(db: unknown, fn: () => T): T {
  return storage.run(db, fn)
}

export function currentScopedDb<T>(): T | undefined {
  return storage.getStore() as T | undefined
}

/** True when code is executing inside a scoped transaction. Used by tests. */
export function hasScopedDb(): boolean {
  return storage.getStore() !== undefined
}
