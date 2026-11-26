# Platform architecture research — storefronts

**Folder:** `docs/architecture/` · **Created:** 20 November 2026
**Question this folder answers:** how do Shopify, Wix and comparable platforms actually
build, serve and operate a full commerce storefront page — and where does the EventsMa
storefront stand against that, both in code and in production?

This is **research and audit**, not a feature design. Feature designs stay in
[`docs/designs/`](../designs/README.md); product decisions stay in
[docs/04](../04-architecture-cost-and-scale.md) and [docs/11](../11-competitive-analysis-and-gaps.md).
Nothing in this folder changes behaviour, and none of it is a recommendation to become
Shopify.

---

## Read in this order

| # | Document | What it answers |
|---|---|---|
| — | This file | Method, evidence standard, scope, refresh triggers |
| 01 | [Shopify](01-platform-shopify.md) | Theme (Liquid) vs headless (Hydrogen/Oxygen), the request path, section/block limits, streamed HTML, Storefront API, Markets |
| 02 | [Wix](02-platform-wix.md) | Editor-first model, SSR + browser re-render, the Varnish/Kafka HTML-cache layer, Wix eCommerce cart/checkout, Headless |
| 03 | [Webflow, BigCommerce, Salesforce, commercetools](03-other-platforms.md) | Four more architectures and a side-by-side comparison |
| 04 | [Shared patterns](04-shared-patterns.md) | The twelve patterns every one of them converges on, and the anatomy of a full commerce landing page |
| 05 | [EventsMa gap register](05-eventsma-gap-register.md) | What we have, what we lack, severity, effort, proof, and what we deliberately do not need |
| 06 | [Production readiness](06-production-readiness.md) | What is documented but not implemented, the failure modes, the go-live gate, what we cannot claim |

If you only have ten minutes: read **04 §3** (the anatomy table) and **05 §4** (the
ranked gaps).

---

## Evidence standard

Every claim carries one of these labels. They are the same labels `docs/` already uses.

| Label | Meaning |
|---|---|
| **FACT** | Stated in a primary source — the vendor's developer documentation or engineering blog — and linked. Pages were read on 20 Nov 2026. |
| **VENDOR CLAIM** | A performance or scale number published by the vendor about its own platform. Recorded because it shows what they optimise for, never treated as a benchmark of our workload. |
| **ASSESSMENT** | Our judgement, derived from the facts in this folder plus the repository. Not a vendor statement. |
| **DECISION** | A choice already made in this project, referenced to the document that made it. |
| **OPEN** | Unresolved; needs a measurement, a customer, or a purchase. |

Platform documentation changes. Each file ends with its source list and the date read,
so a stale claim can be traced and re-checked rather than argued about.

**Vendor documentation describes the intended model, not the whole implementation.** The
Wix engineering post is the exception in kind — it describes an internal system — but it
is from 2021 and describes the pipeline as it was then. Treat every "how it works" as the
vendor's account of their own architecture.

---

## Scope

**Covered:** the storefront layer of six commerce/website platforms — render model,
hosting and CDN, editor/content model, publishing and versioning, media pipeline,
localisation, SEO, commerce boundary, analytics, and the limits they enforce.

**Not covered in this pass:** Squarespace, Framer, WordPress/WooCommerce, Magento/Adobe
Commerce, Shopware, and the Indian SaaS competitors already studied in
[docs/11](../11-competitive-analysis-and-gaps.md). They are named where relevant but no
primary-source pass was made, so this folder makes no claims about them.

**Not a goal:** feature parity with Shopify. EventsMa sells quotations for event
businesses, not products with a cart. The storefront is the shop window for a quote
pipeline. The useful question is which platform mechanisms make a storefront *credible
and operable*, not which features exist.

---

## Refresh triggers

Re-read the relevant file and update the date when any of these happens:

1. A platform changes its render or hosting model (for example Shopify moving themes
   fully to a new renderer, or Wix changing the headless path).
2. A gap in [05](05-eventsma-gap-register.md) ships — mark it implemented with the
   evidence, the way `docs/designs/2026-11-19-storefront-config-gap-analysis.md` §12 does.
3. A paying tenant asks for something marked *deliberate non-gap* — that reopens the
   decision, not the document.
4. The storefront gets a real domain, real images, or real traffic — the production
   assumptions in [06](06-production-readiness.md) change at each of those.

---

## Method

| Step | What was done |
|---|---|
| 1 | Read the existing storefront design record: `docs/designs/2026-11-16-storefront-builder.md`, `…-customise.md`, `…-17-production-storefront.md` (§10–14), `…-19-storefront-config-gap-analysis.md` |
| 2 | Read the current implementation surface: `lib/domain/storefront.ts`, `app/p/[slug]/page.tsx`, `app/sitemap.ts`, `components/storefront/public-sections.tsx`, `next.config.ts`, `vercel.json`, `package.json` |
| 3 | Read primary platform documentation for Shopify, Wix, Webflow, BigCommerce, Salesforce and commercetools; recorded the URLs per file |
| 4 | Wrote the gap register against **verified** repository state, not against the design documents' claims about themselves |
| 5 | Separated *missing feature* from *missing production discipline* — 05 is the first, 06 is the second |

No code was executed for this research beyond reading files; the test counts quoted in
the design documents are theirs, not re-run here.
