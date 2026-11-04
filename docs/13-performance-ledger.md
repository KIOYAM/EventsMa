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
| CDN in front of the app | Vercel's edge is the CDN once deployed; nothing is deployed yet | Deployment — no code change needed |
| Redis / shared cache | Single region, one Postgres; cache invalidation would be the new bug | p95 read latency above ~300 ms with indexes in place |
| Background queue for notifications and PDFs | Needs a worker and a durable queue; no mail provider is configured | First real client email or a PDF request that times out |
| OpenTelemetry traces | Needs an exporter endpoint and a collector | Second engineer, or the first incident that cannot be explained by logs |
| Connection pooling limits | `postgres` client is created per process; Supabase pooler handles the rest | More than ~50 concurrent server instances |
| Load balancing across regions | Single-region Supabase (Mumbai) by decision | Users outside India becoming material, or a latency SLA |
| Real-device performance testing | No device lab; skeletons and sizes are reasoned, not measured on a Redmi | Before the first paying customer, on one mid-range Android over 4G |
| Lighthouse budget in CI | No CI pipeline yet | First deployment pipeline |

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

These are targets, not results. Nothing in this build has been measured on a device or
against a seeded production-sized database, because neither exists yet.

---

## 4. Honest gaps

1. **No measurement has been taken.** The code is written to be fast; there is no
   before/after number, no Lighthouse run and no device test in this pass.
2. **No database exists,** so no index has been proven to be used and no query plan has
   been read. The new tables have no indexes beyond primary and unique keys.
3. **Demo mode is not representative.** It reads in-memory fixtures, so demo latency
   says nothing about Postgres latency.
4. **The vitals endpoint is a log line.** It proves collection works; it is not a
   monitoring system.

Fixing 1–3 requires the P0 infrastructure work in
[12 §3](12-prototype-page-parity.md): a Supabase project, migrations, and a seeded
two-tenant database to measure against.
