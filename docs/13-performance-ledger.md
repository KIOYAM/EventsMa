# 13 — Performance and UX Ledger

**Question answered:** which speed practices are actually in the code, which are
configuration, and which cannot be claimed until infrastructure exists?

The rule for this document: a practice is **IMPLEMENTED** only if a reader can point at
the file that does it. Anything that needs a vendor, a paid plan or a running database
is **GATED**, with the threshold that would make it matter. No entry says "fast"
without a number or a named measurement.

---

## 1. Implemented in the code

| Practice | Where | What it actually does |
|---|---|---|
| Server rendering for every workspace screen | `app/(app)/**` | Data is read in server components; the browser receives HTML, not a fetch waterfall. |
| Streaming with route-level skeletons | `app/(app)/*/loading.tsx` | Each new list and detail route has a shape-matched skeleton, so navigation paints immediately instead of waiting on the query. |
| Parallel reads instead of request chains | `lib/db/events.ts` (six queries in `Promise.all`), `app/(app)/menu/card/page.tsx`, `/invoices/[id]` | Independent reads start together; page latency is the slowest query, not their sum. |
| No N+1 reads | `lib/db/events.ts` (correlated open-task count), `lib/db/menu.ts` (three queries stitched in memory), `lib/db/money.ts` (one UNION ledger) | List screens issue a fixed number of queries regardless of row count. |
| Column-level selects | `lib/db/money.ts`, `lib/db/events.ts`, `lib/db/settings.ts` | Queries name the columns they render; nothing ships `select *` for a card. |
| Server pagination | `lib/pagination.ts`, `components/pagination.tsx`, `/clients`, `/events`, `/invoices`, `/finance` | Fixed page size with a count query; the ledger never loads an unbounded table. |
| Debounced search | `components/debounced-search.tsx` | 300 ms debounce, then a router replace; typing does not fire a request per keystroke. |
| Cache-safe revalidation | Server actions call `revalidatePath` per affected route, including `/p` layout for public pages | A write invalidates exactly the screens that read it. |
| Conservative caching defaults | `next.config.ts` (`staleTimes`), `/p/[slug]` revalidate | Static shell cached; dynamic workspace data revalidated on navigation. |
| AVIF/WebP images | `next.config.ts` `images.formats`, `/menu` image quota | Modern formats first, long minimum cache TTL, 200 KB per file and 25 MB per org enforced at upload. |
| Self-hosted fonts | `app/layout.tsx` (`next/font`) | Two families, five weights total, `display: swap`, no request to Google at runtime. |
| Tree-shaken barrel imports | `next.config.ts` `optimizePackageImports` for `lucide-react`, `sonner` | A page imports the icons it uses, not the icon set. |
| Immutable static asset caching | `next.config.ts` headers | Hashed assets get a one-year immutable TTL. |
| Compression | `next.config.ts` `compress` | Enabled for dynamic responses. |
| Security headers | `next.config.ts` | `nosniff`, referrer policy, frame options, permissions policy. |
| Optimistic-feeling forms | Server actions with `redirect` + saved/error banners | The user gets a resolved state on the same screen; there is no client state to desync from the server total. |
| Field Web Vitals | `components/perf-monitor.tsx`, `/api/vitals` | LCP and CLS observed in production only, one beacon per page hide, values bounded server-side. No vendor SDK, no identifiers. |
| Money computed once, on the server | `lib/domain/pricing.ts`, `lib/db/money.ts` | Integer paise; the client preview is never the stored total. |

### Deliberate omissions

- **No chart library.** `/reports` draws bars with CSS from server aggregates; a
  50 KB chart bundle for six bars would be a net loss.
- **No client-side data library.** Nothing is fetched twice, because nothing is fetched
  in the browser.
- **No virtualised lists yet.** Pagination bounds every list to one page, so a
  virtualiser would add code without removing work. Revisit if a timeline view renders
  more than ~500 rows.

---

## 2. Gated on infrastructure

| Practice | Why it is not done | Threshold that forces it |
|---|---|---|
| RUM with percentiles and alerts | The beacon logs a line; there is no store or dashboard | First 100 real page views, or a complaint about slowness |
| Redis / shared cache | Single region, one Postgres; cache invalidation would be the new bug | p95 read latency above ~300 ms with indexes in place |
| Background queue for notifications and PDFs | Needs a worker and a durable queue; no mail provider is configured | First real client email or a PDF request that times out |
| OpenTelemetry traces | Needs an exporter endpoint and a collector | Second engineer, or the first incident that cannot be explained by logs |
| Connection pooling limits | One `postgres` client per process through the Supabase pooler | More than ~50 concurrent server instances |
| Load balancing across regions | Single-region Supabase (Mumbai) and `regions: ["bom1"]` by decision | Users outside India becoming material, or a latency SLA |
| Real-device performance testing | No device lab; skeletons and sizes are reasoned, not measured on a Redmi | Before the first paying customer, on one mid-range Android over 4G |
| Lighthouse budget in CI | No CI pipeline yet | First pull-request pipeline |

---

## 3. Budgets to hold the build to

| Metric | Budget | How it will be checked |
|---|---|---|
| First contentful paint (4G, mid-range Android) | ≤ 1.8 s | Field beacons, then a throttled device test |
| Largest contentful paint | ≤ 2.5 s at p75 | `/api/vitals` sample |
| Cumulative layout shift | ≤ 0.1 | `/api/vitals` sample |
| Interaction to next paint | ≤ 200 ms | Manual trace on the quote composer |
| Workspace list query | ≤ 50 ms at p95, 10k rows | `EXPLAIN ANALYZE` against a seeded database |
| Quote send | ≤ 90 s end to end for a 20-line quote | Timed walkthrough |

### Measured on 5 November 2026 (landing page)

| Check | Result | Scope |
|---|---|---|
| Production build | Passes; shared First Load JS 103 kB, largest page chunk 126 kB (`/quotes/new`), landing page chunk 1.94 kB | Local build |
| Lighthouse `/` mobile | Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.5s, LCP 2.1s, TBT 30ms, CLS 0, SI 1.5s | Throttled mobile, local production server |
| Lighthouse `/` desktop | Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.4s, LCP 0.5s, TBT 0ms, CLS 0 | Desktop, local production server |
| Responsive viewport matrix | No horizontal overflow at 320, 360, 375, 390, 414, 430, 600, 768, 820, 900, 1024, 1280, 1366, 1440, 1600, 1920 and 2560 px | Local production server, CDP device emulation |
| Lighthouse `/` (previous record) | Accessibility 95, best practices 100, SEO 100 | Desktop, local production server |
| Lighthouse `/login` | Accessibility 96, best practices 100, SEO 75 (auth pages are `noindex`, so SEO is expected to be low) | Desktop, local production server |
| Local Web Vitals | LCP ~124 ms, CLS ~0.0025 | Desktop, unthrottled, local production server |
| Database | 31 tables, all 31 with RLS, 59 policies; migration 0003 applied | Supabase Mumbai |
| Tenancy | Rolled-back two-tenant test passes: tenant B sees 0 rows of tenant A | `node db/setup.mjs` |
| Live health | `/api/health` returns `database: ok`, `auth: ok`, `mode: live` | Production |

These are targets, not results. The Lighthouse and Web Vitals numbers are desktop,
unthrottled and local; they do not replace a mid-range Android over 4G. No field RUM
percentiles or production-sized query plans have been measured yet.

---

## 4. Honest gaps

1. **No real-device measurement.** The Lighthouse and vitals figures are desktop and
   unthrottled. A mid-range Android over 4G is the gate before the first paying customer.
2. **No production-sized query plan.** Migration 0003 added trigram and receipt indexes,
   but no seeded 10k-row database has been run through `EXPLAIN ANALYZE`.
3. **No field percentiles.** The vitals endpoint is a log line; it proves collection
   works but has no store, percentile calculation or alert.
4. **No background queue.** Invitation, enquiry and receipt writes are synchronous, and
   the notification table has no worker draining it. PDFs are generated on request.
5. **No OpenTelemetry, Redis or cross-region load balancing.** The app is deliberately
   single-region (Mumbai) with Vercel's edge and the Supabase pooler.
6. **No performance budget in CI.** Every check in this ledger is currently run by hand.

Fixing 1–3 is the next performance work: a seeded two-tenant database, a throttled
device run, and a small RUM store. None of them require an architecture change.
