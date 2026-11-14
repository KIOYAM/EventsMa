import { sql } from 'drizzle-orm'
import { getSystemDb, isDatabaseConfigured, type EventsMaDatabase } from './client'
import { runWithScopedDb } from './workspace-context'

/**
 * The identity a unit of work runs under. Structurally compatible with
 * `WorkspaceContext`, kept narrow so the database layer does not import
 * `next/headers` through the session module.
 */
export interface WorkspaceIdentity {
  userId: string
  orgId: string
  role: 'owner' | 'manager' | 'employee'
  demo: boolean
}

/** Next's redirect is an exception; the write before it must still commit. */
function isRedirectSignal(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const digest = (error as { digest?: unknown }).digest
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')
}

function claimsFor(identity: WorkspaceIdentity): string {
  return JSON.stringify({
    sub: identity.userId,
    role: 'authenticated',
    org_id: identity.orgId,
  })
}

/**
 * Run a read or write as the `authenticated` Postgres role with this member's
 * claims, inside one transaction. Drizzle keeps working unchanged: the scoped
 * handle is published for the duration of `fn`, so `getDb()` resolves to it.
 *
 * The transaction is the unit of work. Pages should scope only the data fetch,
 * not the render; actions should scope their whole body.
 *
 * `redirect()` is thrown by Next, not returned. Catching it here lets the
 * transaction commit and re-throws afterwards, so a successful write followed
 * by `redirect('/events')` is not rolled back.
 */
export async function withWorkspace<T>(
  identity: WorkspaceIdentity,
  fn: () => Promise<T>,
): Promise<T> {
  if (identity.demo || !isDatabaseConfigured()) return fn()

  let redirectSignal: unknown

  const result = await getSystemDb().transaction(async (tx) => {
    // Static SQL: the role is fixed by code, never by request input. LOCAL
    // means it is reset when this transaction ends, even on a pooled server.
    await tx.execute(sql.raw('set local role authenticated'))
    await tx.execute(sql`select set_config('request.jwt.claims', ${claimsFor(identity)}, true)`)

    // The transaction handle supports the same query builder surface the app
    // uses. Casting through unknown keeps one database type for data modules.
    const db = tx as unknown as EventsMaDatabase

    try {
      return await runWithScopedDb(db, fn)
    } catch (error) {
      if (isRedirectSignal(error)) {
        redirectSignal = error
        return undefined as T
      }
      throw error
    }
  })

  if (redirectSignal) throw redirectSignal
  return result
}
