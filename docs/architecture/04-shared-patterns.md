# 04 — The shared patterns, and the anatomy of a commerce landing page

**Read:** 20 November 2026
**Purpose:** stop comparing products and start comparing **mechanisms**. Every platform in
this folder is a different answer to the same twelve problems. This file names them, says
what each platform does, and states where EventsMa stands (detail in
[05](05-eventsma-gap-register.md)).

---

## 1. The twelve patterns

### P1 — A cacheable document, rendered from data

Every platform renders HTML on a server or at build time and caches it near the visitor.
Shopify streams eligible JSON-template pages in two parts; Wix caches cookie-free HTML
and fetches visitor data separately; Webflow ships a build artifact from Cloudflare;
Catalyst uses SSR/ISR; Salesforce's React storefronts use SSR with hydration and CDN
caching. None renders the primary content from a client fetch on first paint.

**EventsMa:** server components, ISR `revalidate = 300`, `revalidatePath('/p','layout')` on
publish. Correct shape. Unmeasured: streaming boundaries, preloads, and whether a
publish is visible immediately or up to five minutes later on an on-demand page.

### P2 — Draft and published are different states

Shopify previews a theme before publishing it; Wix separates Save from Publish and keeps
Site History; Webflow publishes to a staging subdomain; BigCommerce themes are published
as packages. The owner can look before the world looks.

**EventsMa:** strongest of the set on immutability — `storefront_versions` snapshots,
pointer swap, restore-as-new-version, owner preview, signed 7-day client preview, retention
20. Weak on inspection: no version compare, no "preview this version".

### P3 — Sections are instances of types, not types themselves

Shopify: up to 25 sections per template and 50 blocks per section, each with a schema.
Wix: elements inside sections. Webflow: components. This is what lets an owner add a
second gallery, an awards strip, or a "how we work" band without a developer.

**EventsMa:** ten keys, unique per organisation, one of each. A data-model limit, not a UI
limit. Gap **ES-06**.

### P4 — Design tokens live above the page

Shopify theme settings, Wix Site Styles (palette, text themes, width), Webflow classes and
style panel. Colour, type and spacing are global objects the page consumes, so a change is
one edit, not fifty.

**EventsMa:** one brand colour, two wordmark fonts, three layouts. No secondary/accent,
no body/heading pairing, no density, no per-section background or alignment. Gap **ES-08**.

### P5 — Media is a pipeline, not a file input

Shopify serves images through `image_url` transformations on a same-origin CDN with
versioned URLs; Wix resizes, converts to WebP and sets `fetchpriority` automatically. The
owner cannot upload a 4 MB photo and destroy the page, because the platform re-derives
every variant.

**EventsMa:** hero + logo + one cover per work item, now through `next/image` behind a
signed same-origin proxy, with `sizes` and alt text derived from owner content. Shipped
20 Nov (ES-02, §10); a real tenant photograph on a mid-range phone is still unverified.

### P6 — Host routing is a first-class object

A custom domain maps to exactly one tenant, with a canonical URL per host. Every platform
supports it; it is the difference between "a page on someone else's site" and "our website".

**EventsMa:** slug only, canonical from `NEXT_PUBLIC_APP_URL`. Gap **ES-01**, blocked on
DNS/Vercel access rather than on design.

### P7 — Localisation is URL + data, not a second site

Shopify creates `/fr`, `/en-ca`, translated slugs, automatic hreflang, and includes every
language in the sitemap. Catalyst uses an `app/[locale]` segment with per-locale messages.
Salesforce ships locale-aware routing in its reference app.

**EventsMa:** the i18n engine exists (en + ta; 467 items at the 20 Nov audit), but
`/p/[slug]` is prerendered English-only by decision, so Tamil copy is written and unused.
Gap **ES-05**.

### P8 — SEO is platform output, not owner homework

Sitemap from the content model, structured data, per-resource title/description overrides,
a per-tenant social card, canonical, robots. The owner supplies words; the platform
supplies the machine-readable shape.

**EventsMa:** largely shipped — overrides, `noindex`, canonical, `LocalBusiness` JSON-LD,
per-tenant OG image, and a sitemap that includes catalogue detail URLs (0 → 90 on the live
project). Remaining: `Service`/`FAQPage`/`BreadcrumbList` depth and hreflang (ES-18, ES-05).

### P9 — The money path is separate and narrow

Shopify checkout is hosted; Wix redirects to a Wix-hosted checkout; BigCommerce integrates
checkout in the backend; Salesforce allows PWA Kit or Storefront Next and SFRA to split
the flow. No platform
lets presentation code touch card data or tax.

**EventsMa:** enquiry → quote → immutable version → manual receipt. Same boundary, fewer
moving parts. **Deliberate non-gap** (ADR-002, AGENTS §3).

### P10 — Analytics and consent are installations, not code changes

The platforms studied offer a place to install analytics/pixels, and those selling into
regulated markets expose a consent surface, so measurement does not require editing the
renderer or making the page dynamic.

**EventsMa:** first-party storefront views and enquiry attribution shipped 20 Nov (ES-03,
§11): a daily rollup, no pixels. Consent tooling is still absent (ES-15), so no third-party
tag can be added honestly yet.

### P11 — Limits are explicit, documented and enforced

25 sections / 50 blocks; theme variations capped at four; plan quotas; API cost buckets.
Limits protect the platform's performance *and* give the owner a predictable editor.

**EventsMa:** several implicit caps — 12 FAQ/team/testimonial entries, 8 preview packages,
2 catalogue items per service, 20 versions, 1,000 build-time slugs. They work, but they are
scattered constants; a per-tenant block cap belongs with ES-06.

### P12 — Reliability is designed, not hoped for

Multi-cloud and multi-region (Wix), a CDN in front of everything (all), phased rollouts
(Salesforce), cache invalidation as events (Wix). Degradation is a stated behaviour.

**EventsMa:** single Vercel region (`bom1`), single Supabase region, no failover. Some
degradation paths are genuinely good (missing snapshot → draft fallback; missing table →
`null`; build-time DB hiccup → on-demand render). Others are unexamined (`06 §5`).

---

## 2. What the platforms agree on

| Agreement | Evidence |
|---|---|
| Server-render the first view | Shopify SFR; Wix SSR; Webflow build; Catalyst/PWA Kit SSR |
| Never let the editor change production directly | Shopify preview; Wix Save/Publish; Webflow staging |
| Constrain the editor with a typed model | Shopify schema; BC Page Builder; Webflow collections |
| Own the image pipeline | Shopify `image_url`; Wix auto-resize/WebP/fetchpriority |
| Own the domain and the canonical | all six |
| Keep money off the storefront | checkout is a separate hosted or back-office surface |
| Make the URL structure locale-aware | Shopify Markets; Catalyst `[locale]` |
| Publish is an event with invalidation | Wix Kafka; Shopify theme publish; Webflow publish |

**ASSESSMENT.** Our storefront matches the *architecture* on six of eight. The two
mismatches are **domain** and **locale** — both URL-contract changes rather than buttons,
which is why they are harder to retrofit than media proved to be.

---

## 3. Anatomy of one full commerce landing page

What "a complete ecommerce landing page" contains, what the big platforms do for each
block, whether a **quote-first** storefront needs it, and where we stand. This is the
answer to "what are they using that we are not".

| # | Block | How the platforms do it | Quote-first need | EventsMa status |
|---|---|---|---|---|
| 1 | Top bar + navigation | Theme header with menus, cart, locale/currency switcher (Shopify), page tree (Wix/Webflow) | **Yes** — even one page needs anchor nav | No nav model; sections only (ES-05) |
| 2 | Hero | Section with image, overlay, heading, CTAs; LCP image prioritised automatically | **Yes** | Built; responsive image via the signed proxy and optimiser (ES-02 shipped) |
| 3 | Trust strip | Ratings, "as seen in", guarantees, client logos | Yes, as testimonials/team | Testimonials + team sections |
| 4 | Category / service grid | Collection list from the catalogue, links to PLP | **Yes** — service categories | Services section; catalogue detail routes exist |
| 5 | Product cards (PDP links) | Image, price, variants, rating, quick add | No cart; **yes to priced items** | Catalogue cards with indicative rates |
| 6 | Offer / pricing block | Price, compare-at, bundles, discounts | **Yes** — packages | Packages section, server-formatted rate |
| 7 | Social proof (reviews) | Reviews app, moderation, aggregate rating schema | Yes, but quotes not ratings | Testimonials (no reviews system — deliberate) |
| 8 | FAQ | Accordion + `FAQPage` structured data | **Yes** | FAQ section; no JSON-LD yet |
| 9 | Conversion form | Cart checkout or lead form with consent + spam control | **Yes** — enquiry, not cart | Enquiry: idempotent, rate-limited, honeypot, no consent copy |
| 10 | Secondary CTA | Sticky mobile bar, WhatsApp, call | **Yes** | Mobile bar exists; call button needs a phone number |
| 11 | Footer | Policies, contact, social, locale, payment marks | **Yes** — but not fake payment marks | Contact section; no per-tenant policy pages |
| 12 | Locale / currency | Switcher, `/fr` paths, hreflang, per-market pricing | Later, but Tamil first | Missing (ES-05) |
| 13 | Media system | Responsive variants, alt text, focal point, lazy loading | **Yes** | Hero/logo/cover; no gallery or focal point yet (ES-02 shipped) |
| 14 | Analytics + consent | Pixels, consent banner, server events, funnel | **Yes** — owner must see leads | 7-day views + enquiry attribution (ES-03); no consent (ES-15) |
| 15 | Machine-readable layer | Sitemap, canonical, OG image, JSON-LD | **Yes** | Most shipped (P8) |
| 16 | Checkout | Hosted checkout, tax, payment | **No** — quote + manual receipt | Deliberately absent |
| 17 | Account / order history | Login, orders, addresses | **No** | Not applicable |
| 18 | Search / filters | Catalogue search, faceting | Later | No storefront search |
| 19 | Personalisation | Geo, market, returning visitor | Later | None (and must not de-prerender) |
| 20 | Experimentation | A/B on hero/offer | Later | None |

**ASSESSMENT.** Of the twenty blocks, **thirteen are needed for a credible quote-first
storefront**, and most now have a working version. The gaps that remain — navigation,
locale, consent, and structured-data depth — are the same P0/P1 rows in `05`. Media and
first-party analytics have closed since the first draft. Nothing in the commerce-only half
(checkout, accounts, cart) is required, and copying it would violate AGENTS §3.

---

## 4. Anti-patterns this research warns against

| Anti-pattern | Who proves it wrong | Why it would hurt us |
|---|---|---|
| Making the public page dynamic to personalise it | Wix caches HTML and overlays at the edge | Every view becomes a DB round trip; the 2 s LCP budget dies |
| Free-form canvas for non-designers | Wix's own two-editor split (classic vs Studio) | A caterer builds a page that breaks at 380 px |
| Copying cart/checkout because "ecommerce" | Every platform keeps money off the storefront | Gateway KYC, PCI, webhooks, refunds — all forbidden by ADR-002 |
| A section type per tenant request | Shopify's schema/instance separation | Ten section types become forty special cases |
| Client-side totals | Server-authoritative totals in our own docs/04 | Money previews become money |
| Adding analytics by editing the renderer | Platform-level installs everywhere | Couples measurement to page code and to caching |
| Treating published JSON as "just a row" | Webflow's build-artifact model | No rollback drill, no last-good-snapshot serving |

---

## 5. The one-paragraph summary

Shopify, Wix, Webflow, BigCommerce, Salesforce and commercetools all sell the same five
guarantees: a server-rendered cached document, a constrained editor over typed content, a
draft/published split with preview, a platform-owned media and localisation layer, and a
money path that is not the storefront. Their differences are about *where the editor
lives* and *how much runtime the page is allowed*. EventsMa has the first, the second and
the third; it has the media half of the fourth in production and still lacks the
localisation half; and it correctly refuses the fifth.
That is the whole gap, stated once.
