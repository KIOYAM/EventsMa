# 02 — Wix: the editor-first platform and its caching pipeline

**Read:** 20 November 2026 · **Sources:** listed in §8
**Why this platform matters:** it is the reference implementation of "a non-technical
owner edits a visual page, and the platform still keeps it fast at scale".

Wix is the closest comparison to our *owner experience*, and the furthest from our
*architecture*. Both contrasts are useful: one shows what an owner expects, the other
shows what it costs to deliver it.

---

## 1. The model

A Wix site is a page tree of visual elements (sections, strips, containers, grids, stacks,
text, media, apps) edited in a canvas. There is no theme file the owner edits and no
deploy. The owner presses **Save**, previews, then **Publish**; site history keeps
versions.

**ASSESSMENT.** Wix sells *composition freedom*. The owner can place anything anywhere,
which is why a Wix page can look like a designed site — and why an untrained owner can
produce a page that breaks at 380px. Our ten fixed sections are the opposite trade: less
freedom, no way to build an unusable layout. Neither is "better"; they serve different
users. Our owner is a caterer who wants a credible page in twenty minutes, not a designer.

The parity lesson is narrower: within our constrained model, the owner still expects to
(a) add more than one of something, (b) change look without a developer, and (c) see it
before it is live. `05` scores all three.

---

## 2. How a Wix page is rendered

Wix's engineering account (2021) is unusually specific, and it is the most instructive
part of this research.

```
Visitor request
   │
   ▼
Edge / CDN (multi-provider, chosen per visitor)
   │   cacheable HTML, no cookies
   ▼
Varnish cache ── invalidation messages via Kafka
   │
   ▼
Scala/Netty proxy
   │   2021: mutated cached HTML with visitor data
   │   later: HTML untouched; visitor data fetched separately
   ▼
Browser
   │  HTML visible; hydration requests a small visitor JSON
   ▼
Same page code runs again in the browser → interactivity ("double rendering")
```

**FACT.** Wix moved to SSR for SEO and first-paint, then found that generating unique HTML
per request was wasteful, so it introduced multi-layer caching.

**FACT.** The first cache was not a plain CDN: an in-house layer used **Varnish** for
proxying and caching, **Kafka** for invalidation messages, and a **Scala/Netty** service
that proxied HTML while **mutating it to add visitor-specific data and cookies**.

**VENDOR CLAIM.** Wix reports that this let it deploy slim cache nodes in more regions:
over 15 new regions in 2019, and caching enabled for over 90% of page views eligible for
it.

**FACT.** That design did not last. The same 2021 account says Wix then **removed
visitor-specific data from the HTML entirely**, moved it to a separate JSON endpoint
called during hydration, and enabled browser caching with `ETag`/`304`. Cookie-free HTML
could then be served by external CDNs. The mutation layer is history, not the current
architecture — an important correction to the common summary of this post.

**FACT.** Wix's own rendering documentation describes the consequence: the server renders
HTML, the browser displays it, then runs the same page code again to attach interactions.
Navigating between pages usually renders once, in the browser. A **Rendering API** lets
site code choose whether a piece runs on the server or in the browser.

**ASSESSMENT — the transferable idea.** Wix separates three things that are usually
tangled:

1. **A cacheable public artifact** (the HTML, with no visitor data),
2. **Visitor-specific data as a separate fetch**, not part of the document,
3. **Invalidation as an event** (site data changed → Kafka → purge).

EventsMa has (1) and a blunt (3): `revalidatePath('/p', 'layout')` on publish, plus ISR
`revalidate = 300` as the fallback (`app/p/[slug]/page.tsx`, `app/(app)/storefront/actions.ts`).
We do not have (2) at all — and that is *fine*, because we do not personalise. But if A/B
testing arrives (ES-16), it must not be implemented by making the public page dynamic.
First-party view counting (ES-03) already avoids that. Wix is the proof that
personalisation does not require a per-request document.

---

## 3. Performance is a platform default, not a theme setting

**VENDOR CLAIM.** Wix states that all static resources are served from CDNs (multiple
providers, chosen per visitor), that premium-domain HTML and API calls are cached and
invalidated when site data changes, and that sites are hosted across AWS, Google Cloud,
Fastly and its own data centres with 200+ CDN nodes. It publishes LCP 1.2 s, INP 11 ms,
CLS 0.00 on its infrastructure page.

**VENDOR CLAIM.** Images are automatically resized, converted to WebP, and prioritised
with `fetchpriority` so the LCP image downloads first.

**ASSESSMENT.** We should not quote those numbers; they are a vendor's best-case page.
The *design claim* underneath them is what matters: **image transformation and format
negotiation are automatic, so an owner cannot upload a 4 MB JPEG and destroy the page.**
Our storefront now does the same through `next/image` behind a signed same-origin proxy
(ES-02, shipped 20 Nov — `05` §10); what remains unproven is a real tenant photograph on
a mid-range phone.

---

## 4. The editor and its design system

**FACT.** Wix Studio offers a section grid, flexbox and an advanced CSS grid, custom
breakpoints for desktop/tablet/mobile, site-wide colour palettes and text themes, no-code
animation presets, and custom CSS. The classic editor is a free-form canvas.

**ASSESSMENT.** Two different products under one brand: the classic editor optimises for
"put it exactly there", Studio for "behave correctly at every width". Shopify sits between
them with a schema. We sit furthest toward constraint.

**What an owner actually notices, in order:** their logo and colour appear; the page looks
designed on a phone; they can add a section that is not in our list; they can change fonts
and spacing; they can hand a client a link before publishing. Our gaps ES-06, ES-08 and the
already-shipped preview cover exactly these.

---

## 5. Developer surfaces

| Surface | What it is | Relevance to us |
|---|---|---|
| Velo | Site code + backend web modules attached to a Wix site | We have server actions; no third-party code surface |
| Wix IDE / local IDE | Edit site code outside the browser | We have a normal repo — better |
| Apps / App Market | Installable functionality with dashboard pages and widgets | No ecosystem; not needed |
| Wix Headless | Any frontend on Wix business services (CMS, eCommerce, Bookings, payments) | Their "bring your own frontend" path |
| Wix eCommerce API | Catalog, cart, checkout, orders, discounts, fulfillment | Commerce engine we deliberately do not build |

**FACT.** Wix Headless has two paths: **Wix-managed** (Wix hosts, deploys and runs the
frontend; Astro is the recommended scaffold, with authentication and SEO handled) and
**self-managed** (you host any framework). The business data stays in the Wix dashboard;
the custom frontend reads it through SDKs/APIs.

**FACT.** Wix's eCommerce purchase flow is catalog → cart → checkout → order. **Cart v2**
merges cart and checkout into one entity; the older Cart and Checkout APIs are scheduled
for removal on **1 February 2027**. A headless frontend creates a checkout from the
current cart and redirects the visitor to a **Wix-hosted checkout URL**.

**ASSESSMENT.** Two things to steal conceptually, one to refuse:

- **Steal:** a hosted checkout redirect keeps payment, tax and PCI outside the frontend.
  Our manual-receipt decision already achieves the same isolation with less machinery.
- **Steal:** the managed-headless idea — "we host your frontend, you own the code" — is
  the offer our Vercel deployment already makes, but we do not describe it that way.
- **Refuse:** the free-form canvas, and the proprietary runtime. Our page must remain
  portable HTML/CSS rendered by Next.

---

## 6. Publishing and site history

**FACT.** Wix separates saving from publishing, and [Site History](https://support.wix.com/en/article/viewing-and-managing-your-site-history)
records every save and publish with an author and timestamp; restoring an earlier version
erases changes made after it. A site can also be scheduled to publish through
[Automations](https://support.wix.com/en/article/wix-automations-scheduling-your-site-to-publish)
with a scheduled-time trigger and the "Publish site" action.

**ASSESSMENT.** Our snapshot model is *stronger* on immutability (versions are never
mutated; restore creates a new version) and weaker on inspection (no diff, no "preview this
version", retention only recently capped at 20). Wix's history UI is the bar an owner will
compare against, not its storage model.

---

## 7. Copy / don't copy

| Wix mechanism | Copy? | Mapping |
|---|---|---|
| Cacheable HTML + separate visitor data | **Design for it before A/B** | First-party views do not de-prerender; ES-16 must not either |
| Automatic image resize/format/priority | **Shipped 20 Nov** | ES-02: `next/image` behind a signed proxy; verify with a real tenant photo |
| Multi-layer cache with event invalidation | **Partly** | We have tag/path revalidation; add per-tenant tags when traffic justifies it |
| Visual section/element freedom | **No** | Our constraint is the product; add *instances of known types* instead (ES-06) |
| Hosted checkout redirect | **Already conceptually** | Quotes + manual receipts; no gateway |
| Site history with author/time | **Yes, cheaply** | We already store `created_by`/`created_at`; add compare later (ES-09) |
| Velo / app ecosystem | **No** | No third-party code in tenant pages |

---

## 8. Sources

| Topic | URL |
|---|---|
| Wix engineering: SSR, Varnish + Kafka + Scala/Netty HTML mutation, regions, 90% cacheable | https://www.wix.engineering/post/how-we-improved-website-performance-by-evolving-our-infrastructure |
| Same case study, web.dev | https://web.dev/case-studies/wix |
| Page rendering: server render then browser render, Rendering API | https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/frontend-code/page-rendering/about-page-rendering |
| CDNs, HTML/API caching, invalidation on site-data change | https://www.wix.com/performance |
| Multi-cloud hosting, 200+ CDN nodes, Core Web Vitals claims | https://www.wix.com/studio/infrastructure/reliability-performance |
| Headless paths (managed Astro / self-managed) | https://dev.wix.com/docs/go-headless/get-started/choose-your-development-path |
| eCommerce architecture and data flow | https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/architecture-data-flow |
| Cart v2, old APIs removed 1 Feb 2027 | https://dev.wix.com/docs/api-reference/business-solutions/e-commerce/purchase-flow/cart-v2/introduction |
| Purchase flow, hosted checkout URL | https://dev.wix.com/docs/api-reference/business-solutions/stores/catalog-v3/online-store-product-purchase-flow |
| Headless eCommerce quick start | https://dev.wix.com/docs/go-headless/tutorials-templates/java-script-sdk-tutorials/e-commerce-quick-start |
| Studio site colours and text styles | https://support.wix.com/en/article/studio-editor-about-site-styles |
| Studio breakpoints (cascading overrides) | https://support.wix.com/en/article/studio-editor-designing-across-breakpoints |
| Studio flexbox and section grid | https://support.wix.com/en/article/studio-editor-managing-and-customizing-flexboxes |
| Studio custom CSS | https://support.wix.com/en/article/studio-editor-about-css-editing |
| Studio animations and interactions | https://www.wix.com/studio/academy/tutorials/how-to-create-animations-and-interactions |
| Test Sites: traffic-split releases | https://support.wix.com/en/article/about-test-sites |
| Site History: versions, authors, restore semantics | https://support.wix.com/en/article/viewing-and-managing-your-site-history |
| Scheduled publish (Automations) | https://support.wix.com/en/article/wix-automations-scheduling-your-site-to-publish |
| Automations: scheduled site publishing | https://support.wix.com/en/article/wix-automations-scheduling-your-site-to-publish |
