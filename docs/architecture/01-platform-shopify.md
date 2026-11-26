# 01 — Shopify: how a storefront is actually served

**Read:** 20 November 2026 · **Sources:** listed in §9
**Why this platform matters:** it is the reference implementation of "merchant edits
content inside a constrained schema; the platform renders, caches and hosts it".

---

## 1. Two architectures, one commerce engine

Shopify sells the same commerce backend through two very different storefronts. The
distinction is the most useful thing to understand before comparing anything.

| | **Theme storefront** | **Headless storefront** |
|---|---|---|
| Frontend | Liquid templates + JSON templates, hosted and rendered by Shopify | Your own app (Hydrogen/React Router, Next.js, anything) |
| Where HTML is produced | Shopify's Storefront Renderer | Your server or edge host (Oxygen, Vercel, …) |
| Who operates the server | Shopify | You |
| Merchant editing | Theme editor: sections, blocks, theme settings | Whatever editor you build or buy |
| Cost and complexity | Low; the vendor's own docs call headless more expensive to build and run | High — explicitly stated by Shopify |
| Extending | Apps, app blocks inside sections, theme code | Any npm package, your own infrastructure |

**FACT.** Shopify's own headless overview says a headless storefront "costs more to build
and run than a theme" and requires merchants to have developers to maintain it after
launch. That is a vendor admitting the trade-off, and it is the same trade-off we face
between our section engine and a free-form builder.

**ASSESSMENT.** EventsMa is currently a *theme storefront with a database editor*: the
owner edits rows, our code renders them, we host it. That is the cheap half of Shopify's
model, which is the correct half for a three-person caterer.

---

## 2. The request path

```
Browser
  │  HTTPS · HTTP/3 · TLS 1.3
  ▼
Shopify CDN (Cloudflare)
  │   /cdn/shop/files/… , /cdn/fonts/…   same-origin, versioned with ?v=
  │   Brotli/gzip, automatic minification
  ▼
Storefront Renderer (SFR)          ← dedicated server-side renderer
  │   layout → JSON template → section groups → sections → blocks
  │   HTML streamed in two parts around {{ content_for_header }}
  ▼
Storefront API / commerce services ← products, collections, cart, markets, pricing
  │
  └── Checkout stays on Shopify (hosted, outside the theme)
```

**FACT.** Storefront assets are served from a `/cdn` path on the same domain, so the
browser reuses one connection instead of opening a second origin. URLs carry a `?v=`
version, and Shopify only recognises that specific parameter for cache-busting.

**FACT.** The Storefront Renderer exists specifically to improve cache-miss performance,
and Shopify streams most HTML responses in two parts: the head first, the sections when
they finish. The browser parses the head, starts fetching CSS/fonts/scripts, and paints
sooner. Only pages that render from a JSON template **and** keep
`{{ content_for_header }}` as a plain tag inside `<head>` are eligible; `.liquid` pages
are not streamed yet.

**FACT.** Shopify sends `HTTP 103 Early Hints` for render-blocking assets on every
storefront response, automatically, and limits the header's size. Themes can add a
couple of their own hints but are told not to duplicate the automatic ones.

**ASSESSMENT.** This is a platform-owned performance programme: the merchant cannot make
the CDN slow, cannot forget Brotli, and cannot break Early Hints. Our equivalent is Next
on Vercel, which gives compression, HTTP/2 and image optimisation, but the *page-level*
choices (streaming boundaries, preloads, image sizing) are still ours to get right — and
`06` records where we currently do not.

---

## 3. The content model: layout → template → section → block

Shopify's theme architecture is a five-level tree. It is worth memorising because it is
the model every serious site builder has converged on (Wix's sections/elements,
Webflow's components, BigCommerce's Page Builder, our sections).

| Level | What it is | Who edits it |
|---|---|---|
| Layout | The shell: `<head>`, header, footer, `{{ content_for_header }}` | Developer |
| Template | Per page type: home, product, collection, cart, 404 | Developer creates; merchant may assign a template |
| Section group | A region of the layout (header, footer) that merchants can fill with sections | Merchant |
| Section | A reusable, schema-defined module (hero, featured collection, rich text) | Merchant: add, remove, reorder, configure |
| Block | A repeatable item inside a section (one slide, one testimonial, one tab) | Merchant: add, remove, reorder |

**FACT — the numbers that matter.** A JSON template or section group can render **up to
25 sections**, and each section can contain **up to 50 blocks** — so a page can hold
1,250 blocks. The limits are explicit, documented, and enforced by the editor.

**FACT.** JSON templates are only a wrapper for sections; Liquid templates contain code.
Sections can be rendered statically with the `section` tag, but Shopify's docs tell
developers to avoid it because statically rendered sections cannot be reordered by the
merchant. The **Section Rendering API** exists so a theme can re-render one section over
AJAX (filters, pagination) without reloading the page.

**ASSESSMENT — the important contrast with us.** Shopify separates *the type of thing*
(section schema) from *the instance of the thing* (a section row with settings). Our
`storefront_sections` table is unique on `(org_id, key)`: one hero, one about, one
services. We model **section types**, they model **section instances**. That is exactly
gap ES-06 in [05](05-eventsma-gap-register.md), and it is the reason a caterer cannot add
an "Awards" block or a second gallery.

---

## 4. Editing, previewing, publishing

**FACT.** The theme editor is the merchant surface; themes are previewed against real
store data before publishing. Multiple templates can exist per resource type, so a
product can choose between layouts.

**FACT.** Shopify Markets lets one store serve many countries: separate catalogs (which
products, at what price), currencies, languages, and theme customisations per market, with
rollouts to stage a change.

**FACT.** International URLs are explicit: subfolders (`shop.com/fr`, `shop.com/en-ca`),
subdomains, or country TLDs. Shopify recommends subfolders for most stores because they
share domain authority. The owner sets a region suffix per market rather than writing
locale shortcuts in theme code. Hreflang tags, self-referencing canonicals and
market-specific sitemap entries are generated automatically.

**ASSESSMENT.** Our locale story is the opposite: one URL per storefront, English-only
HTML, a Tamil catalogue that exists but is not served (`docs/designs/2026-11-17-…` §11).
For a Kerala/Tamil Nadu pilot that is a *product* gap, not merely an SEO gap.

---

## 5. The commerce boundary

**FACT.** The Storefront API is GraphQL only — there is no REST storefront API — served
from a single POST endpoint, versioned in the URL. The Customer Account API handles login,
orders and profiles. Checkout is not part of the theme: it is Shopify-hosted, which is why
a theme developer never touches card data or tax calculation.

**ASSESSMENT.** This is the single most copyable boundary in Shopify's design: **the
storefront owns presentation; the money path is a separate, narrow, hosted surface.**
EventsMa already has the analogue — a published snapshot and an enquiry, with the quote
and manual payment record behind the workspace — but we do not state or test that boundary
as a rule. `06 §4` turns it into failure-mode checks.

---

## 6. Extensibility without forking the theme

| Mechanism | What it allows | Our equivalent |
|---|---|---|
| Apps + app blocks | Third-party UI inside a section, merchant-togglable | None |
| Theme app extensions | App-owned snippets and assets, no theme-file edits | None |
| Section Rendering API | Partial re-render without a reload | None (full navigation) |
| Metafields / metaobjects | Structured custom data attached to resources | `storefront_sections.config`, `businesses.settings` |
| Storefront API tokens per channel | Scoped credentials per storefront | Single app, server-only |

**ASSESSMENT.** We do not need an app ecosystem. We do need the *discipline* that makes
one possible: a section type registry with typed settings, so adding a section does not
mean editing a union, a sanitiser, a snapshot version and the builder (gap ES-07).

---

## 7. What Shopify's model buys, and what it costs

**Buys**

- A merchant can change the page without a deploy, inside limits that keep it usable.
- The platform owns rendering performance, asset compression, URL versioning and hints.
- Publishing is a first-class act with a preview step; the theme is the unit of change.
- Localisation is data (markets, catalogs, locale paths), not a fork of the theme.
- Checkout, tax and PCI are outside the storefront entirely.

**Costs**

- The theme is code; a merchant who wants something outside the schema needs a developer
  or an app.
- Headless removes the ceiling and adds the whole operational burden — Shopify says so.
- The section/block limits mean a page can become heavy (1,250 blocks is a lot of DOM).
- Apps can wreck performance; the platform's own budgets are advisory to app authors.

---

## 8. What to copy, what not to

| Shopify mechanism | Copy? | Honest mapping |
|---|---|---|
| Section + block instances with typed settings | **Yes, next structural slice** | ES-06/ES-07; snapshot v6, migration `0015` |
| Preview before publish, shareable preview link | **Already done** | Owner preview + HMAC client link, 7-day expiry |
| Version history with restore | **Partly done** | Restore exists; no compare, retention now 20 |
| Streamed HTML + Early Hints | **Partly platform-given** | Next streams RSC; we have not measured storefront streaming boundaries |
| `/cdn` same-origin, versioned asset URLs | **Partly** | Next serves `/_next/static` immutable; tenant images now use a signed same-origin proxy and the optimiser, verified without a real tenant photo (`06`) |
| Markets: locale paths + auto hreflang | **Later, but design for it** | ES-14; do not hardcode `/p/[slug]` assumptions in links |
| GraphQL storefront API | **No** | We use server components + Drizzle; adding GraphQL buys nothing at this size |
| Hosted checkout, PCI out of scope | **Already our model** | No gateway, manual receipts (ADR-002; AGENTS §3) |
| 1,250-block ceilings | **Copy the idea, not the number** | Cap blocks per tenant (our earlier proposal: 40) |

---

## 9. Sources

| Topic | URL |
|---|---|
| Storefront options overview | https://shopify.dev/docs/storefronts |
| Theme architecture | https://shopify.dev/docs/storefronts/themes/architecture |
| Sections, blocks, 25/50 limits, Section Rendering API | https://shopify.dev/docs/storefronts/themes/architecture/sections |
| CDN, Storefront Renderer, streamed HTML, Early Hints, minification | https://shopify.dev/docs/storefronts/themes/best-practices/performance/platform |
| Hydrogen / React Router / Oxygen | https://shopify.dev/docs/storefronts/headless/hydrogen/fundamentals |
| Hydrogen runtime and stores | https://shopify.dev/docs/api/hydrogen/latest |
| Storefront API (GraphQL only, versioned) | https://shopify.dev/docs/api/storefront/latest |
| Headless cost/complexity warning | https://shopify.dev/docs/storefronts/headless/overview |
| Markets international SEO (subfolders/subdomains/TLDs) | https://help.shopify.com/en/manual/markets/seo |
| International domains and locale paths | https://help.shopify.com/en/manual/international/managing-international-domains |
| Languages, hreflang, translated slugs, sitemaps | https://help.shopify.com/en/manual/international/languages/manage-languages |
| Market types, catalogs, rollouts | https://help.shopify.com/en/manual/markets/getting-started/overview |
