# 06 — Storefront production readiness

**Date:** 20 November 2026 · **Status:** audit, no code change
**Companion:** [05 — gap register](05-eventsma-gap-register.md) lists *features*; this
file lists the *operational discipline* that separates "it renders" from "a paying tenant
can depend on it".

---

## 1. What "production" means here

A storefront is production-ready for a paying tenant when all five are true:

1. **It cannot leak another tenant's data** — including through preview links, sitemaps,
   canonical URLs and cached HTML.
2. **It fails visibly and recovers** — a broken page produces an alert, and a database
   outage does not turn every storefront into a bare 500.
3. **Its published state is the state the owner saw** — no draft leak, no silent rollback.
4. **Its performance is measured on the device the customer uses** — a mid-range Android on
   4G, not a desktop Lighthouse run.
5. **Someone can restore it** — backups exist, and a restore has actually been performed.

Today the repository satisfies (1) and (3) with recorded evidence, partially satisfies (2)
and (4), and does not satisfy (5).

---

## 2. Status board

Labels: **PASS** (evidence recorded), **PARTIAL**, **FAIL**, **NOT VERIFIED** (no run
available in this read-only audit).

| Area | Status | Evidence | Consequence |
|---|---|---|---|
| Build, typecheck | **PASS** (20 Nov) | `npx tsc --noEmit` 0 errors; `next build` exit 0 during the media and attribution slices | Baseline is sound; not re-run for this document |
| Draft/publish isolation | **PASS** | Integration tests + HTTP proof that a draft edit never reaches the public page | The core promise holds |
| Tenancy / RLS | **PASS** (20 Nov) | 64 tables, 123 policies, two-tenant isolation PASS (`db/setup.mjs`) | The strongest single guarantee we have |
| Preview token scoping | **PASS** | HMAC over org + slug + 7-day expiry; tampered token and wrong slug both 404; enquiry disabled | Safe to send to a client |
| Public page correctness | **PARTIAL** | English-only; pre-render list capped at 1,000 (`app/p/[slug]/page.tsx`) | Works, but not for all tenants or all visitors |
| Observability — errors | **PARTIAL** | `@sentry/nextjs` wired on server, edge and browser plus `onRequestError`; **no DSN set**, so events are dropped | A storefront 500 is still invisible until the DSN and one alert are proven |
| Observability — product | **PASS (first-party)** | Daily storefront view rollup + enquiry attribution (ES-03, §11 of [05](05-eventsma-gap-register.md)); no third-party analytics | The owner sees 7-day views and which section produced an enquiry |
| Observability — uptime | **NOT VERIFIED** | Plan is an external ping (docs/04 §7); none found in the checkout | Outage detection depends on the user |
| Performance measurement | **PARTIAL** | Budgets written (docs/04 §4.1); storefront-specific RUM absent | Budgets are aspirations, not gates |
| Backups and restore | **FAIL** | Plan is a nightly `pg_dump` + quarterly drill (docs/04 §8); no job in this checkout and no recorded drill | "We have files, not backups" — the document's own words |
| CI gates | **NOT STARTED** | No workflow under `.github/` in this checkout; RLS test is a manual command | Nothing stops a PR that breaks tenancy from merging |
| Migration discipline | **PARTIAL** | 0012–0014 and 0016 hand-written (0015 reserved); `drizzle-kit` meta drift documented; `setup.mjs` verifies schema | A deploy can reach an un-migrated database |
| Security headers | **PARTIAL** | `nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; no CSP in `next.config.ts` | Tenant content is our own, so CSP is defence-in-depth, not the main control |
| Enquiry abuse | **PARTIAL** | Honeypot + `rate_limits` table; no managed challenge | Acceptable at pilot volume, untested under attack |
| Media safety | **PARTIAL** | Server MIME/size validation, 400 KB limit, private bucket, signed proxy URLs | Upload validation was already sound; see the pipeline row |
| Storefront media pipeline | **PASS** (20 Nov) | `next/image` + AVIF/WebP; stable signed proxy; immutable cache; alt from owner content. End-to-end check returned `image/avif` | Not yet observed on a tenant page with a real photograph |
| Accessibility | **PARTIAL** | Builder targets are 44 px; reduced motion respected; tenant colour contrast unguarded | An owner can publish unreadable text (ES-13) |
| Consent / privacy | **NOT STARTED** | No consent tooling in dependencies | Blocks third-party analytics and a DPDP story |
| Localisation | **PARTIAL** | Engine + en/ta catalogues; audit 467 at 20 Nov; public page English-only | Tamil visitors get English (ES-05) |
| Cost / quota alerts | **NOT STARTED** | Limits documented in docs/04 §5; alerts are a weekly manual check | The first paid jump can arrive as a surprise |
| Runbook accuracy | **PARTIAL** | `docs/14` exists; `AGENTS.md` §8 lists `npm run test:rls`, `test:e2e` and `lint`, which are not scripts in `package.json` | An operator following the runbook hits a missing command |

---

## 3. Documented but not found in the product

This is the list the request asked for: things the docs describe as part of the system,
which a reader would not find in a running deployment.

| Claimed in docs | Reality in the repository | Where the claim lives |
|---|---|---|
| Sentry for browser/server errors | Wired 20 Nov (server, edge, browser, `onRequestError`, PII scrubber) but **disabled without a DSN**; no alert has been proven | docs/04 §7; docs/07 |
| Vercel Analytics / Speed Insights | No dependency; only a custom `/api/vitals` route | docs/04 §7 |
| Nightly backups + quarterly restore drill | No backup job or workflow in the checkout; no drill record | docs/04 §8 |
| External uptime ping | Nothing in the repo | docs/04 §7 |
| Cost alerts at 70% of a free tier | Manual weekly check | docs/04 §5 |
| WhatsApp Cloud API | `wa.me` deep links only (as decided, not a defect) | docs/04 §1 |
| Razorpay/online collection | Absent by decision (ADR-002) | docs/04 §1 |
| `npm run test:rls`, `npm run test:e2e`, `npm run lint` | Not defined in `package.json`; RLS runs via `TENANCY_LIVE_TEST=1 npx vitest run …` | AGENTS.md §8 |
| RLS enforced in CI | No CI workflow exists | AGENTS.md §4, docs/05 |

**ASSESSMENT.** None of these is a reason to distrust the storefront feature itself. They
are the reason it cannot yet be called *operated*. The gap register in 05 can be sequenced;
this list cannot be deferred past the first paying tenant.

---

## 4. Failure modes, and what actually happens

| Scenario | Current behaviour (from code/design) | Required before a paying tenant |
|---|---|---|
| Supabase unreachable | Cached ISR pages survive until revalidation; then the route throws and returns 500. No last-good HTML, no status page | Serve the last published snapshot (or a static fallback), alert within 5 min, publish an incident note |
| Storage/signed URL failure | Image fails; the page still renders. No placeholder logic | A branded placeholder; image failure must not change layout height |
| Deploy without migration | `getPublishedSnapshot` degrades to `null`/draft fallback; publish actions fail | A pre-deploy migration check that fails the deploy, not the owner's click |
| Publish fails mid-way | Pointer swap is one statement; previous version stays live by design | A test that kills the transaction and asserts the old version is still served |
| Never-published tenant | Phase 2 made this a 404 rather than a draft render | A regression test on every publish-path change |
| Preview token leaks | 7-day read-only draft, enquiry disabled, `noindex`; no per-token revoke | A documented rotation runbook (rotating the derived key invalidates all links) |
| 1,001st published tenant | Falls back to on-demand rendering (`dynamicParams = true`) | Measured 200 + correct caching; the cap removed or logged |
| Owner picks a low-contrast colour | Published as chosen; text may fail AA | Studio warning + a server-side guard (ES-13) |
| Enquiry flood | Honeypot, per-key DB counters; every attempt writes to Postgres | A managed challenge or edge rate limit before the DB (ES-19) |
| Unknown host on a future custom domain | Not applicable yet | A unique host→tenant constraint and a 404 for unclaimed hosts, never "first storefront" |
| Owner uploads a huge photo | Server rejects over 400 KB; accepted files are resized and format-negotiated by the media pipeline | Verify the pipeline with a real tenant photograph |
| Snapshot schema regression | Old snapshots are read with defaults by design (v1→v5) | One fixture test per schema version, kept forever |

---

## 5. Storefront service levels

These are the numbers a release should be judged against. They extend docs/04 §4.1 with
the storefront-specific paths; they are targets, not measurements.

| Metric | Target (p75, mobile) | Hard fail | Where measured |
|---|---|---|---|
| Public page availability | 99.9% / month | any 5xx burst > 1 min | uptime check + error monitor |
| TTFB, cached public page | < 200 ms | > 600 ms | Vercel/edge logs |
| LCP, storefront | < 2.0 s | > 2.8 s | field RUM on a throttled profile |
| INP | < 200 ms | > 500 ms | field RUM |
| CLS | < 0.05 | > 0.15 | field RUM |
| Enquiry POST | < 300 ms p95 | > 800 ms | route logs |
| Publish | < 800 ms p95 | > 2 s | action logs |
| Time to detect a storefront 5xx | < 5 min | > 30 min | alert rule |
| Restore from backup | < 4 h, verified row counts | never drilled | quarterly drill |

---

## 6. Go-live gate

A storefront may be called production for a paying tenant only when every line is true.

- [ ] Custom domain (or a written decision that slug-only is acceptable for this tenant)
- [ ] Unknown host returns 404, never another tenant
- [ ] Media pipeline verified on a real mid-range Android over 4G, not a desktop
- [ ] Error monitoring live, with phone numbers and emails scrubbed
- [x] First-party storefront views + enquiry attribution (ES-03, 20 November 2026)
- [ ] Consent for third-party analytics (ES-15), or a written decision to stay first-party
- [ ] Backup job runs nightly **and** a restore has been performed this quarter
- [ ] A migration check gates the deploy
- [ ] Two-tenant isolation, draft isolation and preview isolation tests are green in CI
- [ ] A non-developer has published, rolled back and restored a version unaided
- [ ] Colour contrast checked for the curated swatches and one arbitrary hex
- [ ] Tenant 404/500 behaviour decided (platform page or tenant page)
- [ ] Runbook commands exist and were executed as written
- [ ] Tamil storefront decision recorded (ship, or explicitly defer with a date)

---

## 7. What we cannot claim today

State these plainly in any demo or investor conversation:

- No uptime history; there is no external monitor.
- No field performance numbers for a storefront; the budgets are targets. The image
  pipeline is proven, but no tenant has uploaded a photo to measure yet.
- No restore has been proven; the backup plan is a document.
- No spam resistance beyond a pilot; the limit is a database row.
- No custom domain, so every storefront URL is ours, not the tenant's.
- No Tamil public page, although the catalogue exists.
- No error monitoring *yet*: the SDK is installed and scrubbing, but without a DSN it
  reports nothing and no alert exists.
- No consent story, so no third-party measurement can be added honestly yet.

---

## 8. Blockers, in the order they bite

1. **Set the Sentry DSN and prove one alert** (ES-04 is wired) — smallest, highest
   leverage; without it every other fix is unverifiable.
2. **Backup + one restore drill** — a single afternoon that converts a promise into a fact.
3. **Migration gate in the deploy** — prevents the failure mode most likely to take a
   storefront down on a Friday.
4. ~~Media pipeline~~ (ES-02 shipped 20 Nov) — remaining: confirm a real tenant photo at
   4G/mid-range Android and add owner-authored alt text.
5. **Custom domain** (ES-01) — needs DNS/Vercel access from the user; start the request now
   even if the code comes later.
6. **Consent + deeper reporting** (ES-15) — first-party measurement shipped 20 Nov; this
   is what turns product decisions from taste into evidence.
7. **CI for tenancy + publish isolation** — the tests exist; nothing runs them on a PR.
8. **Runbook correction** — either add the missing scripts or fix AGENTS §8; an operator
   should not discover drift during an incident.

---

## 9. Evidence and limits of this audit

**Read for this file:** `package.json`, `next.config.ts`, `vercel.json`,
`app/p/[slug]/page.tsx`, `app/(app)/storefront/actions.ts`,
`app/(app)/storefront/section-actions.ts`, `components/storefront/public-sections.tsx`,
and the storefront design records named in the source list below.

**Not done:** this audit ran no tests, inspected no deployment, used no browser session,
and attempted no backup or restore. The 20 November rows (build, tenancy, media,
attribution) are taken from the media and attribution slice records, not re-measured here.
A file-by-file audit of `.env`, Supabase policies and Vercel settings was out of scope.

**Searches that produced negative findings:** `posthog|gtag|@vercel/analytics`,
`consent|cookie` (only the i18n locale cookie), and `.github/**/*.yml` (no files).
`sentry` now finds the SDK and instrumentation added on 20 November, but still no DSN.

## 10. Sources

- `docs/04-architecture-cost-and-scale.md` — budgets, free-tier limits, monitoring plan, backup plan
- `docs/14-deployment-runbook.md` — deployment and recovery procedure
- `docs/designs/2026-11-17-production-storefront.md` §10–14 — publish model, isolation evidence, preview
- `docs/designs/2026-11-19-storefront-config-gap-analysis.md` §12 — SEO, preview, retention evidence
- `docs/designs/2026-11-20-next-development-plan.md` §1 — the "error monitoring: none" finding
- `docs/designs/2026-11-20-storefront-media-and-monitoring.md` — media and Sentry slice evidence
- [05 — gap register](05-eventsma-gap-register.md) — the feature gaps referenced by ID
