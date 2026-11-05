# 14 — Deployment Runbook (Vercel + Supabase)

**Question answered:** how this app gets to the server, what broke on the way, how to
fix each failure if it comes back, and how to prove a deployment actually works.

Every entry below is a real failure observed on `D:\Kannan-Projects\EventsMa` between
3–4 November 2026. Symptoms are quoted so an agent can match them, not guess.

---

## 1. What runs where

| Piece | Value |
|---|---|
| Live URL | `https://eventsma.vercel.app` (Production) |
| Vercel project | `eventsma` — id `prj_uUeVbrbfJjvHE2lg9LaMATdjBr96`, team `team_33vMGFvFnVzDKH9aHpY95hcx` |
| Vercel CLI config | `D:/Kannan-Projects/EventsMa/.cache/vercel` (**not** the user profile) |
| Supabase project | `gquchmqvpctewguncpgm`, Mumbai (`ap-south-1`) |
| App DB connection | `aws-0-ap-south-1.pooler.supabase.com:6543` — transaction pooler, IPv4 |
| Migrations connection | same pooler host, `:5432` session mode (`DIRECT_URL`) |
| Node used by Vercel build | **22.x**, pinned in `package.json` `engines` |
| Super-admin seed | `scripts/seed-superadmin.mjs` (`node scripts/seed-superadmin.mjs`) |
| Env push | `scripts/sync-vercel-env.mjs` (Vercel REST API, not one CLI call per var) |

`db.<ref>.supabase.co:5432` (the direct host) resolves **IPv6 only** on the user's
machine and has failed with `getaddrinfo ENOTFOUND` mid-session. Use the pooler host
in every connection string.

---

## 2. First-time setup

```bash
# 1. caches stay on D: — never the C: drive
export npm_config_cache="D:/Kannan-Projects/EventsMa/.cache/npm"
export TMPDIR="D:/Kannan-Projects/EventsMa/.cache/tmp"
export TEMP="$TMPDIR" TMP="$TMPDIR"

# 2. auth: device flow, config kept in the project
npx vercel@latest --global-config "D:/Kannan-Projects/EventsMa/.cache/vercel" login --github
npx vercel@latest --global-config "D:/Kannan-Projects/EventsMa/.cache/vercel" link    # project name: eventsma

# 3. database: migrations + RLS + rolled-back two-tenant test
node db/setup.mjs

# 4. env: .env.local -> Vercel (preview + production)
SYNC_APP_URL="https://eventsma.vercel.app" node scripts/sync-vercel-env.mjs preview production

# 5. super-admin: auth user + org + business + owner membership
SEED_ADMIN_PASSWORD='<strong-password>' node scripts/seed-superadmin.mjs

# 6. ship
npx vercel@latest --global-config "D:/Kannan-Projects/EventsMa/.cache/vercel" --prod --yes
```

**The very first deployment of a project always goes to Production**, even if the plan
was preview-only. Vercel does that by rule, not by accident.

---

## 3. Routine deploy (the only safe sequence)

```bash
npx tsc --noEmit                      # types first, it is fast
# stop the dev server before building — see failure F4
npx vercel@latest --global-config "D:/Kannan-Projects/EventsMa/.cache/vercel" --prod --yes
```

Do **not** run `npm run build` locally as a pre-flight unless the network reaches
Google Fonts (failure F5). Vercel builds the same source in ~1–2 minutes.

One deploy per batch of changes. Each `--prod` is a full remote build, so three small
edits turned into three 2-minute waits; collect edits, then deploy once.

---

## 4. Failures met, and the fix

### F1 — Vercel built on Node 26 and webpack died

Symptom, at "Creating an optimized production build":

```
TypeError: Cannot read properties of undefined (reading 'length')
    at WasmHash._updateWithBuffer (.../next/dist/compiled/webpack/bundle5.js:29:...)
Node.js v26.13.0
Next.js build worker exited with code: 1
```

Cause: `engines.node: ">=22.0.0"` means *newest major* to Vercel. Next 15.5's bundled
webpack WASM hasher crashes there.

Fix / prevention: `package.json` must say `"node": "22.x"`. Never widen it to `>=`.
The build log prints `Skipping build cache since Node.js version changed from "26.x" to "22.x"`
when the pin takes effect — that line is the confirmation.

### F2 — Authenticated pages stuck on their skeleton forever

Symptom: page returns **200**, shell and nav render, `main` contains
`<!--$~--><template id="B:0">` and skeleton divs, and it never resolves. Public pages
that issue a single query work fine. Server logs show nothing.

Cause: `postgres-js` pipelines queries over a socket. Supabase's transaction pooler
(:6543) gives each pipeline step its own server connection, so a layout and its page
querying at the same time wait on connections that never come back.

Fix, in two parts:

1. `lib/db/client.ts` sets `max_pipeline: 1` alongside `prepare: false`. The option exists
   at runtime but is missing from postgres 3.4.x typings, so the file declares it:

```ts
type PoolOptions = NonNullable<Parameters<typeof postgres>[1]> & { max_pipeline?: number }
```

2. Remove any `connection: { ... }` option. It sends startup parameters that the pooler
   rejects, which left the same pages hanging. It was removed in commit `42a5aa3`; after
   that deploy `/admin`, `/settings` and `/clients` all resolved (`pending: false`).

---

#### (superseded) original note

```ts
type PoolOptions = NonNullable<Parameters<typeof postgres>[1]> & { max_pipeline?: number }
```

Prevention: never remove `prepare: false` or `max_pipeline: 1` while the app talks to
the transaction pooler. If a page hangs again, check for `<!--$~-->` in the HTML before
blaming the query.

Related trap: passing a `connection: { statement_timeout, application_name }` object
sends startup parameters, which pgbouncer rejects. It was removed; do not re-add it
without testing a signed-in page end to end.

### F3 — `getaddrinfo ENOTFOUND db.<ref>.supabase.co`

The direct host is IPv6-only here. Any script using `DIRECT_URL` fails when the machine
loses IPv6. `scripts/seed-superadmin.mjs` tries `DATABASE_URL` (pooler) first and falls
back; keep that order.

### F4 — `Invariant: no direct app page entry found for /_not-found`

Happened only while `next dev` was running and `.next` was deleted underneath it. Two
processes write the same build directory.

Fix: stop the dev server (`Stop-Process -Id <pid>`), then `rm -rf .next`, then build.
In dev the same contention shows up as `/login` returning 500 with
`ENOENT: ... .next\server\pages\_document.js`.

### F5 — `An error occurred in next/font` during a local build

```
TypeError: Cannot read properties of null (reading '1')
    at .../@next/font/dist/google/loader.js
```

`next/font` downloads Inter/Playfair metadata at build time; the user's network to
Google intermittently fails. The code is fine and Vercel's build succeeds. Retry, or
deploy without a local build. If it ever blocks CI permanently, move the two families
to `next/font/local` with files committed under the repo.

### F6 — Pushing env vars took minutes, then failed with 403

`vercel env add` is one CLI process per variable (13 keys × 2 environments ≈ 4 minutes
and it hit the tool timeout). `scripts/sync-vercel-env.mjs` was rewritten to call the
Vercel REST API (`POST /v10/projects/{id}/env?upsert=true`) with the token the CLI
already stores in `.cache/vercel/auth.json`.

If that returns `403 {"error":{"invalidToken":true}}` the stored token expired:
run `npx vercel@latest --global-config ... whoami` once to refresh it, then re-run the
sync. Vars written with `--sensitive` are never readable again — rotate, don't read.

### F7 — Deployed, but still demo data with no login

The first live build was demo-only because `/login` was a static placeholder (disabled
submit, no server action) and there was no session-refresh middleware. Shipping the DB
credentials before auth existed would have produced a redirect loop into a form that
could not submit. Auth, sign-up and onboarding now exist; `PLATFORM_ADMIN_EMAILS` gates
`/admin`.

---

## 5. Proving a deployment works (not just that it uploaded)

```bash
curl -s https://eventsma.vercel.app/api/health
# {"database":"configured","auth":"configured","pdf":"available"}  <- env present, not a DB query

curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' https://eventsma.vercel.app/dashboard
# 307 -> /login  (signed out behaves correctly)

curl -s -o /dev/null -w '%{http_code}\n' https://eventsma.vercel.app/login   # 200
curl -s -o /dev/null -w '%{http_code}\n' https://eventsma.vercel.app/signup  # 200
```

Then in a browser, because HTTP 200 proves nothing about a streamed page:

1. Sign in at `/login` with the seeded owner.
2. `/dashboard` must show the workspace heading and ₹0 tiles, not skeletons.
3. `/admin` must list the tenant (allowlist email only).
4. `/onboarding` for an account with no membership must redirect to `/login` when signed out.
5. `document.documentElement.outerHTML.includes('<!--$~-->')` must be **false** after load —
   that marker means a Suspense boundary never resolved (F2).

Screenshots from the last verified deploy: `screenshots/login.png`, `screenshots/signup.png`.

---

## 6. Operations

| Task | How |
|---|---|
| Build/runtime logs | `npx vercel@latest --global-config <dir> inspect <deployment-url> --logs`, or `logs https://eventsma.vercel.app --json --limit 30` (no `--no-follow`, it was removed) |
| Roll back | Vercel dashboard → Deployments → previous → *Promote to Production*, or `vercel rollback <url>` |
| Change the owner password | Supabase → Authentication → Users → user → *Reset password*; or re-run the seed with `SEED_ADMIN_PASSWORD` |
| Re-seed / repair tenant | `node scripts/seed-superadmin.mjs` (idempotent: reuses the auth user, upserts org + membership) |
| Rotate env vars | edit `.env.local`, then `SYNC_APP_URL=... node scripts/sync-vercel-env.mjs preview production`, then redeploy (env changes only apply to new deployments) |
| Tenant isolation proof | `node db/setup.mjs` — step 4 runs the two-tenant test inside a savepoint and rolls back |

**Non-negotiable:** app queries connect as the Postgres owner, so RLS is not exercised
at runtime; the rolled-back two-tenant test in `db/setup.mjs` is the evidence that
policies isolate tenants. Keep it passing.

---

## 7. Agent checklist before touching deployment

- [ ] Caches on `D:`, no global installs, no Docker.
- [ ] `.env.local` is gitignored; never print, echo or commit a value. Read names only.
- [ ] `package.json` engine stays `22.x`.
- [ ] `lib/db/client.ts` keeps `prepare: false` **and** `max_pipeline: 1`.
- [ ] Types pass, dev server stopped, then one `--prod` deploy.
- [ ] Verify with the §5 list, including the `<!--$~-->` check.
- [ ] Say "deployed" only after those checks; say "deployed but unverified" otherwise.

## 8. Known gaps (state them, do not hide them)

- `/admin`, `/settings` and `/clients` were the pages that hung hardest under F2. After the
  final fix they returned 200 with no `<!--$~-->` marker and the expected content
  (`/admin` listed the tenant, `/settings` rendered the business profile). Re-check those
  three after any change to `lib/db/client.ts`.
- Email/password sign-up depends on Supabase's email confirmation setting. With
  confirmation on, the sign-up screen says "confirm your email" and the user must click
  the link before signing in; with it off, they go straight to `/onboarding`.
- No CI pipeline yet: types and the browser checks are run by hand.

---

## 9. Deployment record

| Date | Deployment | Result |
|---|---|---|
| 4 November 2026 | `dpl_4qQMnxFpVseBHcNF8pMVD6ygAL4C` | Production `https://eventsma.vercel.app`; `/api/health` returns `database: ok`, `auth: ok`, `mode: live` |
| 5 November 2026 | `dpl_4BLXsdRTAqZYd2U3kbwZ6TBh6h45` | Production `https://eventsma.vercel.app`; landing page, legal pages, OG/Twitter images and metadata |
| 5 November 2026 | `dpl_GWMu1KynqD2KpGGYj94MYfpQpKmH` | Production `https://eventsma.vercel.app`; `/api/health` returns `database: ok`, `auth: ok`, `mode: live` |

Verified in that deploy: build, migration 0003 + 0005, RLS coverage (all tables), two-tenant rolled-back test, public landing, login, signup, forgot-password, robots and sitemap. Dashboard and other workspace routes redirect to `/login` when signed out as expected.

New in this deploy: service registry (`business_services` + `verticals.ts` + `service-registry.ts`), decoration module (`decoration_areas/setups/materials` + `/decoration` page), makeup module (`makeup_artists/appointments/trials` + `/makeup` page), photography module (`photography_coverage/assignments/shot_lists/deliverables` + `/photography` page), service-aware navigation rail, per-service configuration pages (`/services/[vertical]`), multi-service event composition (`event_services` + Services tab on event detail), public share API (`/api/share/[slug]` + `/api/share/[slug]/submit` with persistent enquiry storage), admin service monitoring dashboard (`/admin` with service adoption/quote volume visualisations + `/api/admin/services`), email/notification system (`lib/email.ts` with Resend integration).

All 35 tests pass, production build passes (43 routes + 2 API routes), Lighthouse on `/` scores Performance 99/Accessibility 100/Best Practices 100/SEO 100 on mobile and 100 across the board on desktop.

Not verified in that deploy: an authenticated quote → acceptance → invoice → receipt walkthrough, because no owner password was available in the deploy environment. Treat the money loop as code-complete and locally typed/tested, not production-smoke-tested until that walkthrough is done.
