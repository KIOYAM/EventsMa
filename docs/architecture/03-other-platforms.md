# 03 — Four more architectures, and the comparison table

**Read:** 20 November 2026 · **Sources:** listed in §6
**Why these four:** Webflow is the pure static-first builder; BigCommerce is the closest
direct rival to Shopify in shape; Salesforce is the enterprise phased-migration case; and
commercetools is the pure API-first extreme. Together they bracket every choice we have.

---

## 1. Webflow — design once, publish static

**FACT.** The Designer is a visual canvas that publishes HTML, CSS and JavaScript. Styles
set at the desktop breakpoint cascade both up and down to the other breakpoints; an
override at a smaller breakpoint does not affect larger ones.

**FACT.** Hosting is fully managed and delivered by **Cloudflare**. **VENDOR CLAIM.**
Webflow states its infrastructure handles millions of page views a day with under 100 ms
response time. Sites get a `*.webflow.io` subdomain used as staging/development, and a
custom domain as production.

**FACT.** The CMS is a set of **Collections** — each with one schema and one page template
— plus **Collection items** and **Collection lists** that inject items into static pages.
Publishing can be site-wide, and CMS items can be published or unpublished individually
without touching design work in progress. On Enterprise and partner plans, custom roles can
be limited to staging, or to staging and production.

**FACT.** Code export (HTML/CSS/JS/assets) exists on Workspace plans, not Site plans.
**Webflow Cloud** extends the same hosting to dynamic, server-rendered web apps on the same
domain, with backend logic, API routes and deployment workflows.

**ASSESSMENT.** Webflow is the cleanest expression of "the page is a build artifact".
That gives it the best worst-case performance and the weakest runtime behaviour: no
per-request personalisation, no server-side business rules on the page, no partial
re-render without Cloud. Our storefront needs a *little* runtime (published snapshot
lookup, enquiry POST, preview token), so we are correctly not static-only — but it also
means our public page inherits every runtime risk in `06`.

**The transferable idea:** publishing as a **build**, i.e. an artifact that can be
inspected, rolled back and served without touching the database. Our snapshot is that
artifact in JSON; we have never treated it as one operationally (no rollback drill, no
"serve last good snapshot if the DB read fails").

---

## 2. BigCommerce — the same fork as Shopify, made explicit

**FACT — Stencil.** The traditional engine is server-side HTML templates written in
**Handlebars.js** with SCSS and JavaScript, **handled directly by the BigCommerce backend**.
It is fully hosted, integrates cart/checkout/product rendering without API calls, and ships
with built-in caching and CDN delivery. **Cornerstone** is the default open-source theme.
**Page Builder** lets a merchant change colours, typography, banners, headings, carousel,
footer and product-panel density without code. A theme can contain **one to four variations** for
different markets or audiences, managed as one package.

**FACT — Catalyst.** The headless option is a **Next.js + React** storefront using the
**GraphQL Storefront API**, with full control of routing, data fetching and caching. It is
explicitly "composable", ships a pre-built routing scheme for all major page types, uses
the **App Router** with a `[locale]` route segment and `messages/` catalogues, and adds
**Makeswift** as a no-code visual builder on top. Hosting is external (Vercel, Netlify or
similar) or BigCommerce's own Storefront Hosting, which was in closed beta at the time of
reading — so "self-hosted" is the default, not a rule.

**FACT.** BigCommerce's own comparison is blunt: Stencil is monolithic and fully hosted;
Catalyst is headless/composable and hosted externally by default. It also notes that Stencil is
"optimized, but limited by request-time rendering".

**ASSESSMENT.** Two details are directly useful to us:

1. **`app/[locale]/…` + `messages/` is exactly the shape our bilingual storefront needs**
   (ES-05), and it is the shape the rest of our app already has via `lib/i18n`.
2. **A visual builder layered on a code storefront** (Makeswift on Catalyst) is the
   realistic answer to "an owner wants to move things without a deploy" — not a free-form
   canvas. Our section engine is a simpler version of the same idea.

---

## 3. Salesforce — three storefronts and a phased migration

**FACT.** B2C Commerce now documents three paths rather than two. **SFRA** (Storefront
Reference Architecture) is server-side HTML and JavaScript using the B2C Script API.
**PWA Kit** is an open-source React framework with server/client rendering and hydration,
plus a Retail React App covering home page to checkout, hosted on **Managed Runtime** and
calling the **Commerce API (SCAPI)**. **Storefront Next** is the current recommended
option: React Router 7 framework mode, React 19, Tailwind CSS, shadcn/ui and Vite, also on
Managed Runtime.

**FACT.** Salesforce documents **phased headless rollouts**: run PWA Kit (or Storefront
Next) for some pages while SFRA keeps the checkout flow, joined by session bridging and
eCDN routing rules — explicitly to avoid a "big bang" cutover. Its own comparison table
also offers a Storefront Next/SFRA hybrid.

**ASSESSMENT.** The phased pattern is our reality already: the public storefront is new,
while quotes, PDFs and payments are older code. Salesforce's contribution is to say that
this is a legitimate architecture, not technical debt — as long as the seam is explicit
and the customer experience does not show it. The more uncomfortable lesson is that the
largest vendor in the set now ships the same stack family we use (React, Tailwind, Vite);
the stack is not the differentiator.

---

## 4. commercetools — API-first as the whole thesis

**FACT.** commercetools defines **MACH**: Microservices, API-first, Cloud-native, Headless.
**VENDOR CLAIM.** It advertises over 300 commerce APIs and 100% GraphQL coverage, which it
calls the highest of any commerce platform. The frontend is a separate concern, and the
platform supplies B2C, B2B and InStore commerce.

**ASSESSMENT.** This is the correct architecture for a retailer with several channels, a
large catalogue, and a frontend team per channel. It is the wrong architecture for us:
our catalogue is tens of items per tenant, our "checkout" is a quotation rendered to PDF,
and every additional service is a free-tier limit and an on-call surface. API-first is a
*shape* we already have at the data layer (server-only DTOs, explicit fields); we should
not mistake it for a reason to split services.

---

## 5. Side-by-side

| Platform / path | Default render | Where HTML comes from | Editor model | Publishing | Commerce boundary | Best idea to borrow |
|---|---|---|---|---|---|---|
| **Shopify theme** | SSR (Liquid or JSON template); eligible pages streamed | Shopify Storefront Renderer | Sections + blocks, theme schema | Theme preview → publish; Markets per country | Hosted checkout, outside the theme | 25/50 section/block model; streamed head |
| **Shopify headless** | Your framework (Hydrogen/Oxygen) | Your host | You build it | Your deploy | Storefront API + hosted checkout | Preview link; API versioning |
| **Wix** | SSR then browser re-render | Wix edge + Varnish cache | Free-form canvas; Studio grid/flexbox | Save → publish; Site History | Wix cart/checkout, hosted redirect | Cacheable HTML + separate visitor data + event invalidation |
| **Webflow** | Static build | Cloudflare | Visual designer on real CSS | Staging subdomain → publish; per-item CMS publish | Webflow Ecommerce (not studied here) | Publish as an artifact |
| **BigCommerce Stencil** | Server-side Handlebars on BC | BigCommerce backend | Page Builder + theme settings | Theme variations | Integrated cart/checkout | Theme variations per market |
| **BigCommerce Catalyst** | Next.js SSR/ISR | Your host, or BC Storefront Hosting (beta) | Code + Makeswift | Your deploy | GraphQL Storefront API | `[locale]` routes + messages |
| **Salesforce SFRA** | Server-side HTML/JS | B2C Commerce | Template/component overrides | Code deployment | Integrated | — |
| **Salesforce PWA Kit** | React SSR + hydration | Managed Runtime | Code | Bundle deploy | SCAPI + phased checkout | Phased rollout with an explicit seam |
| **Salesforce Storefront Next** | React Router 7 SSR | Managed Runtime | Code | Bundle deploy | SCAPI + phased checkout | Current recommended stack; hybrid with SFRA |
| **commercetools** | Whatever you build | Your host | Your choice | Your deploy | 300+ APIs (vendor claim) | API-first data contracts |

**ASSESSMENT.** The industry has converged on four things and disagrees only about the
fifth:

1. A **cacheable document** produced from data, not a client-side render.
2. A **constrained editor** over a typed content model.
3. **Draft and published as separate states**, with a preview.
4. **Media and localisation handled by the platform**, not per page.
5. *Where the editor lives* — schema (Shopify), canvas (Wix), CSS designer (Webflow), or
   code (Catalyst/PWA Kit/Storefront Next). We chose schema-plus-sections, which is the
   Shopify answer and the cheapest to operate.

---

## 6. Sources

| Topic | URL |
|---|---|
| Webflow hosting (Cloudflare, response time) | https://help.webflow.com/hc/en-us/articles/33961342422547-Webflow-hosting-overview |
| Webflow CMS collections/items/templates | https://help.webflow.com/hc/en-us/articles/33961307099027-Intro-to-the-Webflow-CMS |
| Webflow publishing, staging, per-item publish, roles | https://help.webflow.com/hc/en-us/articles/33961351954579-Publishing-overview |
| Webflow code export (Workspace plans) | https://help.webflow.com/hc/en-us/articles/33961386739347-How-do-I-export-my-Webflow-site-code |
| Webflow Cloud vs core hosting | https://webflow.com/hosting |
| Webflow breakpoints and cascading styles | https://help.webflow.com/hc/en-us/articles/33961300305811-Breakpoints-overview |
| BigCommerce storefront choice (Stencil vs Catalyst) | https://docs.bigcommerce.com/developer/docs/storefront/getting-started |
| Stencil: Handlebars, hosted, Page Builder, variations | https://docs.bigcommerce.com/developer/docs/storefront/stencil/getting-started/about-stencil |
| Catalyst overview | https://docs.bigcommerce.com/developer/docs/storefront/catalyst/overview |
| Catalyst structure (`app/[locale]`, messages, proxies) | https://docs.bigcommerce.com/developer/learn/courses/storefront-foundations/catalyst-architecture/conventions |
| Catalyst performance framing (Stencil request-time limit) | https://support.bigcommerce.com/s/article/Catalyst-High-Performance-Composability-for-Headless-Builds |
| Salesforce Composable Storefront (PWA Kit + MRT + SCAPI) | https://developer.salesforce.com/docs/commerce/commerce-api/guide/pwa-scapi.html |
| PWA Kit rendering, hydration, Retail React App | https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html |
| SFRA vs PWA Kit vs Storefront Next (recommended stack) | https://developer.salesforce.com/docs/commerce/b2c-commerce/guide/which-product.html |
| Storefront Next getting started | https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-get-started.html |
| Storefront Next hybrid with SFRA | https://developer.salesforce.com/docs/commerce/sfnext/guide/sfnext-hybrid.html |
| Phased headless rollout (PWA Kit + SFRA) | https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/phased-headless-rollouts.html |
| commercetools MACH principles | https://commercetools.com/mach-architecture |
| commercetools API-first, 300+ APIs, GraphQL coverage | https://commercetools.com/api-commerce |
| Composable stack layers (experience/application) | https://commercetools.com/blog/building-a-composable-tech-stack-for-b2c-commerce-a-comprehensive-guide |
