# Runtime tenancy — make RLS apply to request traffic

**Date:** 14 November 2026 · **Owner:** build agent · **Status:** shipped
**Related:** G1 in [next-build-handoff.md](next-build-handoff.md), `db/policies.sql`,
`lib/db/client.ts`, `lib/auth/session.ts`

## Problem

The application connects to Supabase Postgres with `DATABASE_URL` as the project
owner (`postgres`), and that role has `BYPASSRLS`. All 109 policies therefore only
run inside `db/setup.mjs`'s rolled-back test. Real request traffic is isolated
solely by hand-written `eq(table.orgId, ctx.orgId)` filters. One missing filter in
a future query is a cross-tenant read, and a wrong id in a write is a cross-tenant
write.

## Evidence

- `select current_user` → `postgres`; `pg_roles.rolbypassrls` → `true`.
- The same database under `set local role authenticated` +
  `request.jwt.claims` returns zero rows for a foreign organisation and rejects an
  insert whose `org_id` the caller does not belong to (probe, 14 Nov 2026).
- `db/setup.mjs` already proves the policies work, but no request path uses them.

## Options

1. **PostgREST / supabase-js for every query.** RLS would apply, but it abandons
   Drizzle, every existing query and the money engine. Rejected.
2. **Session-scoped `SET` on pooled connections.** The Supabase transaction pooler
   multiplexes connections, so a session setting can leak to another request.
   Rejected as unsafe.
3. **One transaction per unit of work, with `SET LOCAL ROLE authenticated` and the
   caller's claims, while keeping Drizzle.** All request queries run as an
   unprivileged role. Public/token routes and platform jobs stay on a deliberately
   named system connection.

## Decision

Option 3.

- `withWorkspace(ctx, fn)` opens one Postgres transaction, runs
  `set local role authenticated`, sets `request.jwt.claims = {sub, role, org_id}`,
  and executes `fn` with a Drizzle handle bound to that transaction. The handle is
  published through `AsyncLocalStorage` for the duration of `fn`, so existing data
  functions keep using `getDb()` unchanged.
- `getDb()` returns the scoped handle when a scope is active and **throws** when it
  is not. A forgotten wrapper fails closed instead of silently running as the owner.
- `getSystemDb()` is the new, explicit owner connection for paths that cannot have
  a member identity: login/membership lookup, onboarding (the membership does not
  exist yet), invitation acceptance, public storefront/quote/share-token routes,
  platform admin, health and sitemap.
- Pages scope their data-loading block; server actions scope their whole body.
  A `redirect()` thrown after a write commits before re-throwing, because Next's
  redirect is an exception. `notFound()` rolls back, which is harmless for reads.
- Every workspace read/write is now subject to the same policy the two-tenant test
  exercises. Employees remain read-only on commercial tables by policy, so the few
  actions that previously relied on owner bypass now return a permission error.

## Data change

No new tables. One policy pair added for `quote_counters`: the quote-number
sequence has `org_id` and is written inside quote creation, so owner/manager members
need scoped select/insert/update. It stays invisible to every other tenant.

## Server authority

`ctx.orgId`, `ctx.userId` and `ctx.role` come from the session and the membership
row, never from the client. The transaction role is fixed by code, not input.
Totals remain server-computed; this change does not touch pricing.

## Failure modes

| Failure | Behaviour |
|---|---|
| A query runs outside a scope | `getDb()` throws; the page/action fails rather than leaking |
| Claims are wrong | Policies return zero rows / reject the write |
| A redirect follows a write | Transaction commits, then redirect is re-thrown |
| A server error follows a write | Transaction rolls back |
| Demo mode | No transaction; fixtures short-circuit before `getDb()` |
| Public token route | System connection; token validation stays the authority |

## Performance impact

One transaction per page data-load or action instead of a bare pooled query. The
transaction holds a pooled connection for the duration of the data fetch, not the
React render (pages scope only the fetch). Pool `max: 3` and `max_pipeline: 1` are
unchanged. A page that issues parallel queries still serialises them, as today.

## Acceptance tests

- Unit: claim payload and scope detection do not depend on request input.
- Integration (live database, two committed temp tenants, cleaned up):
  - a scope for tenant A sees only A's rows from an **unfiltered** `select`;
  - a filtered read of B's id returns zero;
  - an insert carrying B's `org_id` is rejected by the policy;
  - A can insert its own row;
  - counts return to baseline after cleanup.
- `node db/setup.mjs`: table count, RLS coverage, two-tenant PASS.
- Live deployment: an authenticated page renders its own data and a request with a
  missing filter returns nothing.

## Out of scope

- Per-user RLS for platform admins (they use the system connection behind an email
  allow-list).
- RLS for `auth.*` schema tables owned by Supabase.
- Connection-per-tenant roles; tenants are identified by claims, not roles.
