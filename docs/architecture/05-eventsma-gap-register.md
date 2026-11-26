# 05 — EventsMa storefront gap register

**Date:** 20 November 2026 · **Status:** audit, no code change
**Inputs:** [01](01-platform-shopify.md)–[04](04-shared-patterns.md), the storefront design
record in `docs/designs/`, and the files named in each row.
**Companion:** [06 — production readiness](06-production-readiness.md) covers the
non-feature gaps (monitoring, backups, failure modes).

---

## 1. How to read this

| Severity | Meaning |
|---|---|
| **P0** | An owner or a visitor notices it in the first hour, or it blocks a paying tenant from trusting the page |
| **P1** | A structural limit that will force a rewrite or a workaround at the next ten tenants |
| **P2** | Real parity, but no tenant is blocked by its absence today |
| **P3** | Deferred; record it so it is not rediscovered as urgent |

**Effort:** S ≈ a day, M ≈ a slice (2–4 days), L ≈ a design doc plus a migration.

**Proof** is the one thing that must be true to close the row. It is deliberately a
user-visible or measured outcome, not "code merged".

---

## 2. What exists today (verified in this repository)

| Capability | State | Evidence |
|---|---|---|
| Section composition: order, visibility, heading override, hero photo | **Implemented** | `lib/domain/storefront.ts` `SECTION_KEYS` (10), `lib/db/storefront.ts` `moveStorefrontSection` |
| Three layouts, brand colour, two wordmark fonts, logo | **Implemented** | `STOREFRONT_THEMES`, `BRAND_FONTS`, `BRAND_COLOURS` |
| Per-section content: FAQ, team, testimonials | **Implemented** | `sanitiseSectionConfig`, 12-item cap |
| Draft ≠ published: immutable snapshots, pointer swap, rollback, retention 20 | **Implemented** | `storefront_versions`, `lib/db/storefronts.ts` |
| Owner preview + signed 7-day client preview, enquiry disabled in preview | **Implemented** | `app/p/[slug]/preview/**`, `lib/security/storefront-preview-token.ts` |
| SEO: title/description overrides, `noindex`, canonical, OG/Twitter | **Implemented** | `lib/domain/storefront-seo.ts`, `generateMetadata` |
| Structured data + per-tenant social card + sitemap with catalogue URLs | **Implemented** | `LocalBusiness` JSON-LD, `/p/[slug]/opengraph-image`, `app/sitemap.ts` |
| Enquiry: server-resolved org, rate-limited, honeypot, phone-deduped client, queued notification | **Implemented** | `enquiries`, `clients`, `rate_limits`, `notifications` |
| Tenancy: `org_id` + RLS on every table, two-tenant isolation test | **Implemented** (PASS 20 Nov) | 64 tables, 123 policies; `db/policies.sql`, `db/setup.mjs` |
| Service entitlement vs storefront visibility | **Implemented** | `storefront_visible`, snapshot v3 |
| Media: hero, logo, one cover per work item | **Implemented** (ES-02, §10) | signed proxy + `next/image` in `components/storefront/public-sections.tsx` |
| Public page localisation | **Partial** — engine + Tamil copy, page is English-only | `2026-11-17-production-storefront.md` §11 |
| Custom domain | **Not implemented** | slug-only routing |
| Multi-page, navigation, footer editor | **Not implemented** | one page + catalogue detail routes |
| Section instances / blocks | **Not implemented** | `unique (org_id, key)` |
| Storefront analytics and lead attribution | **Implemented** — daily rollup, no cookies | `storefront_views`, `enquiries` (§11) |
| Consent surface | **Not implemented** | ES-15 |
| Scheduled publishing, password gate, version compare | **Not implemented** | — |
| Booking with live availability | **Blocked** | no availability model |
| Cart, checkout, accounts | **Deliberately absent** | ADR-002, AGENTS §3 |

---

## 3. P0 — trust and the first hour

| ID | Gap | Platform precedent | Why it matters here | Effort | Proof |
|---|---|---|---|---|---|
| **ES-01** | No custom domain | All six support custom domains | A business that owns `kannanevents.in` still sends `…/p/kannan-events`. In a WhatsApp forward that reads as a microsite, not a website. | M | `kannanevents.in` serves that tenant over HTTPS; an unclaimed host returns 404, never another tenant |
| **ES-02** | Media was a raw file, not a pipeline — **shipped 20 Nov (§10)** | Shopify `image_url`; Wix auto-resize/WebP/`fetchpriority` | Hero was `<img alt="" src>` with no dimensions or `srcset`; AVIF/WebP configured in `next.config.ts` was bypassed. That cost LCP and CLS on the exact device the product targets. | M | Hero and portfolio images serve responsive AVIF/WebP with width/height and real alt text; p75 mobile LCP < 2.5 s, CLS < 0.05 |
| **ES-03** | No storefront analytics or lead attribution — **shipped 20 Nov (§11)** | Platform-level analytics installs | The owner could not answer "how many people saw my page" or "which section produced this enquiry". Enquiries carried only `source`. | M | Every storefront enquiry records source, landing section, referrer and UTM; the owner sees 7-day views and enquiries per section |
| **ES-04** | No error monitoring in the deployment — **wired 20 Nov, inert without a DSN** | Sentry in `docs/04`; SDK installed 20 Nov | A broken storefront is still invisible until a client complains, because no event leaves the app. Three 500s in an earlier track went unseen (`2026-11-20-next-development-plan.md`). | S | A forced 500 on `/p/[slug]` produces an alert within 5 minutes with route and org, PII scrubbed |
| **ES-05** | Tamil visitors get an English page | Shopify locale paths + auto hreflang; Catalyst `[locale]` | Tamil copy exists and is unused. For a Kerala/Tamil Nadu pilot this is a product gap, not a nice-to-have. | L | `/p/[slug]` renders `ta` when asked, with `lang="ta"`, hreflang pairs, and no de-prerender of the English default |

**Shipped 20 November 2026: ES-02, ES-03 and ES-04.** Media and attribution are
implemented; ES-04 stays *inert* until a Sentry DSN exists, so its acceptance proof is not
complete.
See [the media/monitoring note](../designs/2026-11-20-storefront-media-and-monitoring.md),
§10 and §11.

---

## 4. P1 — structural limits

| ID | Gap | Platform precedent | Why it matters here | Effort | Proof |
|---|---|---|---|---|---|
| **ES-06** | Sections are types, not instances | Shopify 25 sections × 50 blocks | No second gallery, no "Awards", no custom text band. Every new request becomes a code change. | L | An owner adds two galleries and a custom text block, reorders them, and publishes without a deploy; per-tenant block cap enforced |
| **ES-07** | One config struct for all section types | Shopify schema per section | Adding a section means editing the union, sanitiser, snapshot version and builder — which is why the catalogue stopped at ten. | M | A section type declares its settings schema in one registry; snapshot v6 validates it; old snapshots still render |
| **ES-08** | Design tokens are thin | Wix palettes/text themes; Shopify colour schemes | One colour and two fonts cannot express "accent", "density", "hero variant", "section background". Owners compare against Wix and see a template. | M | Secondary/accent colour, heading/body pairing, density, per-section background and alignment, all contrast-checked |
| **ES-09** | Versions are write-only | Shopify/Wix history with restore | Restore exists, but no compare and no "open this version". An owner cannot see what changed between v3 and v4. | M | Any two versions can be compared field-by-field and opened in preview without publishing |
| **ES-10** | No scheduled publish | Shopify Rollouts; Wix Automations can schedule a publish | An event business wants "go live Monday 9am" without logging in on Monday. | S | A version can be queued with a timestamp; it becomes the pointer without a session |
| **ES-11** | No password/preview gate | Storefront password (Shopify), site password (Wix) | A half-built page can only be public or hidden. A signed preview link covers one client, not "everyone with the password". | S | Password gate blocks the public route; the preview link still works; unpublish still 404s |
| **ES-12** | No navigation or extra pages | Wix/Webflow page trees; Shopify menus | Catalogue detail pages exist but there is no way to add "Awards", "Locations" or per-tenant policies, and no nav/footer editor. | L | Owner adds/hides/reorders pages and menu items; every page renders from the same published snapshot |
| **ES-13** | Brand colour has no contrast guard | Platform palettes are curated | The owner can pick any hex; pale brand colours rely on `color-mix` for button text and are not audited. WCAG AA is a stated non-negotiable. | S | A colour failing 4.5:1 is warned against in the studio and never ships unreadable text on a published page |
| **ES-14** | Pre-render list silently caps at 1,000 | — | `generateStaticParams` uses `limit(1000)` with no signal. Beyond that, pages fall back to on-demand (`dynamicParams = true`), which is correct but unmeasured. | S | The 1,001st published tenant returns 200 and a correct cached page; the cap is either removed or logged |

---

## 5. P2 — parity that can wait

| ID | Gap | Precedent | Note |
|---|---|---|---|
| **ES-15** | No consent surface | Platform consent/pixel installs | Needed before any third-party tag is added, and before India DPDP work. |
| **ES-16** | No experiments | Both now have limited native tests (Shopify Rollouts, Wix Test Sites) | Natural after ES-03; must not make the public page dynamic. |
| **ES-17** | No per-tenant performance measurement | Platform RUM | We have platform vitals, not "this tenant's page is slow because of this image". |
| **ES-18** | Structured data stops at `LocalBusiness` | Shopify themes emit product/breadcrumb/FAQ schema | Add `Service`, `FAQPage`, `BreadcrumbList`; cheap and additive. |
| **ES-19** | Enquiry abuse protection is honeypot + DB rate limit | Managed bot challenges | Fine at pilot volume; revisit at the first spam wave, not before. |
| **ES-20** | Tenant images still on Supabase Storage | R2 at the egress trigger (`docs/10`) | Infrastructure decision with a numeric trigger; not a storefront feature. |
| **ES-21** | No storefront search or filters | PLP search/facets | Only matters when a catalogue is large enough that scrolling fails. |
| **ES-22** | No per-tenant policy pages | Footer policy links | Ties to ES-12; a business needs its own cancellation/terms text. |

Experiment precedents: [Shopify Rollouts](https://help.shopify.com/en/manual/markets/rollouts)
supports A/B tests on Grow and above; [Wix Test Sites](https://support.wix.com/en/article/about-test-sites)
exposes one alternate site to a traffic percentage. Both are thinner than a section-level
test, and neither makes this row urgent. ES-10's scheduling precedent is separate: Wix
[Automations](https://support.wix.com/en/article/wix-automations-scheduling-your-site-to-publish)
can publish a site at a scheduled time.

---

## 6. Deliberately not gaps

Recorded so a future agent does not "fix" them.

| Not building | Why |
|---|---|
| Cart, checkout, online payment | Payments are manual by product decision (ADR-002, AGENTS §3). A quote is the transaction; the receipt is recorded by hand. |
| Marketplace / discovery | Conflicts with the white-label promise (docs/11 §3; AGENTS §5). |
| Reviews with ratings and moderation | A testimonial is a quote the owner chose to publish; a rating system needs moderation, aggregates and a schema we do not have. |
| Booking with live availability | Blocked on an availability/resource model nobody has defined (`2026-11-17-production-storefront.md` §8). Ship "request availability" only. |
| App ecosystem, custom CSS/HTML per tenant, third-party scripts | XSS surface, support burden, and no free-tier story. |
| Free-form drag-and-drop canvas | The constraint is the product; instances of known types (ES-06) is the correct escape valve. |

ERP modules (recipe/yield costing, inventory, staff shifts, vendor ledgers, P&L) and AI
capture are already deferred in [docs/11 §3](../11-competitive-analysis-and-gaps.md). They
are not storefront gaps, so they are linked rather than repeated here.

---

## 7. The five that mattered most

The slice-1 order this register argued for, with status:

1. **ES-01 custom domain** — the credibility ceiling, and the only one that needs the user
   to grant DNS/Vercel access.
2. **ES-02 media pipeline** — shipped 20 Nov (see §10); still to verify against a real
   tenant photograph on a mid-range phone.
3. **ES-03 analytics + attribution** — shipped 20 Nov (see §11); without it the owner
   could not tell whether the page works, and every later decision (sections, offers,
   A/B) was opinion.
4. **ES-04 error monitoring** — wired 20 Nov; a storefront that fails silently is worse
   than a slower one, but it is only solved once the DSN and one real alert exist (§10).
5. **ES-06/ES-07 section instances + typed settings** — the structural change that stops
   the ten-section ceiling from becoming the product's ceiling.

**ES-05 (Tamil public page)** is sixth only because it needs a product decision about URL
shape (`/p/[slug]/ta` vs a locale segment) before code; that decision is cheaper to make
now than after ES-12.

---

## 8. Proposed sequence

| Slice | Contents | Why this order |
|---|---|---|
| **1 — Trust** | ES-01, ES-02, ES-03, ES-04 | All four are visible or measurable in week one, and none rewrites the publish model. ES-02 and ES-04 shipped 20 Nov (§10), ES-03 shipped 20 Nov (§11); ES-01 needs DNS/Vercel access |
| **2 — Owner parity** | ES-06, ES-07, ES-08, ES-09, ES-10, ES-11 | One coherent editor slice: instances, typed settings, tokens, history, scheduling, gate. Needs its own design doc (snapshot v6, migration `0015`) |
| **3 — Reach** | ES-05, ES-12, ES-14 | Locale and page tree share a URL contract; doing them together avoids two migrations |
| **4 — Prove it** | ES-17, ES-15, ES-18, ES-16 | Measure, then consent, then structured-data depth, then experiments |

**Do not start slice 2 before the slice-1 open rows.** Media and measurement are no longer
the reason to wait; ES-01 (domain) and ES-05 (locale) are URL decisions that a new editor
does not fix, and they are cheaper before the page tree grows.

---

## 9. What this register does not cover

- Production discipline (monitoring, backups, CI, failure modes): [06](06-production-readiness.md).
- Pricing, packaging and the business case: `docs/01`, `docs/07`.
- Competitor catering features (sessions, prep sheets): `docs/11`, still valid.
- Infrastructure cost triggers: `docs/04` §5, `docs/10`.

---

## 10. Slice 1 result — media and error monitoring (20 November 2026)

Shipped and recorded in [the slice note](../designs/2026-11-20-storefront-media-and-monitoring.md):
the signed image proxy, `next/image` on the public page, alt text from owner content, and
Sentry wiring with a PII scrubber. Verified then: 22 focused tests, `tsc` 0, `next build`
0, proxy 200 with immutable cache, tampered 404, and AVIF through the optimiser.

Still open: a real tenant photograph on a mid-range Android; a Sentry DSN and one proven
5xx alert; revocation after hiding an image remains bounded by the seven-day URL window.

---

## 11. Slice 1 result — storefront attribution (20 November 2026)

### What shipped

| Piece | File |
|---|---|
| Referrer host / UTM / section sanitiser (untrusted input, fixed vocabulary) | `lib/domain/storefront-attribution.ts` |
| Daily view rollup table and member-read RLS (migration `0016`) | `db/migrations/0016_storefront_attribution.sql` |
| Session-scoped beacon, skipped on preview and demo | `components/storefront/view-beacon.tsx`, `app/api/storefront/view/route.ts` |
| Enquiry attribution columns on the CRM record | `lib/db/schema.ts`, `app/p/[slug]/actions.ts` |
| Hidden fields filled on the client; the form still works without JS | `components/storefront/enquiry-attribution.tsx` |
| Seven-day views, enquiries and top sections on the overview | `app/(app)/storefront/page.tsx`, `lib/db/storefront-analytics.ts` |
| Repeatable end-to-end proof (rows deleted in `finally`) | `scripts/verify-storefront-attribution.ts` |

### Decisions

- **A rollup, not a request log.** One row per (org, day, path, referring host, UTM set)
  with `views` incremented in place. No IP, cookie, user agent, full URL or visitor id, so
  the report has nothing that joins back to a person.
- **Section means the section they acted in.** The hidden field is set when a "get a quote"
  link is pressed, not by scroll depth: it points at the block an owner can edit or remove.
- **Enquiries carry attribution; share submissions do not need it.** A catalogue submission
  is already identified by its share link and token, while a storefront enquiry otherwise
  arrives with nothing but a name and phone number.
- **Migration `0016`, not `0015`.** The register reserves `0015` for the section-instance
  slice.
- **Views fail invisible.** The endpoint always answers 204, is limited per slug + IP, and
  the client sends one beacon per tab session. A counter must never block a reader.

### Evidence

| Check | Result |
|---|---|
| Focused unit tests (`storefront-attribution`) | 7 passed |
| `npx tsc --noEmit` | 0 errors |
| `npx next build` | exit 0 |
| `node db/setup.mjs` | 64 tables, 64 with RLS, 123 policies; two-tenant isolation PASS |
| Beacon against a published storefront | 204; row with `/p/kannan-events`, `instagram.com`, `verify/script`; second post increments the same row to 2 |
| Owner report through RLS | `withWorkspace` read returned 2 views and 0 enquiries for that organisation |
| Draft business | code resolves `businesses.published = true` only; no unpublished tenant existed in the dev project, so the live check was skipped |

### Still open

- **Consent** (ES-15) is still absent. This slice is first-party and cookie-free, so it does
  not need a banner; any third-party tag does.
- Days are UTC calendar days, not the visitor's local day.
- Bot filtering is only the session key and the IP limit; a determined script can inflate a
  count, which is another reason the number is not used for billing or ranking.
- The report is a seven-day window with no export, comparison or per-source breakdown yet.
