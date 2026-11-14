# Localization engine — architecture, audit and rollout

**Date:** 14 November 2026 · **Status:** foundation shipped, translation rollout not started
**Related:** `docs/04` (stack), `docs/13` (performance ledger), `2026-11-14-catering-menu-selection.md`

## Problem

EventsMa is English-only in its code, not just in its copy. A Coimbatore caterer can
plan a Tamil wedding, but the workspace, the customer link and the quotation are English
end to end. South Indian language support is a commercial requirement, not a nicety.

## Audit (measured against `main` @ `089c90f`)

| Surface | Finding |
|---|---|
| Routes | 47 pages; 124 `.tsx` files under `app/` and `components/` |
| Inline JSX copy | 59 files carry at least one capitalised user-facing string; **564** such strings measured by `scripts/i18n-audit.mjs` |
| Attribute copy | **396** `placeholder` / `title` / `label` / `description` / `aria-label` / `alt` strings |
| Error copy | 35 files hold `ERROR_COPY` / `SAVED_COPY` / inline error maps — these are the messages users actually read when something breaks |
| i18n tooling | **None installed.** No `next-intl`, no message catalogue, no locale type |
| Locale storage | No `locale` / `language` column on any profile table |
| Document language | `app/layout.tsx` hardcodes `lang="en-IN"` |
| Fonts | `inter-latin.woff2` + `playfair-display-latin.woff2` only — **Latin subsets**; Tamil, Telugu, Kannada and Malayalam glyphs fall through to whatever the OS provides |
| PDF | `lib/pdf/quote-pdf.tsx` hardcodes `Helvetica`, which has no Indic coverage. A Tamil quotation would print boxes today |

Rough corpus for translation: **960 strings** before business content (dishes, packages,
categories), which is per tenant and unbounded. The heaviest single screens are
event detail (56), photography (41), menu (35), decoration (33), makeup (33) and
settings (29) — extraction starts there because they carry the most copy per file.

## Three language layers (do not collapse them)

1. **Interface language** — one per user (`memberships`), changes navigation, forms,
   buttons, validation.
2. **Business content language** — per organisation. Dish names, package titles,
   descriptions. Stored as translations keyed to the existing row id, never duplicated
   rows.
3. **Customer communication language** — per customer/link. A Tamil quotation can come
   from an English workspace.

Precedence: explicit choice for this request → saved user preference → organisation
default → `en`. A customer link never inherits the owner's interface language.

## Decision: cookie-scoped locale, no `[locale]` route segment

`next-intl` was the obvious candidate. Its idiomatic setup prefixes every route
(`/ta/events/123`), which would rewrite 47 routes, every internal `Link`, the middleware,
the share/quote tokens and the sitemap — a high-risk diff for a product already serving
live links.

Instead: a `eventsma_locale` cookie read on the server, a typed catalogue, and one
`t()` helper. Consequences, stated plainly:

- No locale in the URL, so a shared link is language-agnostic; the public pages choose
  language from the cookie, then `Accept-Language`, then `en`.
- Server components translate at render, so there is no client bundle of all five
  languages.
- `next-intl` can still be adopted later behind the same `t()` signature; the catalogue
  is plain JSON-shaped TypeScript, not a framework lock-in.
- Losing the URL locale means a `ta` page cannot be linked from outside; if SEO per
  language ever matters, add `?lang=` and set the cookie from it.
- Reading the cookie in the root layout makes **every** route dynamic. Measured on
  this build: `/`, `/terms`, `/privacy`, `/forgot-password` and `/_not-found` stopped
  being prerendered. So the root layout keeps a static `lang="en-IN"`; Phase 3 reads
  the locale in the signed-in and public-link layouts (already dynamic) and gives the
  marketing pages a static route group that skips it. Verified by comparing
  `.next/prerender-manifest.json` before and after: 5 routes → 10.

Translation keys are stable identifiers (`nav.events`, `events.status.confirmed`).
Database values, API fields, route paths, permission keys and service keys are **never**
translated.

## Data model (planned, not yet migrated)

```
memberships.locale          text not null default 'en'   -- interface language
organisations.locale        text not null default 'en'   -- default for new members
organisations.doc_locale    text not null default 'en'   -- quotations, invoices, PDFs
service_item_translations   (org_id, item_id, locale, name, description)
menu_category_translations  (org_id, category_id, locale, name, description)
package_translations        (org_id, package_id, locale, title, description)
customer_links.locale       text                          -- language the customer chose
```

`service_items.name` stays the source language. Reads take
`COALESCE(translation, source)`, so a half-translated catalogue still renders.

## Typography

`--font-sans` now lists Noto Sans Tamil/Telugu/Kannada/Malayalam before the system
fallback, so Indic glyphs resolve to a real font when the device has one, without
shipping five font families in the critical path. Bundling subset fonts per script
(`next/font/local`, same pattern as `inter-latin.woff2`) is a follow-up once the first
script is live, because each face costs bytes on a mid-range Android phone.

PDFs need `Font.register` with a Noto TTF/OTF before any non-Latin quotation can be
produced. Till then, a Tamil PDF is a **known broken surface**, not a silent fallback.

## Rollout

| Phase | Work | Exit criteria |
|---|---|---|
| 1 | Foundation: locale registry, typed catalogue, `t()`, formatting, cookie | Done in this change |
| 2 | Extract strings per module into `messages/en/*`, no copy change | `en` output byte-identical to today |
| 3 | Tamil: full interface + customer link + validation | Native review sign-off; no English left in the Tamil flow |
| 4 | Business content translations + owner editor | A dish shows Tamil on the link, English in the workspace |
| 5 | Quotation/PDF language | Noto font embedded; Tamil PDF renders without boxes |
| 6 | Telugu, Kannada, Malayalam | Catalogue completeness > 98%, checked by script |
| 7 | Notifications and emails | Recipient locale honoured, English fallback proven |

## Failure modes

| Failure | Handling |
|---|---|
| Missing key | Falls back to English, then to the key path (loud, so it is caught) |
| Missing translation for a dish | Falls back to the source-language name |
| Text expansion breaking a button | Flexible widths; no fixed-width labels; test the longest string |
| User switches language mid-form | Cookie change + `router.refresh()` keeps the route and form state |
| Font unavailable | Per-glyph fallback stack; never a tofu box in the workspace |
| Wrong locale on a PDF | Document locale is stored per quotation, not read at render time |

## Acceptance tests

- `resolveLocale` maps `ta-IN` → `ta`, unknown → `en`.
- `t()` interpolates, falls back to English, and returns the key path when absent.
- `formatPaise` keeps integers and renders `₹4,87,500` under `en-IN` and `ta-IN`.
- Coverage script reports per-locale completeness so a half-finished language is visible
  in CI rather than discovered by a customer.

## What this change does NOT do

It does **not** translate a single screen. Shipping a language selector over an
untranslated app would produce exactly the "English app with a dropdown" the brief warns
against. The selector is deferred to Phase 3, when the Tamil catalogue is complete enough
to be coherent.

Translations themselves need a native reviewer. Machine output for catering, legal and
financial wording is not acceptable in production copy.
